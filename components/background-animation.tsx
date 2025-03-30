"use client"
import { motion } from "framer-motion"

export default function BackgroundAnimation() {
  return (
    <>
      {/* Gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-violet-500 via-fuchsia-400 to-cyan-500 animate-gradient" />

      {/* Floating circles */}
      <div className="fixed inset-0 overflow-hidden">
        <motion.div
          className="absolute w-64 h-64 rounded-full bg-white/10 backdrop-blur-md"
          initial={{ x: "10%", y: "10%" }}
          animate={{
            x: ["10%", "60%", "30%", "10%"],
            y: ["10%", "40%", "70%", "10%"],
          }}
          transition={{
            duration: 20,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        />

        <motion.div
          className="absolute w-48 h-48 rounded-full bg-secondary/10 backdrop-blur-md"
          initial={{ x: "70%", y: "30%" }}
          animate={{
            x: ["70%", "20%", "50%", "70%"],
            y: ["30%", "60%", "20%", "30%"],
          }}
          transition={{
            duration: 25,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        />

        <motion.div
          className="absolute w-32 h-32 rounded-full bg-accent/10 backdrop-blur-md"
          initial={{ x: "40%", y: "80%" }}
          animate={{
            x: ["40%", "80%", "10%", "40%"],
            y: ["80%", "30%", "50%", "80%"],
          }}
          transition={{
            duration: 18,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Mesh grid overlay */}
      <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center opacity-20" />
    </>
  )
}

