"use client"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface Message {
  id: string
  sender: string
  content: string
  type: "text" | "image"
  timestamp: number
}

interface ChatMessageProps {
  message: Message
  isOwnMessage: boolean
}

export default function ChatMessage({ message, isOwnMessage }: ChatMessageProps) {
  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <div className={cn("flex mb-4", isOwnMessage ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[80%]", isOwnMessage ? "order-2" : "order-1")}>
        <div className="flex flex-col">
          <span className={cn("text-xs mb-1", isOwnMessage ? "text-right" : "text-left")}>
            {isOwnMessage ? "You" : message.sender} • {formattedTime}
          </span>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Card
              className={cn(
                "overflow-hidden",
                isOwnMessage
                  ? "bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/20"
                  : "bg-white dark:bg-slate-800 shadow-md",
              )}
            >
              <CardContent className={cn("p-3", message.type === "image" ? "p-1" : "")}>
                {message.type === "text" ? (
                  <p className="whitespace-pre-wrap break-words">{message.content}</p>
                ) : (
                  <img
                    src={message.content || "/placeholder.svg"}
                    alt="Shared image"
                    className="max-w-full rounded"
                    style={{ maxHeight: "300px" }}
                    loading="lazy"
                  />
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

