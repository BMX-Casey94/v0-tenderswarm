// SSE endpoint for real-time swarm updates
import { SwarmOrchestrator } from "@/lib/agents/swarm-orchestrator"
import type { ClientBrief, SwarmEvent } from "@/lib/types"

export const maxDuration = 300 // 5 minutes

export async function POST(req: Request) {
  const { brief, budget, contractAddress, txHash, isDemoMode, userAddress } = await req.json()

  if (!brief || !budget) {
    return new Response(JSON.stringify({ error: "Brief and budget required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  const clientBrief: ClientBrief = {
    id: `brief-${Date.now()}`,
    text: brief,
    budget: Number(budget),
    createdAt: new Date(),
    paymentTxHash: txHash || undefined,
  }

  const contract =
    contractAddress || process.env.NEXT_PUBLIC_TENDER_ESCROW_ADDRESS || "0x0000000000000000000000000000000000000000"

  // Create SSE stream
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const orchestrator = new SwarmOrchestrator()

      const sendEvent = (event: SwarmEvent) => {
        const data = JSON.stringify(event)
        controller.enqueue(encoder.encode(`data: ${data}\n\n`))
      }

      if (txHash) {
        sendEvent({
          type: "message",
          data: {
            id: `msg-payment-${Date.now()}`,
            agent: "Coordinator",
            message: isDemoMode
              ? `Demo mode payment: ${txHash.slice(0, 10)}...`
              : `Payment confirmed on Ethereum: ${txHash.slice(0, 10)}...${txHash.slice(-8)}`,
            timestamp: new Date(),
            type: "info",
          },
          timestamp: new Date(),
        })
      }

      try {
        await orchestrator.execute(clientBrief, contract, sendEvent, isDemoMode || false, userAddress)
      } catch (error) {
        sendEvent({
          type: "error",
          data: { error: error instanceof Error ? error.message : "Unknown error" },
          timestamp: new Date(),
        })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
