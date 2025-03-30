import { Server } from "socket.io"
import { createServer } from "http"
import express from "express"
import cors from "cors"

const app = express()
app.use(cors())

const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  path: "/socket.io/",
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

const rooms = new Map<string, Set<User>>()
const messages = new Map<string, Message[]>()

io.on("connection", (socket) => {
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

// For local development
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3001
  httpServer.listen(PORT, () => {
    console.log(`Socket.IO server running on port ${PORT}`)
  })
}

// For Vercel deployment
export default app 