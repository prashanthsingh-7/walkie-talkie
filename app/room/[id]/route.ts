import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const roomId = params.id

  // Validate room ID format (you can add more validation if needed)
  if (!roomId || typeof roomId !== 'string' || roomId.length !== 6) {
    return new NextResponse('Invalid room ID', { status: 400 })
  }

  return NextResponse.json({ roomId })
} 