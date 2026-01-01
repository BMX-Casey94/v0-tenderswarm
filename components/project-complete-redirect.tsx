"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Loader2, ExternalLink } from "lucide-react"
import type { SwarmSummary, MicroTask, AgentMessage, Payment } from "@/lib/types"
import { CHAIN_CONFIG, DEFAULT_CHAIN } from "@/lib/contracts/config"

interface ProjectCompleteRedirectProps {
  summary: SwarmSummary
  tasks: MicroTask[]
  messages: AgentMessage[]
  payments: Payment[]
  brief: string
  txHash?: string | null
}

export function ProjectCompleteRedirect({
  summary,
  tasks,
  messages,
  payments,
  brief,
  txHash,
}: ProjectCompleteRedirectProps) {
  const router = useRouter()
  const [countdown, setCountdown] = useState(2)

  useEffect(() => {
    // Store data in sessionStorage for the results page
    sessionStorage.setItem(
      "swarmResults",
      JSON.stringify({
        summary,
        tasks,
        messages,
        payments,
        brief,
        txHash,
      }),
    )

    // Countdown timer
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    // Redirect after 2 seconds
    const timeout = setTimeout(() => {
      router.push("/results")
    }, 2000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [router, summary, tasks, messages, payments, brief, txHash])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop blur */}
      <div className="absolute inset-0 bg-background/90 backdrop-blur-lg" />

      {/* Content */}
      <div className="relative z-10 text-center space-y-8">
        {/* Success Icon with glow */}
        <div className="relative inline-flex">
          <div
            className="absolute inset-0 rounded-full blur-2xl opacity-50"
            style={{ background: "radial-gradient(circle, rgba(34, 197, 94, 0.5) 0%, transparent 70%)" }}
          />
          <div className="relative w-24 h-24 rounded-full bg-green-500/20 border-2 border-green-500/50 flex items-center justify-center animate-pulse">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
          </div>
        </div>

        {/* Text */}
        <div className="space-y-3">
          <h1
            className="text-4xl md:text-5xl font-bold"
            style={{
              background: "linear-gradient(180deg, #22c55e 0%, #16a34a 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Project Complete!
          </h1>
          <p className="text-lg text-muted-foreground">Redirecting to your results...</p>
        </div>

        {txHash && (
          <a
            href={`${CHAIN_CONFIG[DEFAULT_CHAIN].blockExplorer}/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-colors"
          >
            <span className="text-sm">View Payment on Etherscan</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        )}

        {/* Loading Spinner */}
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Loading in</span>
            <span className="text-lg font-bold text-primary">{countdown}</span>
          </div>
        </div>

        {/* Stats Preview */}
        <div className="flex items-center justify-center gap-6 pt-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{summary?.completedTasks || 0}</div>
            <div className="text-xs text-muted-foreground">Deliverables</div>
          </div>
          <div className="w-px h-10 bg-border" />
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{(summary?.refundAmount || 0).toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">MNEE Refund</div>
          </div>
          <div className="w-px h-10 bg-border" />
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{summary?.executionTime || 0}s</div>
            <div className="text-xs text-muted-foreground">Duration</div>
          </div>
        </div>
      </div>
    </div>
  )
}
