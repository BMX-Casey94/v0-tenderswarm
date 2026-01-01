"use client"

import type { SwarmPhase } from "@/lib/types"
import { CheckCircle2, Loader2 } from "lucide-react"

interface SwarmProgressProps {
  phase: SwarmPhase
  progress: number
  completedTasks: number
  totalTasks: number
}

const PHASES: { key: SwarmPhase; label: string; description: string }[] = [
  { key: "initializing", label: "Initialize", description: "Starting swarm agents" },
  { key: "analyzing", label: "Analyze", description: "Breaking down project brief" },
  { key: "posting", label: "Post Tasks", description: "Creating task tenders" },
  { key: "awaiting-submissions", label: "Generate", description: "AI creating deliverables" },
  { key: "evaluating", label: "Evaluate", description: "Reviewing submissions" },
  { key: "assembling", label: "Assemble", description: "Compiling final package" },
  { key: "complete", label: "Complete", description: "Project finished" },
]

function getPhaseIndex(phase: SwarmPhase): number {
  const idx = PHASES.findIndex((p) => p.key === phase)
  return idx >= 0 ? idx : 0
}

export function SwarmProgress({ phase, progress, completedTasks, totalTasks }: SwarmProgressProps) {
  const currentPhaseIndex = getPhaseIndex(phase)
  const isComplete = phase === "complete"
  const isError = phase === "error"
  const isIdle = phase === "idle"

  if (isIdle) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            {isComplete ? "Project Complete" : isError ? "Error Occurred" : PHASES[currentPhaseIndex]?.description}
          </span>
          <span className="text-primary font-medium">{progress}%</span>
        </div>
        <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${progress}%`,
              backgroundColor: isError ? "#ef4444" : isComplete ? "#22c55e" : "#D4AF37",
            }}
          />
        </div>
      </div>

      {/* Phase steps */}
      <div className="flex items-center justify-between gap-1">
        {PHASES.filter((p) => p.key !== "complete").map((phaseItem, idx) => {
          const isCurrentPhase = phaseItem.key === phase
          const isPastPhase = idx < currentPhaseIndex
          const isFuturePhase = idx > currentPhaseIndex

          return (
            <div key={phaseItem.key} className="flex flex-col items-center flex-1">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center mb-1 transition-all duration-300"
                style={{
                  backgroundColor:
                    isPastPhase || isComplete ? "#22c55e" : isCurrentPhase ? "#D4AF37" : "rgba(107, 114, 128, 0.3)",
                  border: isCurrentPhase ? "2px solid #D4AF37" : "none",
                }}
              >
                {isPastPhase || isComplete ? (
                  <CheckCircle2 className="w-4 h-4 text-white" />
                ) : isCurrentPhase ? (
                  <Loader2 className="w-4 h-4 text-black animate-spin" />
                ) : (
                  <span className="text-xs text-muted-foreground">{idx + 1}</span>
                )}
              </div>
              <span
                className="text-[10px] text-center leading-tight"
                style={{
                  color: isPastPhase || isComplete ? "#22c55e" : isCurrentPhase ? "#D4AF37" : "#6b7280",
                }}
              >
                {phaseItem.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Task progress */}
      {totalTasks > 0 && (
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <span>
            Tasks: {completedTasks}/{totalTasks} completed
          </span>
        </div>
      )}
    </div>
  )
}
