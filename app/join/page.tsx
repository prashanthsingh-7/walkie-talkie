"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import BackgroundAnimation from "@/components/background-animation"

export default function JoinRoom() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [roomId, setRoomId] = useState("")

  const handleJoinRoom = () => {
    if (!username.trim() || !roomId.trim()) return
    router.push(`/room/${roomId}?username=${encodeURIComponent(username)}`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <BackgroundAnimation />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10 px-4"
      >
        <Card className="w-full backdrop-blur-sm bg-white/90 dark:bg-slate-900/90 shadow-xl border-0">
          <CardHeader>
            <div className="flex items-center">
              <motion.div whileHover={{ x: -5 }} whileTap={{ scale: 0.9 }}>
                <Link href="/" className="mr-2">
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </Link>
              </motion.div>
              <div>
                <CardTitle className="text-2xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Join a Room
                </CardTitle>
                <CardDescription>Enter your username and the room ID to join</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="space-y-2"
            >
              <Label htmlFor="username">Your Username</Label>
              <Input
                id="username"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-12 border-2"
              />
            </motion.div>
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="space-y-2"
            >
              <Label htmlFor="roomId">Room ID</Label>
              <Input
                id="roomId"
                placeholder="Enter room ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                className="h-12 border-2 font-mono text-lg tracking-wider text-center"
                maxLength={6}
              />
            </motion.div>
          </CardContent>
          <CardFooter>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="w-full">
              <Button
                className="w-full h-12 bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all duration-300 shadow-lg shadow-primary/20"
                onClick={handleJoinRoom}
                disabled={!username.trim() || !roomId.trim()}
              >
                Join Room
              </Button>
            </motion.div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}

