"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import type { SwarmStatus, AgentMessage } from "@/lib/types"
import { glassCardStyle } from "@/lib/styles"

interface AgentNetworkProps {
  status: SwarmStatus
  messages: AgentMessage[]
  compact?: boolean // Added compact prop
}

const agents = [
  { id: "coordinator", name: "Coordinator", shortName: "C", color: "#FFD700" },
  { id: "pm", name: "Project Manager", shortName: "PM", color: "#4A9EFF" },
  { id: "poster", name: "Tender Poster", shortName: "TP", color: "#FF6B00" },
  { id: "evaluator", name: "Evaluator", shortName: "E", color: "#A855F7" },
  { id: "assembler", name: "Assembler", shortName: "A", color: "#22C55E" },
]

const connections = [
  { from: "coordinator", to: "pm" },
  { from: "coordinator", to: "poster" },
  { from: "pm", to: "poster" },
  { from: "pm", to: "evaluator" },
  { from: "poster", to: "evaluator" },
  { from: "evaluator", to: "assembler" },
  { from: "assembler", to: "coordinator" },
]

export function AgentNetwork({ status, messages, compact = false }: AgentNetworkProps) {
  const [activeAgents, setActiveAgents] = useState<Set<string>>(new Set())
  const [activeConnections, setActiveConnections] = useState<Set<string>>(new Set())
  const [pulsingAgent, setPulsingAgent] = useState<string | null>(null)

  useEffect(() => {
    const phase = status.phase
    if (phase === "idle") {
      setActiveAgents(new Set())
      setActiveConnections(new Set())
      return
    }

    const active = new Set<string>()
    const activeConns = new Set<string>()

    active.add("coordinator")

    if (phase === "analyzing") {
      active.add("pm")
      activeConns.add("coordinator-pm")
    } else if (phase === "posting") {
      active.add("pm")
      active.add("poster")
      activeConns.add("coordinator-pm")
      activeConns.add("coordinator-poster")
      activeConns.add("pm-poster")
    } else if (phase === "awaiting-submissions") {
      active.add("pm")
      active.add("poster")
      activeConns.add("pm-poster")
    } else if (phase === "evaluating") {
      active.add("pm")
      active.add("poster")
      active.add("evaluator")
      activeConns.add("pm-evaluator")
      activeConns.add("poster-evaluator")
    } else if (phase === "assembling" || phase === "complete") {
      active.add("pm")
      active.add("poster")
      active.add("evaluator")
      active.add("assembler")
      activeConns.add("evaluator-assembler")
      activeConns.add("assembler-coordinator")
    }

    setActiveAgents(active)
    setActiveConnections(activeConns)
  }, [status.phase])

  useEffect(() => {
    if (messages.length === 0) return
    const lastMessage = messages[messages.length - 1]
    const agentMap: Record<string, string> = {
      Coordinator: "coordinator",
      "Project Manager": "pm",
      "Tender Poster": "poster",
      Evaluator: "evaluator",
      Assembler: "assembler",
    }
    const agentId = agentMap[lastMessage.agent]
    if (agentId) {
      setPulsingAgent(agentId)
      const timer = setTimeout(() => setPulsingAgent(null), 800)
      return () => clearTimeout(timer)
    }
  }, [messages])

  if (compact) {
    return (
      <Card className="p-4 rounded-2xl" style={glassCardStyle}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Agent Network</h3>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] text-muted-foreground">{activeAgents.size} active</span>
          </div>
        </div>

        {/* Horizontal agent display */}
        <div className="flex items-center justify-between gap-1">
          {agents.map((agent, index) => {
            const isActive = activeAgents.has(agent.id)
            const isPulsing = pulsingAgent === agent.id
            const nextAgent = agents[index + 1]
            const hasConnection =
              nextAgent &&
              (activeConnections.has(`${agent.id}-${nextAgent.id}`) ||
                activeConnections.has(`${nextAgent.id}-${agent.id}`))

            return (
              <div key={agent.id} className="flex items-center flex-1">
                {/* Agent node */}
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all duration-300 relative"
                    style={{
                      backgroundColor: isActive ? `${agent.color}20` : "rgba(255,255,255,0.03)",
                      borderWidth: "1.5px",
                      borderColor: isActive ? agent.color : "rgba(255,255,255,0.1)",
                      color: isActive ? agent.color : "rgba(255,255,255,0.25)",
                      boxShadow: isPulsing
                        ? `0 0 16px ${agent.color}80, 0 0 24px ${agent.color}40`
                        : isActive
                          ? `0 0 8px ${agent.color}30`
                          : "none",
                      transform: isPulsing ? "scale(1.15)" : "scale(1)",
                    }}
                  >
                    {isPulsing && (
                      <div
                        className="absolute inset-0 rounded-lg animate-ping"
                        style={{ backgroundColor: agent.color, opacity: 0.2 }}
                      />
                    )}
                    <span className="relative z-10">{agent.shortName}</span>
                  </div>
                  <span
                    className="text-[9px] font-medium truncate max-w-[50px] text-center"
                    style={{ color: isActive ? agent.color : "rgba(255,255,255,0.3)" }}
                  >
                    {agent.id === "pm"
                      ? "PM"
                      : agent.id === "poster"
                        ? "Poster"
                        : agent.id === "evaluator"
                          ? "Eval"
                          : agent.id === "assembler"
                            ? "Build"
                            : "Coord"}
                  </span>
                </div>

                {/* Connection line to next agent */}
                {index < agents.length - 1 && (
                  <div className="flex-1 h-[2px] mx-1 relative overflow-hidden rounded-full">
                    <div
                      className="absolute inset-0 transition-all duration-500"
                      style={{
                        background: hasConnection
                          ? `linear-gradient(90deg, ${agent.color}80, ${nextAgent?.color || agent.color}80)`
                          : "rgba(255,255,255,0.06)",
                      }}
                    />
                    {hasConnection && (
                      <div
                        className="absolute top-0 h-full w-4 animate-pulse"
                        style={{
                          background: `linear-gradient(90deg, transparent, ${agent.color}, transparent)`,
                          animation: "pulse 1s ease-in-out infinite",
                        }}
                      />
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Card>
    )
  }

  // Full version - not used anymore but kept for reference
  return (
    <Card className="p-8 rounded-2xl" style={glassCardStyle}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-foreground">Agent Network</h3>
          <p className="text-sm text-muted-foreground">Real-time coordination visualization</p>
        </div>
      </div>
      <div className="text-center py-12 text-muted-foreground">
        Network visualization is now integrated into the Swarm tab.
      </div>
    </Card>
  )
}
