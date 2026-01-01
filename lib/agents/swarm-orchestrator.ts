// Swarm Orchestrator - Coordinates all agents with smart pricing, tiers, and refunds
import { CoordinatorAgent } from "./coordinator"
import { ProjectManagerAgent } from "./project-manager"
import { TenderPosterAgent } from "./tender-poster"
import { EvaluatorAgent } from "./evaluator"
import { AssemblerAgent } from "./assembler"
import { determineTier, type TierConfig, type GeneratedImage, type GeneratedVideo } from "./tier-system"
import { CostTracker } from "./cost-tracker"
import { generateDeliverableContent, assembleFinalDocument } from "./content-generator"
import type {
  ClientBrief,
  MicroTask,
  SwarmEvent,
  Payment,
  ProviderSubmission,
  SwarmSummary,
  GeneratedDeliverable,
  AgentName,
  AgentPayment,
} from "@/lib/types"
import type { AgentWorkMetrics } from "./agent-base"
import { getDemoTierConfig, shouldUseDemoMode } from "./demo-models"
import type { ModelName } from "./cost-tracker"

export class SwarmOrchestrator {
  private coordinator: CoordinatorAgent
  private projectManager: ProjectManagerAgent
  private tenderPoster: TenderPosterAgent
  private evaluator: EvaluatorAgent
  private assembler: AssemblerAgent

  private tasks: MicroTask[] = []
  private submissions: ProviderSubmission[] = []
  private payments: Payment[] = []
  private deliverables: GeneratedDeliverable[] = []
  private generatedImages: GeneratedImage[] = []
  private generatedVideos: GeneratedVideo[] = []
  private startTime = 0
  private tierConfig: TierConfig | null = null
  private costTracker: CostTracker | null = null
  private onEvent: ((event: SwarmEvent) => void) | null = null

  constructor() {
    this.coordinator = new CoordinatorAgent()
    this.projectManager = new ProjectManagerAgent()
    this.tenderPoster = new TenderPosterAgent()
    this.evaluator = new EvaluatorAgent()
    this.assembler = new AssemblerAgent()
  }

  private resetAllMetrics() {
    this.coordinator.resetMetrics()
    this.projectManager.resetMetrics()
    this.tenderPoster.resetMetrics()
    this.evaluator.resetMetrics()
    this.assembler.resetMetrics()
    this.tasks = []
    this.submissions = []
    this.payments = []
    this.deliverables = []
    this.generatedImages = []
    this.generatedVideos = []
    this.tierConfig = null
    this.costTracker = null
  }

  private collectAgentMetrics(): Record<AgentName, AgentWorkMetrics> {
    return {
      Coordinator: this.coordinator.getWorkMetrics(),
      "Project Manager": this.projectManager.getWorkMetrics(),
      "Tender Poster": this.tenderPoster.getWorkMetrics(),
      Evaluator: this.evaluator.getWorkMetrics(),
      Assembler: this.assembler.getWorkMetrics(),
    }
  }

  private safeSum(arr: number[] | undefined | null): number {
    if (!arr || !Array.isArray(arr)) return 0
    return arr.reduce((sum, n) => sum + (n || 0), 0)
  }

  private safePaymentsTotal(): number {
    if (!this.payments || !Array.isArray(this.payments)) return 0
    return this.payments.reduce((sum, p) => sum + (p?.amount || 0), 0)
  }

  private emit(event: SwarmEvent) {
    if (this.onEvent) {
      this.onEvent(event)
    }
  }

  private emitStatus(phase: string, progress: number) {
    this.emit({
      type: "status",
      data: { phase, progress },
      timestamp: new Date(),
    })
  }

  private emitMessage(agent: string, message: string, type: string) {
    this.emit({
      type: "message",
      data: {
        id: `${agent.toLowerCase()}-message-${Date.now()}`,
        agent,
        message,
        timestamp: new Date(),
        type,
      },
      timestamp: new Date(),
    })
  }

  async execute(
    brief: ClientBrief,
    contractAddress: string,
    onEvent: (event: SwarmEvent) => void,
    isDemoMode = false,
    userAddress?: string,
  ): Promise<SwarmSummary> {
    this.startTime = Date.now()
    this.resetAllMetrics()
    this.onEvent = onEvent

    const originalBudget = brief.budget
    const baseTierConfig = determineTier(originalBudget)
    this.tierConfig = shouldUseDemoMode(isDemoMode) ? getDemoTierConfig(baseTierConfig) : baseTierConfig

    this.costTracker = new CostTracker(originalBudget)

    // Set demo mode on all agents
    this.coordinator.setDemoMode(isDemoMode)
    this.projectManager.setDemoMode(isDemoMode)
    this.tenderPoster.setDemoMode(isDemoMode)
    this.evaluator.setDemoMode(isDemoMode)
    this.assembler.setDemoMode(isDemoMode)

    // Set cost tracker on all agents
    this.coordinator.setCostTracker(this.costTracker)
    this.projectManager.setCostTracker(this.costTracker)
    this.tenderPoster.setCostTracker(this.costTracker)
    this.evaluator.setCostTracker(this.costTracker)
    this.assembler.setCostTracker(this.costTracker)

    console.log(`[v0] Starting swarm execution`)
    console.log(`[v0] Payment mode: ${isDemoMode ? "DEMO (simulated)" : "LIVE (real blockchain)"}`)
    console.log(`[v0] Budget: ${originalBudget} MNEE | Tier: ${this.tierConfig.tier}`)
    if (isDemoMode) {
      console.log(`[v0] Demo mode active - using cost-limited models and reduced token limits`)
    }

    // Emit initial status
    this.emitMessage(
      "Coordinator",
      isDemoMode
        ? `Running in demo mode - payments simulated | Tier: ${this.tierConfig.tier}`
        : `Running in live mode - real MNEE transactions | Tier: ${this.tierConfig.tier}`,
      "info",
    )

    try {
      // ========== PHASE 1: INITIALIZATION (0-10%) ==========
      this.emitStatus("initializing", 5)

      const coordMessage = await this.coordinator.execute()
      this.emit(coordMessage)

      this.emitMessage(
        "Coordinator",
        `Budget tier: ${this.tierConfig.tier} | Max deliverables: ${this.tierConfig.maxDeliverables} | Content depth: ${this.tierConfig.contentDepth}`,
        "info",
      )

      // ========== PHASE 2: DECOMPOSITION (10-30%) ==========
      this.emitStatus("decomposing", 15)

      this.emitMessage("Project Manager", "Analysing brief and creating tasks...", "info")

      // Check budget before expensive operation
      if (this.costTracker.shouldTerminateEarly()) {
        throw new Error("Budget depleted before task decomposition")
      }

      // Create a ClientBrief object for the execute method
      const briefForDecomposition: ClientBrief = {
        id: brief.id || `brief-${Date.now()}`,
        text: brief.text,
        budget: brief.budget,
        createdAt: brief.createdAt || new Date(),
      }

      // Collect messages during decomposition
      const decompositionMessages: any[] = []
      const onDecomposeMessage = (msg: any) => {
        decompositionMessages.push(msg)
        this.emit(msg)
      }

      // Call execute() which returns MicroTask[]
      this.tasks = await this.projectManager.execute(
        briefForDecomposition,
        onDecomposeMessage,
        this.tierConfig.maxDeliverables,
      )

      console.log(`[v0] Decomposition complete: ${this.tasks.length} tasks created`)

      // Emit each task
      for (const task of this.tasks) {
        this.emit({
          type: "task-update",
          data: task,
          timestamp: new Date(),
        })
      }

      this.emitStatus("decomposing", 30)
      this.emitMessage(
        "Project Manager",
        `Decomposed brief into ${this.tasks.length} categorised micro-tasks`,
        "success",
      )

      // ========== PHASE 3: TENDER POSTING (30-40%) ==========
      this.emitStatus("tendering", 35)

      this.emitMessage("Tender Poster", "Broadcasting tasks to provider network...", "info")

      // Post tenders for each task
      for (let i = 0; i < this.tasks.length; i++) {
        const task = this.tasks[i]
        task.status = "pending"

        this.emit({
          type: "task-update",
          data: task,
          timestamp: new Date(),
        })
      }

      this.emitStatus("tendering", 40)
      this.emitMessage("Tender Poster", "Tenders posted", "success")

      // ========== PHASE 4: CONTENT GENERATION (40-70%) ==========
      this.emitStatus("generating", 45)

      const imageTaskCount = this.tierConfig.includesImages
        ? Math.min(this.tierConfig.maxImages, Math.floor(this.tasks.length / 2))
        : 0

      let completedTasks = 0
      const totalTasks = this.tasks.length

      for (let i = 0; i < this.tasks.length; i++) {
        const task = this.tasks[i]

        // Check budget before each task
        if (this.costTracker.shouldTerminateEarly()) {
          console.log(`[v0] Budget depleted at task ${i + 1}/${totalTasks}`)
          this.emitMessage(
            "Coordinator",
            `Budget limit reached - completing with ${completedTasks} deliverables`,
            "warning",
          )
          break
        }

        // Update task status to in-progress
        task.status = "in-progress"
        this.emit({
          type: "task-update",
          data: task,
          timestamp: new Date(),
        })

        this.emitMessage("Content Generator", `Working on: ${task.description.slice(0, 60)}...`, "info")

        try {
          const shouldGenerateImage = this.tierConfig.includesImages && i < imageTaskCount

          const deliverable = await generateDeliverableContent(
            task,
            brief.text,
            "AI Provider",
            this.tierConfig,
            shouldGenerateImage,
            originalBudget,
            isDemoMode,
          )

          this.deliverables.push(deliverable)

          if (deliverable.image) {
            this.generatedImages.push({
              base64Data: deliverable.image.base64Data,
              mimeType: deliverable.image.mimeType,
              prompt: deliverable.image.prompt,
              taskId: task.id,
            })
          }

          // Track cost
          this.costTracker.trackModelUsage(
            "Content Generator",
            this.tierConfig.aiModel as ModelName,
            Math.floor(deliverable.tokensUsed * 0.3), // Estimate input tokens
            Math.floor(deliverable.tokensUsed * 0.7), // Estimate output tokens
            `Content generation for: ${task.description.slice(0, 40)}`,
          )

          // Update task status to completed
          task.status = "completed"
          task.result = deliverable.content.slice(0, 200) + "..."
          completedTasks++

          this.emit({
            type: "task-update",
            data: task,
            timestamp: new Date(),
          })

          // Calculate progress (40-70% range)
          const progressPercent = 45 + Math.floor((completedTasks / totalTasks) * 25)
          this.emitStatus("generating", progressPercent)

          this.emitMessage(
            "Content Generator",
            `Completed: ${task.description.slice(0, 40)}... (${deliverable.tokensUsed} tokens)`,
            "success",
          )
        } catch (error) {
          console.error(`[v0] Error generating content for task ${task.id}:`, error)
          task.status = "failed"
          this.emit({
            type: "task-update",
            data: task,
            timestamp: new Date(),
          })
        }
      }

      // ========== PHASE 5: EVALUATION (70-85%) ==========
      this.emitStatus("evaluating", 72)

      this.emitMessage("Evaluator", "Evaluating deliverables for quality...", "info")

      // Score and accept deliverables
      let acceptedCount = 0
      const providerPayments: Payment[] = []
      const uniqueProviders = new Set<string>()

      for (const deliverable of this.deliverables) {
        // Simple quality score based on content length and structure
        const hasHeaders = deliverable.content.includes("#")
        const hasBullets = deliverable.content.includes("-") || deliverable.content.includes("*")
        const contentLength = deliverable.content.length

        let score = 50
        if (contentLength > 500) score += 15
        if (contentLength > 1000) score += 10
        if (hasHeaders) score += 10
        if (hasBullets) score += 10
        if (deliverable.image) score += 5

        if (score >= 60) {
          acceptedCount++
          uniqueProviders.add(deliverable.providerName)

          // Calculate payment based on tokens used
          const paymentAmount = Math.max(0.001, (deliverable.tokensUsed / 1000) * 0.01)

          const payment: Payment = {
            id: `payment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            tenderId: Number.parseInt(deliverable.taskId.replace(/\D/g, "")) || 0,
            amount: paymentAmount,
            recipient: deliverable.provider,
            providerName: deliverable.providerName,
            txHash: isDemoMode ? `demo-tx-${Date.now().toString(16)}` : "",
            timestamp: new Date(),
            paymentType: "provider",
          }

          providerPayments.push(payment)
          this.payments.push(payment)

          this.emit({
            type: "payment",
            data: payment,
            timestamp: new Date(),
          })
        }
      }

      this.emitStatus("evaluating", 85)
      this.emitMessage(
        "Evaluator",
        `Evaluation complete: ${acceptedCount}/${this.deliverables.length} deliverables accepted`,
        "success",
      )

      // ========== PHASE 6: ASSEMBLY (85-95%) ==========
      this.emitStatus("assembling", 88)

      this.emitMessage("Assembler", "Compiling deliverables into final package...", "info")

      const assemblyResult = await assembleFinalDocument(this.deliverables, brief.text, this.tierConfig, isDemoMode)

      this.emitStatus("assembling", 95)
      this.emitMessage("Assembler", `Final deliverable assembled (${assemblyResult.tokensUsed} tokens)`, "success")

      // ========== PHASE 7: COMPLETION & REFUND (95-100%) ==========
      console.log(`[v0] Phase 7: Completing swarm execution`)
      this.emitStatus("complete", 95)
      this.emitMessage("Coordinator", "Finalizing results and calculating refund...", "action")

      const costBreakdown = this.costTracker.getCostBreakdown()

      const costsByAgent = this.costTracker.getCostsByAgent()
      const costEntries = this.costTracker.getAllCostEntries()

      const agentPayments: AgentPayment[] = Object.entries(costsByAgent).map(([agentName, totalCost]) => {
        // Get token counts for this agent
        const agentEntries = costEntries.filter((e) => e.agent === agentName)
        const totalTokens = agentEntries.reduce((sum, e) => sum + e.inputTokens + e.outputTokens, 0)
        const tasksProcessed = agentEntries.length

        return {
          id: `payment-${agentName}-${Date.now()}`,
          agent: agentName as AgentPayment["agent"],
          amount: totalCost,
          reason: `AI model usage for ${tasksProcessed} operation(s)`,
          tokensUsed: totalTokens,
          tasksProcessed,
          timestamp: new Date(),
        }
      })

      // Emit refund payment if there's unused budget
      if (costBreakdown.refundAmount > 0) {
        this.emit({
          type: "payment",
          data: {
            id: `refund-${Date.now()}`,
            tenderId: 0,
            amount: costBreakdown.refundAmount,
            recipient: "user",
            providerName: "Refund",
            txHash: "refund-internal",
            timestamp: new Date(),
            paymentType: "refund",
          } as Payment,
          timestamp: new Date(),
        })
      }

      const summary: SwarmSummary = {
        totalTasks: this.tasks.length,
        completedTasks: acceptedCount,
        totalSpent: costBreakdown.totalSpent,
        originalBudget,
        refundAmount: costBreakdown.refundAmount,
        tier: this.tierConfig.tier,
        costBreakdown: {
          agentFees: Object.values(costsByAgent).reduce((sum, cost) => sum + cost, 0),
          providerPayments: costBreakdown.aiCosts,
          platformFee: costBreakdown.platformFee,
          totalCost: costBreakdown.totalSpent,
        },
        providersUsed: uniqueProviders.size,
        executionTime: Math.floor((Date.now() - this.startTime) / 1000),
        agentPayments, // Now populated with real data
        finalDeliverable: assemblyResult.content,
        deliverables: this.deliverables.map((d) => ({
          taskId: d.taskId,
          title: d.taskDescription,
          content: d.content,
          category: d.category,
          providerName: d.providerName,
        })),
        generatedImages: this.generatedImages,
        generatedVideos: this.generatedVideos,
      }

      // Emit completion
      this.emitStatus("complete", 100)
      this.emit({
        type: "complete",
        data: { summary },
        timestamp: new Date(),
      })

      this.emitMessage(
        "Coordinator",
        `Swarm complete! ${acceptedCount} deliverables | ${costBreakdown.totalSpent.toFixed(4)} MNEE spent | ${costBreakdown.refundAmount.toFixed(4)} MNEE refunded`,
        "success",
      )

      console.log(`[v0] Swarm execution complete`)
      console.log(`[v0] Tasks: ${this.tasks.length} | Completed: ${acceptedCount}`)
      console.log(
        `[v0] Spent: ${costBreakdown.totalSpent.toFixed(4)} MNEE | Refund: ${costBreakdown.refundAmount.toFixed(4)} MNEE`,
      )

      return summary
    } catch (error) {
      console.error("[v0] Swarm execution error:", error)

      const costBreakdown = this.costTracker?.getCostBreakdown() || {
        totalSpent: 0,
        platformFee: 0,
        refundAmount: originalBudget,
        aiCosts: 0,
      }

      this.emit({
        type: "error",
        data: { error: error instanceof Error ? error.message : "Unknown error" },
        timestamp: new Date(),
      })

      throw error
    }
  }
}
