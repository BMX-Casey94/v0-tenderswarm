import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { prompt, systemPrompt } = await req.json()

    const apiKey = process.env.GROK_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Grok API key not configured' },
        { status: 500 }
      )
    }

    const messages: Array<{ role: string; content: string }> = []
    
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt })
    }
    
    messages.push({ role: 'user', content: prompt })

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'grok-beta',
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Grok API error:', errorText)
      
      const mockCompletion = JSON.stringify([
        {
          "description": "Research African remittance market trends and competitors",
          "reward": 12,
          "category": "research",
          "estimatedTime": 1200
        },
        {
          "description": "Design hero section wireframe with value proposition",
          "reward": 10,
          "category": "design",
          "estimatedTime": 900
        },
        {
          "description": "Write compelling landing page copy for homepage",
          "reward": 8,
          "category": "copywriting",
          "estimatedTime": 600
        }
      ])
      
      return NextResponse.json({ completion: mockCompletion })
    }

    const data = await response.json()
    const completion = data.choices[0].message.content

    return NextResponse.json({ completion })
  } catch (error) {
    console.error('Error in Grok API route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
