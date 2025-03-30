"use client"

import React from "react"

import { useEffect, useState, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { io, type Socket } from "socket.io-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Send, ImageIcon, Users, X, Radio } from "lucide-react"
import Link from "next/link"
import ChatMessage from "@/components/chat-message"
import UserList from "@/components/user-list"
import { useToast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from "framer-motion"

interface Message {
  id: string
  sender: string
  content: string
  type: "text" | "image"
  timestamp: number
}

interface User {
  id: string
  username: string
  isHost: boolean
}

export default function Room({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params)
  const searchParams = useSearchParams()
  const username = searchParams.get("username") || "Anonymous"
  const isHost = searchParams.get("host") === "true"
  const roomId = resolvedParams.id

  const [socket, setSocket] = useState<Socket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [message, setMessage] = useState("")
  const [showUsers, setShowUsers] = useState(false)
  const [connected, setConnected] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001", {
      path: "/.netlify/edge-functions/socketio",
      transports: ["websocket"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      query: {
        roomId,
        username,
        isHost: isHost ? "true" : "false",
      },
    })

    socketInstance.on("connect", () => {
      setConnected(true)
      toast({
        title: "Connected to room",
        description: `You've joined room ${roomId}`,
      })
    })

    socketInstance.on("disconnect", () => {
      setConnected(false)
      toast({
        title: "Disconnected",
        description: "You've been disconnected from the room",
        variant: "destructive",
      })
    })

    socketInstance.on("message", (newMessage: Message) => {
      setMessages((prev) => [...prev, newMessage])
    })

    socketInstance.on("users", (roomUsers: User[]) => {
      setUsers(roomUsers)
    })

    socketInstance.on("user-joined", (user: User) => {
      toast({
        title: "User joined",
        description: `${user.username} has joined the room`,
      })
    })

    socketInstance.on("user-left", (user: User) => {
      toast({
        title: "User left",
        description: `${user.username} has left the room`,
        variant: "destructive",
      })
    })

    socketInstance.on("typing", (user: string) => {
      if (user !== username) {
        setIsTyping(true)
        setTimeout(() => setIsTyping(false), 3000)
      }
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [roomId, username, isHost, toast])

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = () => {
    if (!message.trim() || !socket || !connected) return

    const newMessage: Omit<Message, "id"> = {
      sender: username,
      content: message,
      type: "text",
      timestamp: Date.now(),
    }

    socket.emit("send-message", newMessage)
    setMessage("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleTyping = () => {
    if (socket && connected) {
      socket.emit("typing", username)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !socket || !connected) return

    const file = e.target.files[0]
    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      toast({
        title: "File too large",
        description: "Image must be less than 5MB",
        variant: "destructive",
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target && typeof event.target.result === "string") {
        const newMessage: Omit<Message, "id"> = {
          sender: username,
          content: event.target.result,
          type: "image",
          timestamp: Date.now(),
        }

        socket.emit("send-message", newMessage)
      }
    }
    reader.readAsDataURL(file)

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-violet-500/10 via-fuchsia-400/10 to-cyan-500/10">
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-md p-4 border-b border-white/20">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center">
            <motion.div whileHover={{ x: -5 }} whileTap={{ scale: 0.9 }}>
              <Link href="/">
                <Button variant="ghost" size="icon" className="mr-2 rounded-full">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
            </motion.div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Room: {roomId}
              </h1>
              <p className="text-sm text-muted-foreground">
                {connected ? (
                  <span className="flex items-center">
                    <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                    Connected
                  </span>
                ) : (
                  <span className="flex items-center">
                    <span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>
                    Disconnected
                  </span>
                )}{" "}
                • {users.length} users
              </p>
            </div>
          </div>
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowUsers(!showUsers)}
              className="rounded-full bg-white/50 dark:bg-slate-800/50 shadow-sm"
            >
              <Users className="h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative max-w-4xl w-full mx-auto">
        {/* Chat messages */}
        <div className="h-full overflow-y-auto p-4 pb-20">
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col items-center justify-center h-full text-center text-muted-foreground"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4 animate-pulse-slow">
                <Radio className="h-10 w-10 text-primary" />
              </div>
              <p className="mb-2 text-lg">No messages yet</p>
              <p className="text-sm">Start the conversation by sending a message</p>
            </motion.div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((msg, index) => (
                <motion.div
                  key={msg.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChatMessage message={msg} isOwnMessage={msg.sender === username} />
                </motion.div>
              ))}
            </AnimatePresence>
          )}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sm text-muted-foreground italic ml-4"
            >
              Someone is typing...
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* User list sidebar */}
        <AnimatePresence>
          {showUsers && (
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute top-0 right-0 h-full w-72 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-lg z-10"
            >
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="font-semibold">Users ({users.length})</h2>
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Button variant="ghost" size="icon" onClick={() => setShowUsers(false)} className="rounded-full">
                    <X className="h-4 w-4" />
                  </Button>
                </motion.div>
              </div>
              <UserList users={users} currentUsername={username} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Message input */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="absolute bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t p-4"
        >
          <div className="flex items-center gap-2 max-w-4xl mx-auto">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-full"
              >
                <ImageIcon className="h-5 w-5" />
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </Button>
            </motion.div>
            <Input
              placeholder="Type a message..."
              value={message}
              onChange={(e) => {
                setMessage(e.target.value)
                handleTyping()
              }}
              onKeyDown={handleKeyDown}
              disabled={!connected}
              className="flex-1 h-12 rounded-full border-2 px-4"
            />
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                onClick={sendMessage}
                disabled={!message.trim() || !connected}
                className="rounded-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 h-12 w-12 p-0"
              >
                <Send className="h-5 w-5" />
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}

