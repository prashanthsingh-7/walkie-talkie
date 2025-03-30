import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const roomId = params.id

  // Validate room ID format
  if (!roomId || typeof roomId !== 'string' || roomId.length !== 6) {
    return new NextResponse('Invalid room ID', { status: 400 })
  }

  // Return room information
  return NextResponse.json({
    roomId,
    status: 'active',
    timestamp: Date.now()
  })
}

// Handle WebSocket upgrade requests
export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Private-Network': 'true',
      'Access-Control-Allow-Credentials': 'true',
    },
  })
} 