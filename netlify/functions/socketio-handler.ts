import { Handler } from '@netlify/functions'
import { Server } from 'socket.io'
import { createServer } from 'http'

const httpServer = createServer()
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
})

interface User {
  id: string
  username: string
  isHost: boolean
}

interface Message {
  id: string
  sender: string
  content: string
  type: "text" | "image"
  timestamp: number
}

// In-memory storage (note: this will reset on function cold starts)
const rooms = new Map<string, Set<User>>()
const messages = new Map<string, Message[]>()

io.on("connection", (socket) => {
  console.log("New client connected")
  
  const { roomId, username, isHost } = socket.handshake.query

  if (!roomId || typeof roomId !== "string" || !username || typeof username !== "string") {
    socket.disconnect()
    return
  }

  const user: User = {
    id: socket.id,
    username: username,
    isHost: isHost === "true",
  }

  // Join room
  socket.join(roomId)
  console.log(`User ${username} joined room ${roomId}`)

  // Initialize room if it doesn't exist
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set())
    messages.set(roomId, [])
  }

  // Add user to room
  const roomUsers = rooms.get(roomId)!
  roomUsers.add(user)

  // Send current users to all users in the room
  io.to(roomId).emit("users", Array.from(roomUsers))

  // Send current messages to the new user
  socket.emit("messages", messages.get(roomId) || [])

  // Notify others that a new user has joined
  socket.to(roomId).emit("user-joined", user)

  // Handle new messages
  socket.on("send-message", (message: Omit<Message, "id">) => {
    console.log(`New message in room ${roomId}: ${message.content}`)
    
    const newMessage: Message = {
      ...message,
      id: Math.random().toString(36).substring(7),
    }

    const roomMessages = messages.get(roomId) || []
    roomMessages.push(newMessage)
    messages.set(roomId, roomMessages)

    io.to(roomId).emit("message", newMessage)
  })

  // Handle typing indicator
  socket.on("typing", () => {
    socket.to(roomId).emit("typing", username)
  })

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`User ${username} disconnected from room ${roomId}`)
    
    const roomUsers = rooms.get(roomId)
    if (roomUsers) {
      const user = Array.from(roomUsers).find((u) => u.id === socket.id)
      if (user) {
        roomUsers.delete(user)
        io.to(roomId).emit("users", Array.from(roomUsers))
        io.to(roomId).emit("user-left", user)
      }

      // Clean up empty rooms
      if (roomUsers.size === 0) {
        rooms.delete(roomId)
        messages.delete(roomId)
      }
    }
  })
})

export const handler: Handler = async (event, context) => {
  if (event.httpMethod === 'GET') {
    // Handle WebSocket upgrade
    return {
      statusCode: 101,
      headers: {
        'Upgrade': 'websocket',
        'Connection': 'Upgrade',
        'Sec-WebSocket-Accept': event.headers['Sec-WebSocket-Key'],
      },
    }
  }

  return {
    statusCode: 200,
    body: 'Socket.IO server is running',
  }
} 