"use client"

import type React from "react"
import { glowGoldStyle } from "@/lib/styles"
import { Badge } from "@/components/ui/badge"
import { Crown, Star, Zap, Sparkles, ImageIcon } from "lucide-react"
import type { BudgetTier } from "@/lib/agents/tier-system"

interface TierBadgeProps {
  tier: BudgetTier
  showDescription?: boolean
  size?: "sm" | "md" | "lg"
}

const tierConfig: Record<
  BudgetTier,
  {
    label: string
    icon: React.ReactNode
    color: string
    bgColor: string
    borderColor: string
    description: string
    features: string[]
    minBudget: number
  }
> = {
  basic: {
    label: "Basic",
    icon: <Zap className="w-3 h-3" />,
    color: "#6B7280",
    bgColor: "rgba(107, 114, 128, 0.1)",
    borderColor: "rgba(107, 114, 128, 0.3)",
    description: "Essential AI processing",
    features: ["Up to 3 deliverables", "Brief content depth", "Text output only"],
    minBudget: 0.25,
  },
  standard: {
    label: "Standard",
    icon: <Sparkles className="w-3 h-3" />,
    color: "#3B82F6",
    bgColor: "rgba(59, 130, 246, 0.1)",
    borderColor: "rgba(59, 130, 246, 0.3)",
    description: "Enhanced AI capabilities",
    features: ["Up to 5 deliverables", "Standard content depth", "Detailed analysis"],
    minBudget: 0.5,
  },
  premium: {
    label: "Premium",
    icon: <Star className="w-3 h-3" />,
    color: "#A855F7",
    bgColor: "rgba(168, 85, 247, 0.1)",
    borderColor: "rgba(168, 85, 247, 0.3)",
    description: "Advanced AI with visuals",
    features: ["Up to 8 deliverables", "Detailed content depth", "3 AI-generated images"],
    minBudget: 1.0,
  },
  enterprise: {
    label: "Enterprise",
    icon: <Crown className="w-3 h-3" />,
    color: "#FFD700",
    bgColor: "rgba(255, 215, 0, 0.1)",
    borderColor: "rgba(255, 215, 0, 0.3)",
    description: "Maximum AI power",
    features: ["Up to 12 deliverables", "Comprehensive analysis", "6 AI-generated images"],
    minBudget: 2.0,
  },
}

export function TierBadge({ tier, showDescription = false, size = "md" }: TierBadgeProps) {
  const config = tierConfig[tier]

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <Badge
        className={`${sizeClasses[size]} font-medium inline-flex items-center gap-1.5`}
        style={{
          backgroundColor: config.bgColor,
          borderWidth: "1px",
          borderStyle: "solid",
          borderColor: config.borderColor,
          color: config.color,
        }}
      >
        {config.icon}
        {config.label}
        {(tier === "premium" || tier === "enterprise") && <ImageIcon className="w-3 h-3 ml-1 opacity-70" />}
      </Badge>
      {showDescription && <span className="text-xs text-muted-foreground">{config.description}</span>}
    </div>
  )
}

export function TierSelector({ budget, onChange }: { budget: number; onChange?: (budget: number) => void }) {
  const currentTier = budget >= 2 ? "enterprise" : budget >= 1 ? "premium" : budget >= 0.5 ? "standard" : "basic"

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Selected Tier</span>
        <TierBadge tier={currentTier} />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {(["basic", "standard", "premium", "enterprise"] as BudgetTier[]).map((tier) => {
          const config = tierConfig[tier]
          const isActive = currentTier === tier

          return (
            <button
              key={tier}
              onClick={() => onChange?.(config.minBudget)}
              className={`p-3 rounded-xl text-center transition-all ${
                isActive ? "ring-2 ring-offset-2 ring-offset-background" : "hover:bg-muted/30"
              }`}
              style={{
                backgroundColor: isActive ? config.bgColor : "transparent",
                borderWidth: "1px",
                borderStyle: "solid",
                borderColor: isActive ? config.color : config.borderColor,
                ...(isActive && glowGoldStyle),
              }}
            >
              <div className="flex justify-center mb-2" style={{ color: config.color }}>
                {config.icon}
              </div>
              <div className="text-xs font-medium" style={{ color: config.color }}>
                {config.label}
              </div>
              <div className="text-[10px] text-muted-foreground mt-1">{config.minBudget}+ MNEE</div>
            </button>
          )
        })}
      </div>
      <div className="text-xs text-muted-foreground text-center mt-2">
        {tierConfig[currentTier].features.join(" • ")}
      </div>
    </div>
  )
}
