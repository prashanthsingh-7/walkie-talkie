import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const roomId = params.id

    // Basic validation for room ID format
    if (!roomId || typeof roomId !== 'string' || roomId.length !== 6) {
      return NextResponse.json(
        { error: 'Invalid room ID format' },
        { status: 400 }
      )
    }

    // Return room information
    return NextResponse.json({
      roomId,
      status: 'active',
      timestamp: Date.now()
    })
  } catch (error) {
    console.error('Room validation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Max-Age': '86400',
    },
  })
} 