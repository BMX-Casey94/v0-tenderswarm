// Smart Pricing Engine - Calculates fair payments based on actual work done
import type { AgentName, AgentPayment } from "@/lib/types"
import type { AgentWorkMetrics } from "./agent-base"

interface PricingConfig {
  // Minimum payment per agent (very small)
  minimumPayment: number
  // Coordinator orchestration multiplier
  coordinatorMultiplier: number
}

const DEFAULT_CONFIG: PricingConfig = {
  minimumPayment: 0.001, // 0.001 MNEE minimum (about 1/10th of a cent)
  coordinatorMultiplier: 1.15, // 15% bonus for coordination overhead
}

export interface AgentPricingResult {
  payments: AgentPayment[]
  totalAgentCost: number
  platformFee: number
  actualProviderCost: number
  totalCost: number
  remainingBudget: number
}

export function calculateSmartPricing(
  originalBudget: number,
  agentMetrics: Record<AgentName, AgentWorkMetrics>,
  actualProviderPayments: number,
  config: PricingConfig = DEFAULT_CONFIG,
): AgentPricingResult {
  const payments: AgentPayment[] = []
  let totalAgentCost = 0

  const safeMetrics = agentMetrics || {}

  // Calculate work-based costs for each agent
  const workingAgents: AgentName[] = ["Coordinator", "Project Manager", "Tender Poster", "Evaluator", "Assembler"]

  for (const agent of workingAgents) {
    const metrics = safeMetrics[agent]
    const tokensUsed = metrics?.tokensUsed || 0
    const tasksProcessed = metrics?.tasksProcessed || 0
    const aiCalls = metrics?.aiCalls || 0

    // This is just a minimal orchestration/coordination fee per agent
    let agentCost = 0

    if (tokensUsed > 0 || tasksProcessed > 0 || aiCalls > 0) {
      // Small fixed coordination fee per active agent
      agentCost = config.minimumPayment

      // Coordinator gets a bonus for orchestration complexity
      if (agent === "Coordinator") {
        agentCost *= config.coordinatorMultiplier
      }
    }

    // Determine reason based on agent role and actual work
    let reason = ""
    switch (agent) {
      case "Coordinator":
        reason = `Swarm orchestration (${aiCalls} coordination calls)`
        break
      case "Project Manager":
        reason = `Task decomposition (${tasksProcessed} tasks created)`
        break
      case "Tender Poster":
        reason = `Tender broadcasting (${tasksProcessed} tenders posted)`
        break
      case "Evaluator":
        reason = `Quality evaluation (${tasksProcessed} submissions reviewed)`
        break
      case "Assembler":
        reason = `Document assembly (${tokensUsed.toLocaleString()} tokens processed)`
        break
    }

    payments.push({
      id: `agent-pay-${agent.toLowerCase().replace(" ", "-")}-${Date.now()}`,
      agent,
      amount: Number(agentCost.toFixed(6)),
      reason,
      tokensUsed,
      tasksProcessed,
      timestamp: new Date(),
    })

    totalAgentCost += agentCost
  }

  const safeProviderTotal = actualProviderPayments || 0
  const totalCost = totalAgentCost + safeProviderTotal
  const platformFee = 0

  // Calculate remaining budget (refund amount)
  const safeBudget = originalBudget || 0
  const remainingBudget = Math.max(0, safeBudget - totalCost)

  return {
    payments,
    totalAgentCost: Number(totalAgentCost.toFixed(6)),
    platformFee: 0,
    actualProviderCost: Number(safeProviderTotal.toFixed(6)),
    totalCost: Number(totalCost.toFixed(6)),
    remainingBudget: Number(remainingBudget.toFixed(6)),
  }
}

export function calculateTaskReward(
  taskDescription: string,
  category: string,
  totalBudget: number,
  taskCount: number,
): number {
  const availableForTasks = totalBudget * 0.9
  const baseReward = availableForTasks / Math.max(taskCount, 1)

  // Category complexity multipliers
  const categoryMultipliers: Record<string, number> = {
    "financial-modeling": 1.4,
    strategy: 1.3,
    development: 1.3,
    research: 1.1,
    design: 1.0,
    copywriting: 0.9,
    marketing: 0.95,
  }

  const multiplier = categoryMultipliers[category] || 1.0

  // Description length affects complexity
  const descriptionBonus = Math.min(taskDescription.length / 500, 0.3) // Up to 30% bonus for detailed tasks

  // Calculate final reward with variance
  const variance = 0.85 + Math.random() * 0.3 // ±15% variance
  const reward = baseReward * multiplier * (1 + descriptionBonus) * variance

  return Number(reward.toFixed(4))
}
