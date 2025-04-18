import { Context } from '@netlify/edge-functions'

// Store for rooms and messages (note: this is in-memory and will reset when the function cold starts)
const rooms = new Map()
const messages = new Map()

interface User {
  id: string
  username: string
  isHost: boolean
  socket: WebSocket
}

export default async (request: Request, context: Context) => {
  // Add CORS headers
  const headers = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Private-Network': 'true',
    'Access-Control-Allow-Credentials': 'true',
  })

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers })
  }

  // Check if it's a WebSocket request
  const upgrade = request.headers.get('upgrade')?.toLowerCase()
  if (upgrade !== 'websocket') {
    return new Response('Expected Upgrade: websocket', { 
      status: 426,
      headers: {
        ...headers,
        'Upgrade': 'websocket',
        'Connection': 'Upgrade'
      }
    })
  }

  const url = new URL(request.url)
  const roomId = url.searchParams.get('roomId')
  const username = url.searchParams.get('username')
  const isHost = url.searchParams.get('isHost') === 'true'

  if (!roomId || !username) {
    return new Response('Missing roomId or username', { status: 400, headers })
  }

  try {
    // Create WebSocket connection
    const webSocketPair = new WebSocketPair()
    const [client, server] = Object.values(webSocketPair)

    // Initialize room if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set())
      messages.set(roomId, [])
    }

    const roomUsers = rooms.get(roomId)
    const user: User = {
      id: crypto.randomUUID(),
      username,
      isHost,
      socket: server
    }

    server.accept()

    server.addEventListener('open', () => {
      console.log(`User ${username} connected to room ${roomId}`)
      // Add user to room
      roomUsers.add(user)

      // Send initial state
      server.send(JSON.stringify({
        type: 'users',
        data: Array.from(roomUsers).map(({ id, username, isHost }) => ({ id, username, isHost }))
      }))

      server.send(JSON.stringify({
        type: 'messages',
        data: messages.get(roomId)
      }))

      // Notify others
      broadcastToRoom(roomId, {
        type: 'user-joined',
        data: { id: user.id, username: user.username, isHost: user.isHost }
      }, server)
    })

    server.addEventListener('message', async (event) => {
      try {
        const message = JSON.parse(event.data)
        console.log(`Received message from ${username}:`, message)
        
        switch (message.type) {
          case 'ping':
            server.send(JSON.stringify({ type: 'pong' }))
            break
            
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
            }, server)
            break
        }
      } catch (error) {
        console.error(`Error processing message from ${username}:`, error)
      }
    })

    server.addEventListener('close', () => {
      console.log(`User ${username} disconnected from room ${roomId}`)
      roomUsers.delete(user)
      broadcastToRoom(roomId, {
        type: 'user-left',
        data: { id: user.id, username: user.username, isHost: user.isHost }
      })

      if (roomUsers.size === 0) {
        rooms.delete(roomId)
        messages.delete(roomId)
      }
    })

    server.addEventListener('error', (error) => {
      console.error(`WebSocket error for user ${username}:`, error)
    })

    return new Response(null, {
      status: 101,
      webSocket: client,
      headers: {
        'Upgrade': 'websocket',
        'Connection': 'Upgrade'
      }
    })
  } catch (err) {
    console.error('WebSocket creation failed:', err)
    return new Response('WebSocket creation failed', { status: 500, headers })
  }
}

function broadcastToRoom(roomId: string, message: any, excludeSocket?: WebSocket) {
  const roomUsers = rooms.get(roomId)
  if (!roomUsers) return

  const messageStr = JSON.stringify(message)
  for (const user of roomUsers) {
    if (user.socket && user.socket !== excludeSocket && user.socket.readyState === 1) {
      try {
        user.socket.send(messageStr)
      } catch (error) {
        console.error(`Failed to send message to user ${user.username}:`, error)
      }
    }
  }
} 