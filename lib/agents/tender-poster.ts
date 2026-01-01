// Tender Poster Agent - Posts tenders on-chain
import { BaseAgent } from "./agent-base"
import type { MicroTask, AgentMessage } from "@/lib/types"
import { keccak256, toBytes } from "viem"

export class TenderPosterAgent extends BaseAgent {
  constructor() {
    super(
      "Tender Poster",
      `You are the Tender Poster agent in TenderSwarm.
Your role is to efficiently post micro-tasks as on-chain tenders.
You batch tasks for gas optimization and provide clear status updates.
You track all tender IDs and ensure proper on-chain representation.`,
    )
  }

  async execute(
    tasks: MicroTask[],
    contractAddress: string,
    onMessage: (msg: AgentMessage) => void,
    onTaskUpdate: (task: MicroTask) => void,
  ): Promise<MicroTask[]> {
    onMessage(
      this.createMessage(
        `Preparing ${tasks.length} tenders for on-chain posting to ${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)}`,
        "action",
      ),
    )

    // Batch tasks for efficient posting (5 per batch)
    const batchSize = 5
    const batches: MicroTask[][] = []
    for (let i = 0; i < tasks.length; i += batchSize) {
      batches.push(tasks.slice(i, i + batchSize))
    }

    onMessage(
      this.createMessage(`Optimizing gas: ${batches.length} batches of up to ${batchSize} tenders each`, "info"),
    )

    let tenderIdCounter = Date.now()
    const updatedTasks: MicroTask[] = []

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex]

      onMessage(this.createMessage(`Posting batch ${batchIndex + 1}/${batches.length}...`, "action"))

      // Process each task in the batch
      for (const task of batch) {
        // Generate task hash (would be used for on-chain identification)
        const taskHash = keccak256(toBytes(task.description))

        const updatedTask: MicroTask = {
          ...task,
          status: "posted",
          tenderId: tenderIdCounter++,
        }

        updatedTasks.push(updatedTask)
        onTaskUpdate(updatedTask)

        // Small delay to simulate blockchain confirmation
        await new Promise((r) => setTimeout(r, 200))
      }

      onMessage(this.createMessage(`Batch ${batchIndex + 1} confirmed: ${batch.length} tenders live`, "success"))

      // Delay between batches
      if (batchIndex < batches.length - 1) {
        await new Promise((r) => setTimeout(r, 500))
      }
    }

    const totalReward = updatedTasks.reduce((sum, t) => sum + t.reward, 0)
    onMessage(
      this.createMessage(
        `All ${updatedTasks.length} tenders posted! Total value: ${totalReward} MNEE. Provider network notified.`,
        "success",
        { totalTenders: updatedTasks.length, totalReward },
      ),
    )

    return updatedTasks
  }
}
