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
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Upgrade, Connection',
    'Access-Control-Allow-Private-Network': 'true',
  })

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers })
  }

  // Check if it's a WebSocket request
  if (request.headers.get("upgrade") !== "websocket") {
    return new Response(`Expected Upgrade: websocket`, { 
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
    const { socket, response } = Deno.upgradeWebSocket(request, {
      idleTimeout: 60, // 60 seconds
      protocol: "websocket"
    })

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
      socket
    }

    socket.onopen = () => {
      // Add user to room
      roomUsers.add(user)

      // Send initial state
      socket.send(JSON.stringify({
        type: 'users',
        data: Array.from(roomUsers).map(({ id, username, isHost }) => ({ id, username, isHost }))
      }))

      socket.send(JSON.stringify({
        type: 'messages',
        data: messages.get(roomId)
      }))

      // Notify others
      broadcastToRoom(roomId, {
        type: 'user-joined',
        data: { id: user.id, username: user.username, isHost: user.isHost }
      }, socket)
    }

    socket.onmessage = async (event) => {
      try {
        const message = JSON.parse(event.data)
        switch (message.type) {
          case 'ping':
            socket.send(JSON.stringify({ type: 'pong' }))
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
            }, socket)
            break
        }
      } catch (error) {
        console.error('Error processing message:', error)
      }
    }

    socket.onclose = () => {
      roomUsers.delete(user)
      broadcastToRoom(roomId, {
        type: 'user-left',
        data: { id: user.id, username: user.username, isHost: user.isHost }
      })

      if (roomUsers.size === 0) {
        rooms.delete(roomId)
        messages.delete(roomId)
      }
    }

    socket.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    // Add WebSocket-specific headers
    const wsHeaders = new Headers(response.headers)
    wsHeaders.set('Upgrade', 'websocket')
    wsHeaders.set('Connection', 'Upgrade')
    wsHeaders.set('Sec-WebSocket-Protocol', 'websocket')

    return new Response(null, {
      ...response,
      headers: wsHeaders
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