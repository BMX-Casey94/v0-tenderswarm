import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 300 // 5 minutes for background function

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { brief, budget } = body

    if (!brief || !budget) {
      return NextResponse.json(
        { error: 'Brief and budget are required' },
        { status: 400 }
      )
    }

    // In production, this would trigger a Vercel Background Function
    // For now, return immediate response indicating swarm has started
    const swarmId = `swarm-${Date.now()}`

    return NextResponse.json({
      status: 'Swarm started',
      swarmId,
      message: 'Agent orchestration running in background',
    }, { status: 202 })

  } catch (error) {
    console.error('Error starting swarm:', error)
    return NextResponse.json(
      { error: 'Failed to start swarm' },
      { status: 500 }
    )
  }
}
