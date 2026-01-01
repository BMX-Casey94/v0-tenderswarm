// Event coordinator that manages tender detection and provider responses

import { escrowClient } from '@/lib/contracts/escrow-client'
import { providerSimulator } from './provider-simulator'

export class TenderEventListener {
  private unwatch: (() => void) | null = null
  private isListening: boolean = false

  start(
    onTenderCreated: (tenderId: number, task: string, reward: string) => void,
    onProviderSubmission: (submission: any) => void
  ) {
    if (this.isListening) {
      console.log('[v0] Already listening for events')
      return
    }

    console.log('[v0] Starting tender event listener with polling...')
    this.isListening = true

    // Start polling for new tenders from Alchemy webhook
    providerSimulator.startPolling((tender) => {
      console.log('[v0] New tender detected:', tender)
      
      // Notify the UI
      onTenderCreated(tender.id, tender.task, tender.reward.toString())

      // Trigger provider simulator to respond
      providerSimulator.simulateResponses(tender, onProviderSubmission)
    })

    // Watch for TenderCreated events
    this.unwatch = escrowClient.watchTenderCreated((log: any) => {
      console.log('[v0] TenderCreated event received:', log)
      
      const tenderId = Number(log.args.id)
      const task = log.args.task
      const reward = log.args.reward.toString()

      // Notify the UI
      onTenderCreated(tenderId, task, reward)

      // Trigger provider simulator to respond
      providerSimulator.simulateResponses(
        {
          id: tenderId,
          task,
          reward: Number(reward),
          timestamp: new Date(),
        },
        onProviderSubmission
      )
    })
  }

  stop() {
    if (this.unwatch) {
      this.unwatch()
      this.unwatch = null
    }
    this.isListening = false
    providerSimulator.stop()
    console.log('[v0] Stopped tender event listener')
  }

  isActive(): boolean {
    return this.isListening
  }
}

// Singleton instance
export const eventListener = new TenderEventListener()
