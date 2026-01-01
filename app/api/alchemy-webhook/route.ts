// Simple in-memory event queue - modern pattern used by winning autonomous agent projects
// Alchemy webhook POSTs here → Simulator polls via GET

let pendingTenders: any[] = []

export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    // Alchemy sends events in this format
    // Check for address activity or custom webhook format
    if (body.type === 'ADDRESS_ACTIVITY' || body.event) {
      const event = body.event || body
      
      // Extract tender data from the event logs
      if (event.activity || event.logs) {
        const logs = event.activity || event.logs
        
        // Add to pending queue
        pendingTenders.push({
          timestamp: new Date().toISOString(),
          data: body,
        })
        
        console.log('[v0] Tender event queued:', pendingTenders.length, 'pending')
      }
    }
    
    return Response.json({ ok: true, queued: pendingTenders.length })
  } catch (error) {
    console.error('[v0] Webhook error:', error)
    return Response.json({ error: 'Invalid payload' }, { status: 400 })
  }
}

// Simulator polls this endpoint every 2-3 seconds
export async function GET() {
  const batch = [...pendingTenders]
  pendingTenders = [] // Clear the queue
  return Response.json(batch)
}
