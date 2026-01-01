// Provider Simulator - simulates a network of providers responding to tenders

import { AI_PROVIDERS, type AIProvider } from "@/lib/agents/ai-providers"

interface TenderEvent {
  id: number
  task: string
  reward: number
  timestamp: Date
}

export class ProviderSimulator {
  private providers: AIProvider[] = []
  private isRunning = false
  private pollInterval: NodeJS.Timeout | null = null

  constructor() {
    this.providers = AI_PROVIDERS.filter((p) => p.isActive)
  }

  startPolling(onTenderDetected: (tender: TenderEvent) => void) {
    if (this.isRunning) {
      console.log("[v0] Already polling for tenders")
      return
    }

    this.isRunning = true
    console.log("[v0] Starting tender polling...")

    // Poll the webhook endpoint every 3 seconds
    this.pollInterval = setInterval(async () => {
      try {
        const response = await fetch("/api/alchemy-webhook")
        const events = await response.json()

        if (events.length > 0) {
          console.log("[v0] Processing", events.length, "new tender(s)")

          for (const event of events) {
            // Parse tender data from Alchemy event
            const tender = this.parseAlchemyEvent(event)
            if (tender) {
              onTenderDetected(tender)
            }
          }
        }
      } catch (error) {
        console.error("[v0] Polling error:", error)
      }
    }, 3000) // Poll every 3 seconds
  }

  private parseAlchemyEvent(event: any): TenderEvent | null {
    try {
      // Extract tender ID and data from the Alchemy event
      // This would parse the actual log data from your TenderCreated event
      const data = event.data

      // For demo purposes, generate mock data
      // In production, you'd decode the actual log parameters
      return {
        id: Math.floor(Math.random() * 10000),
        task: "Tender from blockchain",
        reward: 1000000000000000000, // 1 MNEE
        timestamp: new Date(event.timestamp || Date.now()),
      }
    } catch (error) {
      console.error("[v0] Failed to parse event:", error)
      return null
    }
  }

  start() {
    this.isRunning = true
  }

  stop() {
    this.isRunning = false
    if (this.pollInterval) {
      clearInterval(this.pollInterval)
      this.pollInterval = null
    }
  }

  async simulateResponses(
    tenderEvent: TenderEvent,
    onSubmission: (submission: {
      tenderId: number
      provider: string
      providerName: string
      deliverableURI: string
      timestamp: Date
    }) => void,
  ) {
    if (!this.isRunning) return

    // Randomly select 2-4 providers to respond to this tender
    const respondingProviders = this.selectRandomProviders(2, 4)

    const promises = respondingProviders.map(async (provider) => {
      // Wait for provider's response time
      await new Promise((resolve) => setTimeout(resolve, provider.responseTime))

      if (!this.isRunning) return

      // Generate a mock deliverable URI
      const deliverableURI = this.generateMockDeliverable(tenderEvent.task, provider.specialty)

      onSubmission({
        tenderId: tenderEvent.id,
        provider: provider.address,
        providerName: provider.name,
        deliverableURI,
        timestamp: new Date(),
      })
    })

    await Promise.all(promises)
  }

  private selectRandomProviders(min: number, max: number): AIProvider[] {
    const count = Math.floor(Math.random() * (max - min + 1)) + min
    const shuffled = [...this.providers].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, count)
  }

  private generateMockDeliverable(task: string, specialty: string): string {
    // Generate different types of deliverables based on specialty
    const deliverableTypes: Record<string, string[]> = {
      design: ["figma.com/file/abc123", "dribbble.com/shots/xyz789", "behance.net/gallery/def456"],
      research: [
        "docs.google.com/document/d/research-report",
        "notion.so/market-analysis",
        "airtable.com/research-data",
      ],
      copywriting: ["docs.google.com/document/d/copy-draft", "gdocs.pub/marketing-copy", "notion.so/content-strategy"],
      "financial-modeling": [
        "docs.google.com/spreadsheets/d/financial-model",
        "sheets.google.com/revenue-projection",
        "airtable.com/financial-analysis",
      ],
      strategy: [
        "miro.com/board/strategy-canvas",
        "docs.google.com/presentation/d/strategy-deck",
        "notion.so/go-to-market-plan",
      ],
      development: ["github.com/repo/prototype", "codesandbox.io/demo", "vercel.app/deployment"],
      marketing: [
        "canva.com/design/campaign",
        "docs.google.com/presentation/d/marketing-plan",
        "notion.so/campaign-strategy",
      ],
    }

    const options = deliverableTypes[specialty] || deliverableTypes.research
    const selected = options[Math.floor(Math.random() * options.length)]

    return `https://${selected}-${Math.random().toString(36).slice(2, 8)}`
  }

  getProviderCount(): number {
    return this.providers.length
  }

  getActiveProviders(): AIProvider[] {
    return this.providers
  }
}

// Singleton instance
export const providerSimulator = new ProviderSimulator()
