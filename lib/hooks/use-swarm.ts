// React hook for managing swarm state
"use client"

import { useState, useCallback, useRef } from "react"
import type { SwarmStatus, SwarmEvent, AgentMessage, MicroTask, Payment, SwarmSummary } from "@/lib/types"

interface UseSwarmReturn {
  status: SwarmStatus
  messages: AgentMessage[]
  tasks: MicroTask[]
  payments: Payment[]
  summary: SwarmSummary | null
  isRunning: boolean
  error: string | null
  startSwarm: (
    brief: string,
    budget: number,
    contractAddress?: string,
    txHash?: string,
    isDemoMode?: boolean,
    userAddress?: string,
  ) => Promise<void>
  reset: () => void
}

const initialStatus: SwarmStatus = {
  phase: "idle",
  progress: 0,
  totalTasks: 0,
  completedTasks: 0,
  totalSpent: 0,
  providersResponded: 0,
}

export function useSwarm(): UseSwarmReturn {
  const [status, setStatus] = useState<SwarmStatus>(initialStatus)
  const [messages, setMessages] = useState<AgentMessage[]>([])
  const [tasks, setTasks] = useState<MicroTask[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [summary, setSummary] = useState<SwarmSummary | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const processEvent = useCallback((event: SwarmEvent) => {
    switch (event.type) {
      case "status":
        setStatus(event.data as SwarmStatus)
        break
      case "message":
        setMessages((prev) => [...prev, event.data as AgentMessage])
        break
      case "task-update":
        const updatedTask = event.data as MicroTask
        setTasks((prev) => {
          const index = prev.findIndex((t) => t.id === updatedTask.id)
          if (index >= 0) {
            const newTasks = [...prev]
            newTasks[index] = updatedTask
            return newTasks
          }
          return [...prev, updatedTask]
        })
        break
      case "payment":
        setPayments((prev) => [...prev, event.data as Payment])
        break
      case "complete":
        const completeData = event.data as { summary: SwarmSummary }
        setSummary(completeData.summary)
        setIsRunning(false)
        break
      case "error":
        const errorData = event.data as { error: string }
        setError(errorData.error)
        setIsRunning(false)
        break
    }
  }, [])

  const startSwarm = useCallback(
    async (
      brief: string,
      budget: number,
      contractAddress?: string,
      txHash?: string,
      isDemoMode?: boolean,
      userAddress?: string,
    ) => {
      // Reset state
      setStatus(initialStatus)
      setMessages([])
      setTasks([])
      setPayments([])
      setSummary(null)
      setError(null)
      setIsRunning(true)

      // Abort any existing connection
      if (abortRef.current) {
        abortRef.current.abort()
      }
      abortRef.current = new AbortController()

      try {
        const response = await fetch("/api/swarm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brief, budget, contractAddress, txHash, isDemoMode, userAddress }),
          signal: abortRef.current.signal,
        })

        if (!response.ok) {
          throw new Error("Failed to start swarm")
        }

        const reader = response.body?.getReader()
        if (!reader) {
          throw new Error("No response body")
        }

        const decoder = new TextDecoder()
        let buffer = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n\n")
          buffer = lines.pop() || ""

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const event = JSON.parse(line.slice(6)) as SwarmEvent
                processEvent(event)
              } catch (e) {
                console.error("Failed to parse event:", e)
              }
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return
        }
        setError(err instanceof Error ? err.message : "Unknown error")
        setIsRunning(false)
      }
    },
    [processEvent],
  )

  const reset = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort()
    }
    setStatus(initialStatus)
    setMessages([])
    setTasks([])
    setPayments([])
    setSummary(null)
    setError(null)
    setIsRunning(false)
  }, [])

  return {
    status,
    messages,
    tasks,
    payments,
    summary,
    isRunning,
    error,
    startSwarm,
    reset,
  }
}
