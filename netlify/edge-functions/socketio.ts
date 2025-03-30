import { createClient } from '@supabase/supabase-js'
import { Server } from 'socket.io'
import { Context } from '@netlify/edge-functions'

export default async (request: Request, context: Context) => {
  const upgradeHeader = request.headers.get('Upgrade')
  if (!upgradeHeader || upgradeHeader !== 'websocket') {
    return new Response('Expected websocket', { status: 426 })
  }

  const { socket, response } = Deno.upgradeWebSocket(request)
  
  socket.onopen = () => {
    console.log('Socket connected!')
  }

  socket.onmessage = (event) => {
    console.log('Socket message:', event.data)
    // Echo the message back
    socket.send(event.data)
  }

  socket.onerror = (error) => {
    console.error('Socket error:', error)
  }

  socket.onclose = () => {
    console.log('Socket closed!')
  }

  return response
} 