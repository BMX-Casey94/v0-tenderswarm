// Content Generator - Creates actual markdown deliverables using AI
import { generateText } from "ai"
import type { MicroTask, GeneratedDeliverable } from "@/lib/types"
import { type TierConfig, generateProjectImage } from "./tier-system"
import { assignProviderToTask } from "./ai-providers"
import { DEMO_MODELS, shouldUseDemoMode } from "./demo-models"

const categoryPrompts: Record<string, Record<string, string>> = {
  research: {
    brief: `Create a concise research summary (200-300 words) with key findings and recommendations.`,
    standard: `Create a detailed research report (400-600 words) with executive summary, key findings, data analysis, and recommendations.`,
    detailed: `Create a comprehensive research report (800-1200 words) with executive summary, methodology, in-depth findings, data analysis, competitive insights, sources, and actionable recommendations.`,
    comprehensive: `Create an exhaustive research document (1500-2500 words) covering executive summary, detailed methodology, comprehensive findings with data visualization suggestions, market analysis, competitive landscape, risk assessment, multiple data sources, and strategic recommendations with implementation roadmap.`,
  },
  design: {
    brief: `Create a basic design brief (200-300 words) with visual guidelines and key components.`,
    standard: `Create a design specification (400-600 words) with user personas, visual guidelines, and component specifications.`,
    detailed: `Create a detailed design document (800-1200 words) with user personas, user journey maps, visual design system, component library specs, interaction patterns, and accessibility guidelines.`,
    comprehensive: `Create an exhaustive design specification (1500-2500 words) covering user research synthesis, multiple personas, complete user journey mapping, full design system with tokens, comprehensive component library, micro-interactions, responsive breakpoints, accessibility compliance (WCAG), and design handoff documentation.`,
  },
  copywriting: {
    brief: `Create essential marketing copy (200-300 words) with headlines and key messages.`,
    standard: `Create marketing copy package (400-600 words) with headlines, taglines, body copy, and CTAs.`,
    detailed: `Create comprehensive copy deck (800-1200 words) with multiple headline variations, taglines, long-form body copy, email sequences, social media copy, and tone guidelines.`,
    comprehensive: `Create a complete content strategy document (1500-2500 words) with brand voice guidelines, messaging hierarchy, multiple headline/tagline variations, full website copy, email marketing sequences, social media content calendar, ad copy variations, SEO keywords, and content performance metrics.`,
  },
  "financial-modeling": {
    brief: `Create a financial summary (200-300 words) with key metrics and projections.`,
    standard: `Create a financial analysis (400-600 words) with revenue projections, cost analysis, and key metrics.`,
    detailed: `Create a detailed financial model document (800-1200 words) with P&L projections, cash flow analysis, unit economics, sensitivity analysis, and investment recommendations.`,
    comprehensive: `Create an exhaustive financial analysis (1500-2500 words) covering detailed P&L with 3-5 year projections, cash flow modeling, balance sheet impacts, unit economics deep-dive, multiple scenario analysis, sensitivity modeling, DCF valuation, comparable company analysis, and strategic financial recommendations.`,
  },
  strategy: {
    brief: `Create a strategic overview (200-300 words) with objectives and key actions.`,
    standard: `Create a strategic plan (400-600 words) with market analysis, objectives, action items, and KPIs.`,
    detailed: `Create a detailed strategy document (800-1200 words) with market analysis, competitive positioning, strategic objectives, implementation roadmap, resource requirements, and success metrics.`,
    comprehensive: `Create a comprehensive strategic plan (1500-2500 words) covering industry analysis, detailed competitive landscape, SWOT analysis, strategic options evaluation, recommended strategy with rationale, phased implementation roadmap, resource allocation, risk mitigation, governance framework, and KPI dashboard design.`,
  },
  development: {
    brief: `Create a technical overview (200-300 words) with architecture summary and key components.`,
    standard: `Create a technical specification (400-600 words) with architecture design, API specs, and implementation notes.`,
    detailed: `Create a detailed technical document (800-1200 words) with system architecture, data models, API specifications, security considerations, and deployment strategy.`,
    comprehensive: `Create an exhaustive technical specification (1500-2500 words) covering system architecture with diagrams, microservices design, complete API documentation, database schema, security architecture, CI/CD pipeline, monitoring/observability strategy, scalability considerations, disaster recovery, and technical debt management.`,
  },
  marketing: {
    brief: `Create a marketing overview (200-300 words) with campaign concept and target audience.`,
    standard: `Create a marketing plan (400-600 words) with target audience, channel strategy, and content calendar.`,
    detailed: `Create a detailed marketing strategy (800-1200 words) with audience segmentation, multi-channel strategy, content calendar, budget allocation, and success metrics.`,
    comprehensive: `Create a comprehensive marketing playbook (1500-2500 words) covering market segmentation, detailed buyer personas, full-funnel marketing strategy, channel-specific tactics, content marketing framework, paid media strategy, marketing automation workflows, A/B testing plan, attribution modeling, and ROI projections.`,
  },
}

export async function generateDeliverableContent(
  task: MicroTask,
  originalBrief: string,
  providerName: string,
  tierConfig?: TierConfig,
  shouldGenerateImage?: boolean,
  budget?: number,
  isDemoMode?: boolean,
): Promise<GeneratedDeliverable> {
  const category = task?.category || "research"
  const contentDepth = tierConfig?.contentDepth || "standard"

  const assignedProvider = assignProviderToTask(category, budget || 10, task.requiredCapabilities)

  const aiModel = shouldUseDemoMode(isDemoMode)
    ? DEMO_MODELS.content
    : assignedProvider.aiModel || tierConfig?.aiModel || "xai/grok-3-fast"

  const maxTokens = shouldUseDemoMode(isDemoMode) ? 800 : tierConfig?.maxTokensPerTask || 2000

  const depthPrompts = categoryPrompts[category] || categoryPrompts.research
  const systemPrompt = depthPrompts[contentDepth] || depthPrompts.standard

  const prompt = `Create a deliverable for this task:

ORIGINAL CLIENT BRIEF: "${originalBrief || "No brief provided"}"

SPECIFIC TASK: "${task?.description || "General task"}"

CATEGORY: ${category}
DEPTH LEVEL: ${contentDepth}

${systemPrompt}

Create a professional, detailed markdown document that fully addresses this task.
Use proper markdown formatting with headers, bullet points, tables where appropriate.
Make it specific and actionable, not generic.`

  const { text, usage } = await generateText({
    model: aiModel,
    system: `You are an expert ${category} specialist. Create high-quality, professional deliverables.`,
    prompt,
    maxOutputTokens: maxTokens,
    temperature: 0.7,
  })

  const tokensUsed = usage?.totalTokens || 1000

  let imageData: GeneratedDeliverable["image"] | undefined

  if (shouldGenerateImage && tierConfig?.includesImages && !shouldUseDemoMode(isDemoMode)) {
    const image = await generateProjectImage(
      `Create a professional visual for: ${task?.description?.slice(0, 100)}`,
      category,
      originalBrief,
    )

    if (image) {
      imageData = {
        base64Data: image.base64Data,
        mimeType: image.mimeType,
        prompt: image.prompt,
      }
    }
  }

  return {
    taskId: task?.id || `task-${Date.now()}`,
    taskDescription: task?.description || "Unknown task",
    category,
    provider: assignedProvider.address,
    providerName: assignedProvider.name,
    content: text || "",
    tokensUsed,
    timestamp: new Date(),
    image: imageData,
  }
}

export async function assembleFinalDocument(
  deliverables: GeneratedDeliverable[],
  originalBrief: string,
  tierConfig?: TierConfig,
  isDemoMode?: boolean,
): Promise<{ content: string; tokensUsed: number }> {
  const safeDeliverables = deliverables || []

  if (safeDeliverables.length === 0) {
    return {
      content: "# Project Summary\n\nNo deliverables were generated for this project.",
      tokensUsed: 0,
    }
  }

  const byCategory: Record<string, GeneratedDeliverable[]> = {}
  for (const d of safeDeliverables) {
    if (!d) continue
    const category = d.category || "other"
    if (!byCategory[category]) byCategory[category] = []
    byCategory[category].push(d)
  }

  const categoryEntries = Object.entries(byCategory)
  if (categoryEntries.length === 0) {
    return {
      content: "# Project Summary\n\nNo categorized deliverables available.",
      tokensUsed: 0,
    }
  }

  const aiModel = shouldUseDemoMode(isDemoMode) ? DEMO_MODELS.default : tierConfig?.aiModel || "xai/grok-3-fast"

  // Basic: 16000, Standard: 24000, Premium: 32000, Enterprise: 48000
  // Demo mode: 4000 (up from 3000)
  const baseMaxTokens = tierConfig?.maxTokensPerTask || 4000
  const maxTokens = shouldUseDemoMode(isDemoMode) ? 4000 : Math.max(16000, baseMaxTokens * 4) // At least 16000, or 4x the per-task limit

  const prompt = `You are compiling a final project deliverable package.

ORIGINAL BRIEF: "${originalBrief || "No brief provided"}"

DELIVERABLES BY CATEGORY:
${categoryEntries
  .map(
    ([cat, items]) => `
## ${cat.toUpperCase()}
${(items || [])
  .map(
    (d) => `
### ${d?.taskDescription || "Task"}
${d?.content || "No content"}
`,
  )
  .join("\n")}
`,
  )
  .join("\n")}

Create a polished, executive-ready final document that:
1. Starts with an Executive Summary synthesizing all deliverables
2. Organizes the content logically by category
3. Adds transitions between sections
4. Ends with Next Steps and Recommendations
5. Uses professional markdown formatting throughout
${tierConfig?.includesImages ? "6. Note where images have been generated to accompany sections" : ""}

IMPORTANT: Include ALL content from the deliverables above. Do not truncate or summarize - expand and integrate fully.

Output the complete assembled document.`

  const { text, usage } = await generateText({
    model: aiModel,
    system:
      "You are an expert document editor and project manager. Create cohesive, professional deliverable packages. Always include ALL provided content - never truncate.",
    prompt,
    maxOutputTokens: maxTokens,
    temperature: 0.5,
  })

  return {
    content: text || "",
    tokensUsed: usage?.totalTokens || 2000,
  }
}
