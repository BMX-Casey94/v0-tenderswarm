// Core types for TenderSwarm

export interface ClientBrief {
  id: string
  text: string
  budget: number // in MNEE tokens
  createdAt: Date
  paymentTxHash?: string // Added payment transaction hash for on-chain tracking
}

export interface MicroTask {
  id: string
  description: string
  reward: number // in MNEE tokens
  category: "research" | "design" | "copywriting" | "financial-modeling" | "strategy" | "development" | "marketing"
  estimatedTime: number // in seconds
  status: "pending" | "posted" | "submitted" | "accepted" | "rejected"
  tenderId?: number
  deliverableURI?: string
  provider?: string
  requiredCapabilities?: AICapability[] // Added capability requirements for intelligent provider matching
}

export interface Tender {
  id: number
  taskHash: string
  reward: number
  winner?: string
  deliverableURI?: string
  completed: boolean
  createdAt: Date
}

export type AgentName = "Coordinator" | "Project Manager" | "Tender Poster" | "Evaluator" | "Assembler"

export interface AgentMessage {
  id: string
  agent: AgentName
  message: string
  timestamp: Date
  type: "info" | "success" | "warning" | "error" | "thinking" | "action"
  metadata?: Record<string, any>
}

export interface AgentPayment {
  id: string
  agent: AgentName
  amount: number
  reason: string
  tokensUsed?: number
  tasksProcessed?: number
  timestamp: Date
}

export interface Payment {
  id: string
  tenderId: number
  amount: number // in MNEE
  recipient: string
  providerName?: string
  taskId?: string
  txHash: string
  timestamp: Date
  paymentType?: "provider" | "refund" // Added payment type to distinguish refunds from provider payments
}

export type SwarmPhase =
  | "idle"
  | "initializing"
  | "analyzing"
  | "posting"
  | "awaiting-submissions"
  | "evaluating"
  | "assembling"
  | "complete"
  | "error"

export interface SwarmStatus {
  phase: SwarmPhase
  currentTask?: string
  progress: number // 0-100
  totalTasks: number
  completedTasks: number
  totalSpent: number // MNEE spent so far
  providersResponded: number
}

export interface SwarmEvent {
  type: "status" | "message" | "task-update" | "payment" | "error" | "complete"
  data: SwarmStatus | AgentMessage | MicroTask | Payment | { error: string } | { summary: SwarmSummary }
  timestamp: Date
}

export interface SwarmSummary {
  totalTasks: number
  completedTasks: number
  totalSpent: number
  originalBudget: number
  refundAmount: number
  tier: BudgetTier
  costBreakdown: {
    agentFees: number
    providerPayments: number
    platformFee: number
    totalCost: number
  }
  providersUsed: number
  executionTime: number
  agentPayments: AgentPayment[]
  finalDeliverable: string
  deliverables: Array<{
    category: string
    uri: string
    provider: string
    content?: string
    image?: {
      base64Data: string
      mimeType: string
      prompt: string
    }
  }>
  generatedImages: Array<{
    id: string
    category: string
    base64Data: string
    mimeType: string
    prompt: string
  }>
  generatedVideos?: Array<{
    id: string
    category: string
    videoUrl: string
    thumbnailUrl?: string
    duration: number
    prompt: string
  }>
}

export interface GeneratedDeliverable {
  taskId: string
  taskDescription: string
  category: string
  provider: string
  providerName: string
  content: string // Markdown content
  tokensUsed: number
  timestamp: Date
  image?: {
    base64Data: string
    mimeType: string
    prompt: string
  }
  video?: {
    videoUrl: string
    thumbnailUrl?: string
    duration: number
    prompt: string
  }
}

export type AICapability = "text" | "code" | "vision" | "data-analysis" | "creative" | "technical" | "financial"

export type BudgetTier = "basic" | "standard" | "premium" | "enterprise"

export interface BudgetTierConfig {
  tier: BudgetTier
  minBudget: number
  maxBudget: number
  modelQuality: "fast" | "standard" | "advanced" | "premium"
  description: string
}
