// Real-time cost tracking with hard budget limits

import type { BudgetTier } from "./tier-system"

// Real AI model pricing (per 1K tokens)
// Source: Official pricing as of 2025
export const MODEL_PRICING = {
  // xAI Grok models (via AI Gateway)
  "xai/grok-3-fast": {
    input: 0.0001, // $0.0001 per 1K tokens
    output: 0.0003,
  },
  "xai/grok-3": {
    input: 0.0005, // $0.0005 per 1K tokens
    output: 0.0015,
  },

  // OpenAI models (via AI Gateway)
  "openai/gpt-4o-mini": {
    input: 0.00015,
    output: 0.0006,
  },
  "openai/gpt-4o": {
    input: 0.0025,
    output: 0.01,
  },
  "openai/gpt-4-turbo": {
    input: 0.01,
    output: 0.03,
  },
  "openai/o1": {
    input: 0.015,
    output: 0.06,
  },

  // Anthropic Claude (via AI Gateway)
  "anthropic/claude-3.5-sonnet": {
    input: 0.003,
    output: 0.015,
  },
  "anthropic/claude-opus": {
    input: 0.015,
    output: 0.075,
  },

  // Google Gemini (for image generation)
  "google/gemini-3-pro-image": {
    input: 0.0005,
    output: 0.0015,
    imageGeneration: 0.04, // $0.04 per image
  },
} as const

export type ModelName = keyof typeof MODEL_PRICING

export interface CostEntry {
  id: string
  agent: string
  model: ModelName
  inputTokens: number
  outputTokens: number
  cost: number
  timestamp: Date
  description: string
}

export interface ImageGenerationCost {
  id: string
  model: string
  imagesGenerated: number
  costPerImage: number
  totalCost: number
  timestamp: Date
}

export class CostTracker {
  private costs: CostEntry[] = []
  private imageCosts: ImageGenerationCost[] = []
  private maxBudget: number
  private platformFeeRate = 0.02 // 2% platform fee
  private reservedForAgentFees = 0.2 // 20% reserved for internal agent operations

  constructor(maxBudget: number) {
    this.maxBudget = maxBudget
  }

  trackModelUsage(
    agent: string,
    model: ModelName,
    inputTokens: number,
    outputTokens: number,
    description: string,
  ): number {
    const pricing = MODEL_PRICING[model]
    if (!pricing) {
      console.error(`[v0] Unknown model pricing for: ${model}`)
      return 0
    }

    const inputCost = (inputTokens / 1000) * pricing.input
    const outputCost = (outputTokens / 1000) * pricing.output
    const totalCost = inputCost + outputCost

    const entry: CostEntry = {
      id: `cost-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      agent,
      model,
      inputTokens,
      outputTokens,
      cost: totalCost,
      timestamp: new Date(),
      description,
    }

    this.costs.push(entry)

    console.log(
      `[v0] Cost tracked: ${agent} used ${model} - ${inputTokens}/${outputTokens} tokens = $${totalCost.toFixed(4)} MNEE`,
    )

    return totalCost
  }

  trackImageGeneration(model: string, imageCount: number): number {
    const pricing = MODEL_PRICING["google/gemini-3-pro-image"]
    const costPerImage = pricing.imageGeneration || 0.04
    const totalCost = imageCount * costPerImage

    const entry: ImageGenerationCost = {
      id: `img-cost-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      model,
      imagesGenerated: imageCount,
      costPerImage,
      totalCost,
      timestamp: new Date(),
    }

    this.imageCosts.push(entry)

    console.log(`[v0] Image cost tracked: ${imageCount} images = $${totalCost.toFixed(4)} MNEE`)

    return totalCost
  }

  canAffordOperation(model: ModelName, estimatedInputTokens: number, estimatedOutputTokens: number): boolean {
    const estimatedCost = this.estimateOperationCost(model, estimatedInputTokens, estimatedOutputTokens)
    const currentSpend = this.getTotalSpent()
    const projectedSpend = currentSpend + estimatedCost

    // Use 95% of budget as hard limit (5% safety buffer)
    const effectiveLimit = this.maxBudget * 0.95

    const canAfford = projectedSpend <= effectiveLimit

    if (!canAfford) {
      console.log(
        `[v0] Budget check FAILED: Current ${currentSpend.toFixed(4)} + Estimated ${estimatedCost.toFixed(4)} = ${projectedSpend.toFixed(4)} exceeds limit ${effectiveLimit.toFixed(4)}`,
      )
    }

    return canAfford
  }

  estimateOperationCost(model: ModelName, estimatedInputTokens: number, estimatedOutputTokens: number): number {
    const pricing = MODEL_PRICING[model]
    if (!pricing) {
      console.warn(`[v0] Unknown model pricing for: ${model}, using fallback`)
      return 0.01 // Conservative fallback
    }

    const inputCost = (estimatedInputTokens / 1000) * pricing.input
    const outputCost = (estimatedOutputTokens / 1000) * pricing.output

    // Add 20% buffer for estimation uncertainty
    return (inputCost + outputCost) * 1.2
  }

  canAfford(estimatedCost: number): boolean {
    const currentSpend = this.getTotalSpent()
    const projectedSpend = currentSpend + estimatedCost

    // Leave 5% buffer for safety
    const safetyBuffer = this.maxBudget * 0.05
    const effectiveLimit = this.maxBudget - safetyBuffer

    return projectedSpend <= effectiveLimit
  }

  getRemainingBudget(): number {
    const spent = this.getTotalSpent()
    const safetyBuffer = this.maxBudget * 0.05
    const remaining = this.maxBudget - spent - safetyBuffer

    return Math.max(0, remaining)
  }

  getTotalAICosts(): number {
    const modelCosts = this.costs.reduce((sum, entry) => sum + entry.cost, 0)
    const imageCosts = this.imageCosts.reduce((sum, entry) => sum + entry.totalCost, 0)
    return modelCosts + imageCosts
  }

  getPlatformFee(): number {
    return this.getTotalAICosts() * this.platformFeeRate
  }

  getTotalSpent(): number {
    const aiCosts = this.getTotalAICosts()
    const platformFee = this.getPlatformFee()
    return aiCosts + platformFee
  }

  getRefundAmount(): number {
    const spent = this.getTotalSpent()
    const refund = this.maxBudget - spent
    return Math.max(0, refund)
  }

  getCostBreakdown() {
    const aiCosts = this.getTotalAICosts()
    const platformFee = this.getPlatformFee()
    const totalSpent = aiCosts + platformFee
    const refund = this.maxBudget - totalSpent

    return {
      aiCosts,
      platformFee,
      totalSpent,
      originalBudget: this.maxBudget,
      refundAmount: Math.max(0, refund),
      utilizationRate: (totalSpent / this.maxBudget) * 100,
    }
  }

  getCostsByAgent(): Record<string, number> {
    const byAgent: Record<string, number> = {}

    for (const entry of this.costs) {
      byAgent[entry.agent] = (byAgent[entry.agent] || 0) + entry.cost
    }

    return byAgent
  }

  getAllCostEntries(): CostEntry[] {
    return [...this.costs]
  }

  getAllImageCosts(): ImageGenerationCost[] {
    return [...this.imageCosts]
  }

  estimateTaskCost(tier: BudgetTier, estimatedTokens: number, model: ModelName): number {
    const pricing = MODEL_PRICING[model]
    if (!pricing) return 0.01 // Fallback estimate

    // Assume 30% input, 70% output ratio for estimates
    const inputTokens = estimatedTokens * 0.3
    const outputTokens = estimatedTokens * 0.7

    const inputCost = (inputTokens / 1000) * pricing.input
    const outputCost = (outputTokens / 1000) * pricing.output

    return inputCost + outputCost
  }

  shouldTerminateEarly(): boolean {
    const remaining = this.getRemainingBudget()
    const minCostPerTask = 0.005 // Minimum cost to complete one task

    // If we can't afford even one more task, terminate
    return remaining < minCostPerTask
  }
}

export function calculateRealisticTierMinimums() {
  // Enterprise tier example: 12 tasks, Grok-3, 4000 tokens each, 6 images
  const enterpriseModel = "xai/grok-3"
  const enterprisePricing = MODEL_PRICING[enterpriseModel]
  const enterpriseTaskCost =
    ((4000 * 0.3) / 1000) * enterprisePricing.input + ((4000 * 0.7) / 1000) * enterprisePricing.output
  const enterpriseTasks = 12
  const enterpriseImages = 6
  const enterpriseImageCost = 0.04 * enterpriseImages
  const enterpriseTotal = enterpriseTaskCost * enterpriseTasks + enterpriseImageCost
  const enterpriseWithFees = enterpriseTotal * 1.1 // Add 10% for platform fees and buffer

  // Premium tier: 8 tasks, Grok-3, 3000 tokens each, 3 images
  const premiumTaskCost =
    ((3000 * 0.3) / 1000) * enterprisePricing.input + ((3000 * 0.7) / 1000) * enterprisePricing.output
  const premiumTasks = 8
  const premiumImages = 3
  const premiumImageCost = 0.04 * premiumImages
  const premiumTotal = premiumTaskCost * premiumTasks + premiumImageCost
  const premiumWithFees = premiumTotal * 1.1

  // Standard tier: 5 tasks, Grok-3-Fast, 2000 tokens each
  const standardModel = "xai/grok-3-fast"
  const standardPricing = MODEL_PRICING[standardModel]
  const standardTaskCost =
    ((2000 * 0.3) / 1000) * standardPricing.input + ((2000 * 0.7) / 1000) * standardPricing.output
  const standardTasks = 5
  const standardTotal = standardTaskCost * standardTasks
  const standardWithFees = standardTotal * 1.1

  // Basic tier: 3 tasks, Grok-3-Fast, 1000 tokens each
  const basicTaskCost = ((1000 * 0.3) / 1000) * standardPricing.input + ((1000 * 0.7) / 1000) * standardPricing.output
  const basicTasks = 3
  const basicTotal = basicTaskCost * basicTasks
  const basicWithFees = basicTotal * 1.1

  return {
    enterprise: {
      estimatedCost: enterpriseWithFees,
      recommended: Math.ceil(enterpriseWithFees * 1.5), // 50% margin for safety
      breakdown: `12 tasks × ${enterpriseTaskCost.toFixed(4)} + 6 images × 0.04`,
    },
    premium: {
      estimatedCost: premiumWithFees,
      recommended: Math.ceil(premiumWithFees * 1.5),
      breakdown: `8 tasks × ${premiumTaskCost.toFixed(4)} + 3 images × 0.04`,
    },
    standard: {
      estimatedCost: standardWithFees,
      recommended: Math.ceil(standardWithFees * 2), // Higher margin for basic tiers
      breakdown: `5 tasks × ${standardTaskCost.toFixed(4)}`,
    },
    basic: {
      estimatedCost: basicWithFees,
      recommended: Math.ceil(basicWithFees * 2),
      breakdown: `3 tasks × ${basicTaskCost.toFixed(4)}`,
    },
  }
}
