"use client"

import { User, Crown } from "lucide-react"
import { motion } from "framer-motion"

interface UserProps {
  id: string
  username: string
  isHost: boolean
}

interface UserListProps {
  users: UserProps[]
  currentUsername: string
}

export default function UserList({ users, currentUsername }: UserListProps) {
  return (
    <div className="p-2">
      {users.length === 0 ? (
        <p className="text-center text-muted-foreground p-4">No users in the room</p>
      ) : (
        <ul className="space-y-2">
          {users.map((user, index) => (
            <motion.li
              key={user.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ x: 5 }}
              className="flex items-center p-3 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <div
                className={`rounded-full p-2 mr-3 ${
                  user.isHost ? "bg-gradient-to-r from-primary/20 to-secondary/20" : "bg-slate-200 dark:bg-slate-700"
                }`}
              >
                <User className={`h-5 w-5 ${user.isHost ? "text-primary" : "text-slate-600 dark:text-slate-300"}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center">
                  <span className={`font-medium ${user.username === currentUsername ? "text-primary" : ""}`}>
                    {user.username}
                    {user.username === currentUsername && " (You)"}
                  </span>
                  {user.isHost && (
                    <motion.div
                      animate={{ rotate: [0, 10, 0, -10, 0] }}
                      transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2, repeatDelay: 1 }}
                    >
                      <Crown className="h-4 w-4 text-amber-500 ml-1" />
                    </motion.div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{user.isHost ? "Host" : "Participant"}</p>
              </div>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  )
}

