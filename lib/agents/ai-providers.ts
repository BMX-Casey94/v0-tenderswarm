import { PLATFORM_TREASURY } from "@/lib/contracts/config"
import type { AICapability, BudgetTier } from "@/lib/types"

// AI Provider configuration - all using Vercel AI Gateway for now
// Payments currently route to platform treasury until real providers join

export interface AIProvider {
  id: string
  name: string
  address: `0x${string}` // Ethereum payment address
  specialty: string
  aiModel: string // Vercel AI Gateway model string
  description: string
  responseTime: number // milliseconds
  isActive: boolean
  tier: BudgetTier // Which budget tier this provider serves
  capabilities: AICapability[] // What this provider can do
  costMultiplier: number // Relative cost (1.0 = standard, 1.5 = premium)
}

export const BUDGET_TIERS: Record<BudgetTier, { min: number; max: number; description: string }> = {
  basic: { min: 0, max: 5, description: "Fast, efficient models for quick results" },
  standard: { min: 5, max: 20, description: "Balanced quality and performance" },
  premium: { min: 20, max: 50, description: "Advanced models for complex tasks" },
  enterprise: { min: 50, max: Number.POSITIVE_INFINITY, description: "Highest quality models for critical work" },
}

// Helper function to determine tier from budget
export function getTierFromBudget(budget: number): BudgetTier {
  if (budget >= BUDGET_TIERS.enterprise.min) return "enterprise"
  if (budget >= BUDGET_TIERS.premium.min) return "premium"
  if (budget >= BUDGET_TIERS.standard.min) return "standard"
  return "basic"
}

// Current configuration: All providers use Vercel AI Gateway models
// and receive payments at the platform treasury address
//
// TO ADD REAL PROVIDERS LATER:
// 1. Replace the address with the provider's actual Ethereum wallet
// 2. Update aiModel if they bring their own AI service
// 3. Set custom API endpoints if needed (future enhancement)

export const AI_PROVIDERS: AIProvider[] = [
  // BASIC TIER - Fast, cost-effective models
  {
    id: "grok-researcher-basic",
    name: "Grok Research Assistant",
    address: PLATFORM_TREASURY,
    specialty: "research",
    aiModel: "xai/grok-3-fast",
    description: "Quick market research and data gathering",
    responseTime: 6000,
    isActive: true,
    tier: "basic",
    capabilities: ["text", "data-analysis"],
    costMultiplier: 0.8,
  },
  {
    id: "grok-writer-basic",
    name: "Grok Content Writer",
    address: PLATFORM_TREASURY,
    specialty: "copywriting",
    aiModel: "xai/grok-3-fast",
    description: "Fast copywriting and content creation",
    responseTime: 5000,
    isActive: true,
    tier: "basic",
    capabilities: ["text", "creative"],
    costMultiplier: 0.8,
  },

  // STANDARD TIER - Balanced quality models
  {
    id: "gpt4-strategist",
    name: "GPT-4 Strategy Consultant",
    address: PLATFORM_TREASURY,
    specialty: "strategy",
    aiModel: "openai/gpt-4o",
    description: "Strategic planning and business models",
    responseTime: 10000,
    isActive: true,
    tier: "standard",
    capabilities: ["text", "data-analysis", "creative"],
    costMultiplier: 1.0,
  },
  {
    id: "claude-writer",
    name: "Claude Content Creator",
    address: PLATFORM_TREASURY,
    specialty: "copywriting",
    aiModel: "anthropic/claude-3.5-sonnet",
    description: "High-quality copywriting and brand messaging",
    responseTime: 9000,
    isActive: true,
    tier: "standard",
    capabilities: ["text", "creative"],
    costMultiplier: 1.0,
  },
  {
    id: "grok-designer",
    name: "Grok Design Architect",
    address: PLATFORM_TREASURY,
    specialty: "design",
    aiModel: "xai/grok-3-fast",
    description: "UX/UI design and visual specifications",
    responseTime: 12000,
    isActive: true,
    tier: "standard",
    capabilities: ["text", "creative", "vision"],
    costMultiplier: 1.0,
  },
  {
    id: "grok-marketer",
    name: "Grok Marketing Specialist",
    address: PLATFORM_TREASURY,
    specialty: "marketing",
    aiModel: "xai/grok-3-fast",
    description: "Marketing strategy and campaign planning",
    responseTime: 9000,
    isActive: true,
    tier: "standard",
    capabilities: ["text", "creative", "data-analysis"],
    costMultiplier: 1.0,
  },

  // PREMIUM TIER - Advanced models for complex work
  {
    id: "gpt4-developer",
    name: "GPT-4 Technical Lead",
    address: PLATFORM_TREASURY,
    specialty: "development",
    aiModel: "openai/gpt-4o",
    description: "System architecture and technical specifications",
    responseTime: 11000,
    isActive: true,
    tier: "premium",
    capabilities: ["text", "code", "technical"],
    costMultiplier: 1.3,
  },
  {
    id: "claude-analyst",
    name: "Claude Financial Analyst",
    address: PLATFORM_TREASURY,
    specialty: "financial-modeling",
    aiModel: "anthropic/claude-3.5-sonnet",
    description: "Financial modeling and economic analysis",
    responseTime: 10000,
    isActive: true,
    tier: "premium",
    capabilities: ["text", "data-analysis", "financial"],
    costMultiplier: 1.3,
  },
  {
    id: "grok-researcher-premium",
    name: "Grok Research Specialist",
    address: PLATFORM_TREASURY,
    specialty: "research",
    aiModel: "xai/grok-3-fast",
    description: "Deep research, competitive analysis, and insights",
    responseTime: 8000,
    isActive: true,
    tier: "premium",
    capabilities: ["text", "data-analysis", "vision"],
    costMultiplier: 1.2,
  },

  // ENTERPRISE TIER - Highest quality models
  {
    id: "gpt4-turbo-strategist",
    name: "GPT-4 Turbo Strategy Director",
    address: PLATFORM_TREASURY,
    specialty: "strategy",
    aiModel: "openai/gpt-4-turbo",
    description: "Executive-level strategic planning and analysis",
    responseTime: 12000,
    isActive: true,
    tier: "enterprise",
    capabilities: ["text", "data-analysis", "creative", "vision"],
    costMultiplier: 1.8,
  },
  {
    id: "claude-opus-writer",
    name: "Claude Opus Content Director",
    address: PLATFORM_TREASURY,
    specialty: "copywriting",
    aiModel: "anthropic/claude-opus-4-20250514",
    description: "Premium copywriting and content strategy",
    responseTime: 11000,
    isActive: true,
    tier: "enterprise",
    capabilities: ["text", "creative", "vision"],
    costMultiplier: 2.0,
  },
]

export function getProviderBySpecialty(
  specialty: string,
  budget: number,
  requiredCapabilities?: AICapability[],
): AIProvider | undefined {
  const tier = getTierFromBudget(budget)

  // Filter providers by specialty and active status
  let providers = AI_PROVIDERS.filter((p) => p.specialty === specialty && p.isActive)

  // Filter by tier (allow same tier or one tier down for flexibility)
  const tierOrder: BudgetTier[] = ["basic", "standard", "premium", "enterprise"]
  const tierIndex = tierOrder.indexOf(tier)
  const allowedTiers = tierIndex > 0 ? [tier, tierOrder[tierIndex - 1]] : [tier]

  providers = providers.filter((p) => allowedTiers.includes(p.tier))

  // Filter by required capabilities if specified
  if (requiredCapabilities && requiredCapabilities.length > 0) {
    providers = providers.filter((p) => requiredCapabilities.every((cap) => p.capabilities.includes(cap)))
  }

  // Prefer exact tier match, then fall back to lower tier
  const exactTierMatch = providers.filter((p) => p.tier === tier)
  const finalProviders = exactTierMatch.length > 0 ? exactTierMatch : providers

  // Return random provider from filtered list
  if (finalProviders.length === 0) return undefined
  return finalProviders[Math.floor(Math.random() * finalProviders.length)]
}

// Helper functions

export function getProviderById(id: string): AIProvider | undefined {
  return AI_PROVIDERS.find((p) => p.id === id)
}

export function getAllActiveProviders(): AIProvider[] {
  return AI_PROVIDERS.filter((p) => p.isActive)
}

export function getProviderCount(): number {
  return AI_PROVIDERS.filter((p) => p.isActive).length
}

export function assignProviderToTask(
  taskCategory: string,
  budget: number,
  requiredCapabilities?: AICapability[],
): AIProvider {
  const provider = getProviderBySpecialty(taskCategory, budget, requiredCapabilities)

  // Fallback to any active provider in the appropriate tier if no specialty match
  if (!provider) {
    const tier = getTierFromBudget(budget)
    const tierProviders = AI_PROVIDERS.filter((p) => p.isActive && p.tier === tier)

    if (tierProviders.length > 0) {
      return tierProviders[Math.floor(Math.random() * tierProviders.length)]
    }

    // Final fallback to any active provider
    const active = getAllActiveProviders()
    return active[Math.floor(Math.random() * active.length)]
  }

  return provider
}

export function inferCapabilitiesFromTask(category: string, description: string): AICapability[] {
  const capabilities: AICapability[] = ["text"] // All tasks need text

  const descLower = description.toLowerCase()

  // Add capabilities based on category
  switch (category) {
    case "development":
      capabilities.push("code", "technical")
      break
    case "design":
      capabilities.push("creative", "vision")
      break
    case "financial-modeling":
      capabilities.push("data-analysis", "financial")
      break
    case "research":
      capabilities.push("data-analysis")
      break
    case "copywriting":
    case "marketing":
      capabilities.push("creative")
      break
    case "strategy":
      capabilities.push("data-analysis", "creative")
      break
  }

  // Add capabilities based on description keywords
  if (descLower.includes("code") || descLower.includes("programming") || descLower.includes("api")) {
    if (!capabilities.includes("code")) capabilities.push("code")
    if (!capabilities.includes("technical")) capabilities.push("technical")
  }

  if (descLower.includes("visual") || descLower.includes("image") || descLower.includes("design")) {
    if (!capabilities.includes("vision")) capabilities.push("vision")
    if (!capabilities.includes("creative")) capabilities.push("creative")
  }

  if (descLower.includes("data") || descLower.includes("analysis") || descLower.includes("research")) {
    if (!capabilities.includes("data-analysis")) capabilities.push("data-analysis")
  }

  if (descLower.includes("financial") || descLower.includes("revenue") || descLower.includes("budget")) {
    if (!capabilities.includes("financial")) capabilities.push("financial")
  }

  return capabilities
}
