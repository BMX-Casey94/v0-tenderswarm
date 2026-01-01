// Demo Mode Model Configuration
// Uses free or very low-cost models for demo mode to avoid charges

export const DEMO_MODELS = {
  // Primary demo model - free tier from xAI (if available) or lowest cost option
  default: "xai/grok-3-fast", // Using fast model as it's cheapest

  // For structured data generation
  structured: "xai/grok-3-fast",

  // For content generation
  content: "xai/grok-3-fast",

  // For image generation in demo mode - disabled to avoid costs
  image: null, // No image generation in demo mode
}

// Override tier configs for demo mode
export function getDemoTierConfig(originalTier: any) {
  return {
    ...originalTier,
    aiModel: DEMO_MODELS.default,
    includesImages: false, // Disable images in demo mode
    maxImages: 0,
    includesVideo: false, // Disable videos in demo mode
    maxVideos: 0,
    maxTokensPerTask: Math.min(originalTier.maxTokensPerTask, 1000), // Limit token usage
  }
}

// Check if we should use demo mode based on context
export function shouldUseDemoMode(isDemoMode?: boolean): boolean {
  return isDemoMode === true
}
