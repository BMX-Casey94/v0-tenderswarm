import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    console.log('[v0] Stopping provider simulator')

    return NextResponse.json({
      status: 'Simulator stopped',
      message: 'Provider network has been stopped',
    })

  } catch (error) {
    console.error('Error stopping simulator:', error)
    return NextResponse.json(
      { error: 'Failed to stop simulator' },
      { status: 500 }
    )
  }
}
