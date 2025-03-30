"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowRight, Radio } from "lucide-react"
import { motion } from "framer-motion"
import BackgroundAnimation from "@/components/background-animation"

export default function Home() {
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
          <CardHeader className="text-center space-y-2">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: 0.1,
              }}
              className="flex justify-center"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-2">
                <Radio className="h-8 w-8 text-white" />
              </div>
            </motion.div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Walkie Talkie
            </CardTitle>
            <CardDescription className="text-base">
              Create or join a room to start chatting in real-time
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Link href="/create" className="w-full">
                  <Button
                    className="w-full h-16 text-lg bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all duration-300 shadow-lg shadow-primary/20"
                    size="lg"
                  >
                    Create a Room
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Link href="/join" className="w-full">
                  <Button className="w-full h-16 text-lg border-2 shadow-lg" variant="outline" size="lg">
                    Join a Room
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

