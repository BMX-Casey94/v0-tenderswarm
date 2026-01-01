// Coordinator Agent - Orchestrates the entire swarm
import { BaseAgent } from "./agent-base"
import type { AgentMessage, SwarmStatus, SwarmPhase } from "@/lib/types"

export class CoordinatorAgent extends BaseAgent {
  constructor() {
    super(
      "Coordinator",
      `You are the Coordinator of TenderSwarm, an autonomous AI agency.
You oversee all agents and ensure smooth execution of client projects.
You communicate status updates clearly and professionally.
You never make up information - only report what has actually happened.`,
    )
  }

  async announce(phase: SwarmPhase, details: string): Promise<AgentMessage> {
    const phaseMessages: Record<SwarmPhase, string> = {
      idle: "Standing by for new projects.",
      initializing: "Initializing swarm agents...",
      analyzing: "Project Manager is analyzing the client brief.",
      posting: "Tender Poster is creating on-chain tenders.",
      "awaiting-submissions": "Waiting for provider submissions.",
      evaluating: "Evaluator is reviewing deliverables.",
      assembling: "Assembler is compiling final output.",
      complete: "Project completed successfully!",
      error: "An error occurred during execution.",
    }

    const baseMessage = phaseMessages[phase] || "Processing..."
    const fullMessage = details ? `${baseMessage} ${details}` : baseMessage

    return this.createMessage(fullMessage, phase === "error" ? "error" : "info")
  }

  async summarize(status: SwarmStatus): Promise<AgentMessage> {
    const summary = await this.think(`
Create a brief, professional summary of this project status:
- Phase: ${status.phase}
- Progress: ${status.progress}%
- Tasks: ${status.completedTasks}/${status.totalTasks} completed
- MNEE Spent: ${status.totalSpent}
- Providers Responded: ${status.providersResponded}

Keep it to 1-2 sentences. Be specific about what has been accomplished.`)

    return this.createMessage(summary, "success")
  }

  async execute(): Promise<AgentMessage> {
    return this.announce("initializing", "All agents online and ready.")
  }
}
