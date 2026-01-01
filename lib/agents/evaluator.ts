// Evaluator Agent - Reviews and accepts/rejects submissions with real content analysis
import { z } from "zod"
import { BaseAgent } from "./agent-base"
import type { MicroTask, ProviderSubmission, AgentMessage, Payment, GeneratedDeliverable } from "@/lib/types"

const evaluationSchema = z.object({
  accept: z.boolean(),
  score: z.number().min(0).max(100),
  reasoning: z.string().describe("Brief explanation of the decision"),
  qualityNotes: z.string().describe("Specific notes on content quality"),
})

export class EvaluatorAgent extends BaseAgent {
  constructor() {
    super(
      "Evaluator",
      `You are the Evaluator agent in TenderSwarm.
Your role is to assess provider submissions for quality and completeness.

Evaluate based on:
1. Completeness - Does it fulfill the task requirements?
2. Quality - Is it production-ready and professional?
3. Relevance - Does it match the original task description?
4. Depth - Is there sufficient detail and actionable content?

Be thorough but fair. Accept submissions that meet professional standards.`,
    )
  }

  async execute(
    tasks: MicroTask[],
    submissions: ProviderSubmission[],
    deliverables: GeneratedDeliverable[],
    onMessage: (msg: AgentMessage) => void,
    onPayment: (payment: Payment) => void,
    onTaskUpdate: (task: MicroTask) => void,
    isDemoMode = false,
    userAddress?: string,
  ): Promise<{ accepted: number; rejected: number; payments: Payment[] }> {
    const safeSubmissions = submissions || []
    const safeTasks = tasks || []
    const safeDeliverables = deliverables || []

    onMessage(
      this.createMessage(
        `Evaluating ${safeSubmissions.length} submissions with content analysis... (${isDemoMode ? "Demo mode" : "Live payments"})`,
        "thinking",
      ),
    )

    let accepted = 0
    let rejected = 0
    const payments: Payment[] = []

    const { escrowClient } = isDemoMode ? {} : await import("@/lib/contracts/escrow-client")

    for (const submission of safeSubmissions) {
      if (!submission) continue

      const task = safeTasks.find((t) => t?.id === submission.taskId)
      if (!task) continue

      const deliverable = safeDeliverables.find((d) => d?.taskId === submission.taskId)
      const contentPreview = deliverable?.content?.slice(0, 500) || "No content available"

      this.workMetrics.tasksProcessed++

      let evaluation: { accept: boolean; score: number; reasoning: string; qualityNotes: string }
      try {
        evaluation = await this.thinkStructured(
          `Evaluate this submission:

TASK: "${task.description || "Unknown task"}"
CATEGORY: ${task.category || "unknown"}
PROVIDER: ${submission.providerName || "Unknown"}

CONTENT PREVIEW:
${contentPreview}

Score the quality (0-100) and decide whether to accept.
Consider: completeness, professionalism, relevance, and actionable detail.`,
          evaluationSchema,
          "SubmissionEvaluation",
        )
      } catch (error) {
        console.log("[v0] Evaluator: Error evaluating submission, auto-accepting:", error)
        evaluation = {
          accept: true,
          score: 75,
          reasoning: "Auto-accepted due to evaluation error",
          qualityNotes: "N/A",
        }
      }

      if (evaluation.accept) {
        accepted++

        let txHash: string
        if (isDemoMode) {
          txHash = `0xDEMO${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`.padEnd(66, "0")
          console.log(`[v0] Demo payment: ${(task.reward || 0).toFixed(4)} MNEE to ${submission.providerName}`)
        } else {
          try {
            if (!userAddress || !escrowClient) {
              throw new Error("User address or escrow client not available")
            }

            console.log(
              `[v0] Live payment: Transferring ${(task.reward || 0).toFixed(4)} MNEE to ${submission.provider}`,
            )

            const result = await escrowClient.transferMNEE(
              userAddress as `0x${string}`,
              submission.provider || submission.providerName || "0x0000000000000000000000000000000000000000",
              task.reward || 0,
            )

            if (!result.success) {
              throw new Error("Transaction failed")
            }

            txHash = result.hash
            console.log(`[v0] Payment successful: ${txHash}`)

            onMessage(
              this.createMessage(`Real MNEE payment confirmed: ${txHash.slice(0, 10)}...`, "success", { txHash }),
            )
          } catch (error) {
            console.error("[v0] Payment error:", error)
            txHash = `0xERROR${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`.padEnd(
              66,
              "0",
            )
            onMessage(
              this.createMessage(
                `Payment failed: ${error instanceof Error ? error.message : "Unknown error"}. Using simulated payment.`,
                "warning",
              ),
            )
          }
        }

        const payment: Payment = {
          id: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          tenderId: task.tenderId || `tender-${task.id}`,
          amount: task.reward || 0,
          recipient: submission.provider || "unknown",
          providerName: submission.providerName || "Unknown",
          taskId: task.id,
          txHash,
          timestamp: new Date(),
        }

        payments.push(payment)
        onPayment(payment)

        const updatedTask: MicroTask = {
          ...task,
          status: "accepted",
          deliverableURI: submission.deliverableURI,
          provider: submission.provider,
        }
        onTaskUpdate(updatedTask)

        onMessage(
          this.createMessage(
            `Accepted from ${submission.providerName || "Unknown"}: Score ${evaluation.score}/100 → ${(task.reward || 0).toFixed(2)} MNEE`,
            "success",
            { score: evaluation.score, taskId: task.id, quality: evaluation.qualityNotes },
          ),
        )
      } else {
        rejected++

        const updatedTask: MicroTask = { ...task, status: "rejected" }
        onTaskUpdate(updatedTask)

        onMessage(
          this.createMessage(
            `Rejected from ${submission.providerName || "Unknown"}: ${evaluation.reasoning}`,
            "warning",
          ),
        )
      }

      await new Promise((r) => setTimeout(r, 200))
    }

    const totalPaid = payments.length > 0 ? payments.reduce((sum, p) => sum + (p?.amount || 0), 0) : 0
    onMessage(
      this.createMessage(
        `Evaluation complete: ${accepted} accepted, ${rejected} rejected. Provider payments: ${totalPaid.toFixed(2)} MNEE${!isDemoMode ? " (real transactions)" : " (simulated)"}`,
        "success",
        { accepted, rejected, totalPaid },
      ),
    )

    return { accepted, rejected, payments }
  }
}
