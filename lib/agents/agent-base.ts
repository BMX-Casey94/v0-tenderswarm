// Base class for all TenderSwarm agents
import { generateText, generateObject } from "ai"
import type { ZodSchema } from "zod"
import type { AgentMessage, AgentName } from "@/lib/types"
import type { CostTracker, ModelName } from "./cost-tracker"

export interface AgentWorkMetrics {
  tokensUsed: number
  tasksProcessed: number
  aiCallsMade: number
}

export abstract class BaseAgent {
  protected name: AgentName
  protected systemPrompt: string
  protected model = "xai/grok-3-fast"
  protected workMetrics: AgentWorkMetrics = {
    tokensUsed: 0,
    tasksProcessed: 0,
    aiCallsMade: 0,
  }
  protected costTracker: CostTracker | null = null
  protected isDemoMode = false

  constructor(name: AgentName, systemPrompt: string) {
    this.name = name
    this.systemPrompt = systemPrompt
  }

  setDemoMode(isDemoMode: boolean): void {
    this.isDemoMode = isDemoMode
  }

  setCostTracker(tracker: CostTracker): void {
    this.costTracker = tracker
  }

  getWorkMetrics(): AgentWorkMetrics {
    return { ...this.workMetrics }
  }

  resetMetrics(): void {
    this.workMetrics = { tokensUsed: 0, tasksProcessed: 0, aiCallsMade: 0 }
  }

  protected createMessage(
    message: string,
    type: AgentMessage["type"] = "info",
    metadata?: Record<string, any>,
  ): AgentMessage {
    return {
      id: `${this.name.toLowerCase().replace(" ", "-")}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      agent: this.name,
      message,
      timestamp: new Date(),
      type,
      metadata,
    }
  }

  protected async think(prompt: string, maxTokens = 2000): Promise<{ text: string; tokensUsed: number }> {
    const adjustedMaxTokens = this.isDemoMode ? Math.min(maxTokens, 500) : maxTokens

    const estimatedInputTokens = Math.ceil(prompt.length / 4)
    const estimatedOutputTokens = adjustedMaxTokens

    if (
      this.costTracker &&
      !this.costTracker.canAffordOperation(this.model as ModelName, estimatedInputTokens, estimatedOutputTokens)
    ) {
      throw new Error(`Insufficient budget for operation. Estimated cost would exceed budget limit.`)
    }

    const { text, usage } = await generateText({
      model: this.model,
      system: this.systemPrompt,
      prompt,
      maxOutputTokens: adjustedMaxTokens,
      temperature: 0.7,
    })

    const inputTokens = usage?.promptTokens || Math.floor(prompt.length / 4)
    const outputTokens = usage?.completionTokens || Math.floor(text.length / 4)
    const tokensUsed = usage?.totalTokens || inputTokens + outputTokens

    this.workMetrics.tokensUsed += tokensUsed
    this.workMetrics.aiCallsMade++

    if (this.costTracker) {
      this.costTracker.trackModelUsage(
        this.name,
        this.model as ModelName,
        inputTokens,
        outputTokens,
        `${this.name} think operation`,
      )
    }

    return { text, tokensUsed }
  }

  protected async thinkStructured<T>(prompt: string, schema: ZodSchema<T>, schemaDescription?: string): Promise<T> {
    try {
      const maxOutputTokens = this.isDemoMode ? 1500 : 3000

      const estimatedInputTokens = Math.ceil(prompt.length / 4)
      const estimatedOutputTokens = maxOutputTokens

      if (
        this.costTracker &&
        !this.costTracker.canAffordOperation(this.model as ModelName, estimatedInputTokens, estimatedOutputTokens)
      ) {
        throw new Error(`Insufficient budget for structured operation. Estimated cost would exceed budget limit.`)
      }

      console.log("[v0] BaseAgent.thinkStructured: Starting API call...")
      const { object, usage } = await generateObject({
        model: this.model,
        system: this.systemPrompt,
        prompt,
        schema,
        schemaName: schemaDescription,
        maxOutputTokens,
        temperature: 0.5,
      })

      const inputTokens = usage?.promptTokens || Math.floor(prompt.length / 4)
      const outputTokens = usage?.completionTokens || 1000
      const tokensUsed = usage?.totalTokens || inputTokens + outputTokens

      this.workMetrics.tokensUsed += tokensUsed
      this.workMetrics.aiCallsMade++

      if (this.costTracker) {
        this.costTracker.trackModelUsage(
          this.name,
          this.model as ModelName,
          inputTokens,
          outputTokens,
          `${this.name} structured think operation`,
        )
      }

      console.log("[v0] BaseAgent.thinkStructured: Success, got object:", typeof object)
      return object
    } catch (error) {
      console.log("[v0] BaseAgent.thinkStructured: Error:", error)
      throw error
    }
  }

  abstract execute(...args: any[]): Promise<any>
}
