import { generateText } from "ai"

export type BudgetTier = "basic" | "standard" | "premium" | "enterprise"

export interface TierConfig {
  tier: BudgetTier
  minBudget: number
  maxTasks: number
  aiModel: string
  maxTokensPerTask: number
  includesImages: boolean
  maxImages: number
  contentDepth: "brief" | "standard" | "detailed" | "comprehensive"
  priority: number // Processing priority
  includesVideo?: boolean
  maxVideos?: number
}

export const TIER_CONFIGS: Record<BudgetTier, TierConfig> = {
  basic: {
    tier: "basic",
    minBudget: 0.25,
    maxTasks: 3,
    aiModel: "xai/grok-3-fast",
    maxTokensPerTask: 4000,
    includesImages: false,
    maxImages: 0,
    contentDepth: "brief",
    priority: 1,
  },
  standard: {
    tier: "standard",
    minBudget: 0.5,
    maxTasks: 5,
    aiModel: "xai/grok-3-fast",
    maxTokensPerTask: 6000,
    includesImages: false,
    maxImages: 0,
    contentDepth: "standard",
    priority: 2,
  },
  premium: {
    tier: "premium",
    minBudget: 1.0,
    maxTasks: 8,
    aiModel: "xai/grok-3",
    maxTokensPerTask: 8000,
    includesImages: true,
    maxImages: 3,
    contentDepth: "detailed",
    priority: 3,
  },
  enterprise: {
    tier: "enterprise",
    minBudget: 2.0,
    maxTasks: 12,
    aiModel: "xai/grok-3",
    maxTokensPerTask: 12000,
    includesImages: true,
    maxImages: 6,
    includesVideo: true,
    maxVideos: 1,
    contentDepth: "comprehensive",
    priority: 4,
  },
}

export function determineTier(budget: number): TierConfig {
  if (budget >= 2) return TIER_CONFIGS.enterprise
  if (budget >= 1) return TIER_CONFIGS.premium
  if (budget >= 0.5) return TIER_CONFIGS.standard
  return TIER_CONFIGS.basic
}

export function getTierBadgeColor(tier: BudgetTier): string {
  switch (tier) {
    case "enterprise":
      return "#FFD700" // Gold
    case "premium":
      return "#A855F7" // Purple
    case "standard":
      return "#3B82F6" // Blue
    default:
      return "#6B7280" // Gray
  }
}

export function getTierDescription(tier: BudgetTier): string {
  switch (tier) {
    case "enterprise":
      return "Maximum AI power with comprehensive analysis, up to 12 deliverables, and 6 AI-generated images"
    case "premium":
      return "Enhanced AI with detailed analysis, up to 8 deliverables, and 3 AI-generated images"
    case "standard":
      return "Standard AI processing with up to 5 deliverables"
    default:
      return "Basic AI processing with up to 3 deliverables"
  }
}

// Image generation using Gemini via AI Gateway
export interface GeneratedImage {
  id: string
  prompt: string
  base64Data: string
  mimeType: string
  category: string
  timestamp: Date
}

export async function generateProjectImage(
  prompt: string,
  category: string,
  projectContext: string,
  costTracker?: CostTracker,
): Promise<GeneratedImage | null> {
  try {
    if (costTracker && !costTracker.canAfford(0.04)) {
      console.log("[v0] Insufficient budget for image generation, skipping")
      return null
    }

    const enhancedPrompt = `Create a professional, high-quality image for a business project.
Context: ${projectContext}
Category: ${category}
Specific request: ${prompt}

Style: Clean, modern, professional. Suitable for business presentations and reports.`

    const result = await generateText({
      model: "google/gemini-3-pro-image",
      prompt: enhancedPrompt,
    })

    // Check if images were generated
    const imageFiles = result.files?.filter((f) => f.mediaType?.startsWith("image/")) || []

    if (imageFiles.length > 0 && imageFiles[0].uint8Array) {
      const imageFile = imageFiles[0]
      const base64 = Buffer.from(imageFile.uint8Array).toString("base64")

      if (costTracker) {
        costTracker.trackImageGeneration("google/gemini-3-pro-image", 1)
      }

      return {
        id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        prompt,
        base64Data: base64,
        mimeType: imageFile.mediaType || "image/png",
        category,
        timestamp: new Date(),
      }
    }

    return null
  } catch (error) {
    console.error("[v0] Image generation error:", error)
    return null
  }
}

// Determine which tasks should have images generated
export function selectImageTasks(
  tasks: Array<{ id: string; category: string; description: string }>,
  tier: TierConfig,
): Array<{ taskId: string; imagePrompt: string; category: string }> {
  if (!tier.includesImages || tier.maxImages === 0) return []

  // Prioritize visual categories
  const priorityOrder = [
    "design",
    "marketing",
    "strategy",
    "research",
    "development",
    "financial-modeling",
    "copywriting",
  ]

  const sortedTasks = [...tasks].sort((a, b) => {
    const aIndex = priorityOrder.indexOf(a.category)
    const bIndex = priorityOrder.indexOf(b.category)
    return aIndex - bIndex
  })

  const selectedTasks = sortedTasks.slice(0, tier.maxImages)

  return selectedTasks.map((task) => ({
    taskId: task.id,
    imagePrompt: generateImagePromptForTask(task.category, task.description),
    category: task.category,
  }))
}

function generateImagePromptForTask(category: string, description: string): string {
  const categoryPrompts: Record<string, string> = {
    design: `A modern UI/UX design mockup or interface wireframe related to: ${description.slice(0, 100)}`,
    marketing: `A professional marketing infographic or campaign visual for: ${description.slice(0, 100)}`,
    strategy: `A business strategy diagram or roadmap visualization for: ${description.slice(0, 100)}`,
    research: `A data visualization or research findings chart about: ${description.slice(0, 100)}`,
    development: `A technical architecture diagram or system flowchart for: ${description.slice(0, 100)}`,
    "financial-modeling": `A financial chart, graph, or projection visualization for: ${description.slice(0, 100)}`,
    copywriting: `A brand mood board or typography showcase for: ${description.slice(0, 100)}`,
  }

  return categoryPrompts[category] || `A professional business illustration for: ${description.slice(0, 100)}`
}

// Video generation using placeholder for now
export interface GeneratedVideo {
  id: string
  prompt: string
  videoUrl: string
  thumbnailUrl?: string
  duration: number // seconds
  category: string
  timestamp: Date
}

export async function generateProjectVideo(
  prompt: string,
  category: string,
  projectContext: string,
): Promise<GeneratedVideo | null> {
  try {
    // Use a video-capable model - for now return placeholder as video gen requires specific setup
    const enhancedPrompt = `Create a short professional video for a business project.
Context: ${projectContext}
Category: ${category}
Specific request: ${prompt}

Style: Clean, modern, professional. 15-30 seconds. Suitable for business presentations.`

    // Note: Actual video generation would use a model like "runway/gen-3" or similar
    // For now, we'll generate a placeholder that shows video capability
    console.log("[v0] Video generation requested for:", enhancedPrompt.slice(0, 100))

    return {
      id: `vid-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      prompt,
      videoUrl: "", // Would be populated by actual video generation
      duration: 15,
      category,
      timestamp: new Date(),
    }
  } catch (error) {
    console.error("[v0] Video generation error:", error)
    return null
  }
}

// Calculate cost multiplier based on tier
export function getTierCostMultiplier(tier: BudgetTier): number {
  switch (tier) {
    case "enterprise":
      return 1.5 // More AI compute = higher cost per token
    case "premium":
      return 1.25
    case "standard":
      return 1.0
    default:
      return 0.8 // Basic tier is more efficient
  }
}

// Cost tracking interface
export interface CostTracker {
  canAfford(cost: number): boolean
  trackImageGeneration(model: string, tokens: number): void
}
