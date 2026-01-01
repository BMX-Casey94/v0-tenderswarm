// Event emitters for swarm orchestration
import type { AgentMessage, SwarmStatus, MicroTask, Payment } from "@/lib/types"

// Type-safe event emitter helper functions
export function emitMessage(message: AgentMessage): AgentMessage {
  return message
}

export function emitStatus(status: Partial<SwarmStatus>): Partial<SwarmStatus> {
  return status
}

export function emitPayment(payment: Payment): Payment {
  return payment
}

export function emitTaskUpdate(task: MicroTask): MicroTask {
  return task
}
