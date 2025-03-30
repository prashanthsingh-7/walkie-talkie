import { Context } from '@netlify/edge-functions'

// Store for rooms and messages (note: this is in-memory and will reset when the function cold starts)
const rooms = new Map()
const messages = new Map()

export default async (request: Request, context: Context) => {
  const upgradeHeader = request.headers.get('Upgrade')
  if (!upgradeHeader || upgradeHeader !== 'websocket') {
    return new Response('Expected websocket', { status: 426 })
  }

  const url = new URL(request.url)
  const roomId = url.searchParams.get('roomId')
  const username = url.searchParams.get('username')
  const isHost = url.searchParams.get('isHost') === 'true'

  if (!roomId || !username) {
    return new Response('Missing roomId or username', { status: 400 })
  }

  const { socket, response } = Deno.upgradeWebSocket(request)

  // Initialize room if it doesn't exist
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set())
    messages.set(roomId, [])
  }

  const user = { id: crypto.randomUUID(), username, isHost }
  const roomUsers = rooms.get(roomId)
  
  socket.onopen = () => {
    console.log(`User ${username} connected to room ${roomId}`)
    roomUsers.add(user)

    // Send current users and messages to the new user
    socket.send(JSON.stringify({
      type: 'users',
      data: Array.from(roomUsers)
    }))

    socket.send(JSON.stringify({
      type: 'messages',
      data: messages.get(roomId)
    }))

    // Notify others about the new user
    broadcastToRoom(roomId, {
      type: 'user-joined',
      data: user
    }, socket)
  }

  socket.onmessage = (event) => {
    const message = JSON.parse(event.data)
    
    switch (message.type) {
      case 'send-message':
        const newMessage = {
          ...message.data,
          id: crypto.randomUUID(),
          timestamp: Date.now()
        }
        messages.get(roomId).push(newMessage)
        broadcastToRoom(roomId, {
          type: 'message',
          data: newMessage
        })
        break

      case 'typing':
        broadcastToRoom(roomId, {
          type: 'typing',
          data: username
        }, socket)
        break
    }
  }

  socket.onclose = () => {
    console.log(`User ${username} disconnected from room ${roomId}`)
    roomUsers.delete(user)

    broadcastToRoom(roomId, {
      type: 'user-left',
      data: user
    })

    // Clean up empty rooms
    if (roomUsers.size === 0) {
      rooms.delete(roomId)
      messages.delete(roomId)
    }
  }

  return response
}

function broadcastToRoom(roomId: string, message: any, excludeSocket?: WebSocket) {
  const roomUsers = rooms.get(roomId)
  if (!roomUsers) return

  const messageStr = JSON.stringify(message)
  for (const user of roomUsers) {
    if (user.socket && user.socket !== excludeSocket) {
      user.socket.send(messageStr)
    }
  }
} 