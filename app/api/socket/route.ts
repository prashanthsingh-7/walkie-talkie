import type { Server as NetServer } from "http"
import { Server as SocketIOServer } from "socket.io"
import type { NextRequest } from "next/server"

export const dynamic = "force-dynamic"

// Store active rooms and users in memory (ephemeral storage)
const rooms = new Map()

export async function GET(req: NextRequest) {
  // This is a workaround to make Socket.IO work with Next.js App Router
  const res = new Response(null, { status: 200 })

  // @ts-ignore - res.socket is available but not in the types
  const socket = res.socket as any
  if (socket && socket.server && !socket.server.io) {
    const httpServer: NetServer = socket.server
    const io = new SocketIOServer(httpServer, {
      path: "/api/socket",
      addTrailingSlash: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    })

    io.on("connection", (socket) => {
      const { roomId, username, isHost } = socket.handshake.query
      const userId = socket.id

      if (!roomId || !username) {
        socket.disconnect()
        return
      }

      // Join the room
      socket.join(roomId)

      // Initialize room if it doesn't exist
      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Map())
      }

      // Add user to room
      const user = {
        id: userId,
        username,
        isHost: isHost === "true",
      }

      rooms.get(roomId).set(userId, user)

      // Broadcast user list to all clients in the room
      const users = Array.from(rooms.get(roomId).values())
      io.to(roomId).emit("users", users)

      // Notify others that a user has joined
      socket.to(roomId).emit("user-joined", user)

      // Handle messages
      socket.on("send-message", (message) => {
        const messageWithId = {
          ...message,
          id: Date.now().toString(),
        }
        io.to(roomId).emit("message", messageWithId)
      })

      // Handle disconnection
      socket.on("disconnect", () => {
        if (rooms.has(roomId)) {
          const user = rooms.get(roomId).get(userId)
          rooms.get(roomId).delete(userId)

          // If room is empty, delete it
          if (rooms.get(roomId).size === 0) {
            rooms.delete(roomId)
          } else {
            // Notify others that a user has left
            socket.to(roomId).emit("user-left", user)

            // Update user list
            const users = Array.from(rooms.get(roomId).values())
            io.to(roomId).emit("users", users)
          }
        }
      })
    })

    // Store the Socket.IO server instance
    socket.server.io = io
  }

  return res
}

