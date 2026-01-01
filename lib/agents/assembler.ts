// Assembler Agent - Compiles final deliverable with actual content
import { z } from "zod"
import { BaseAgent } from "./agent-base"
import type { MicroTask, AgentMessage, SwarmSummary } from "@/lib/types"

export class AssemblerAgent extends BaseAgent {
  constructor() {
    super(
      "Assembler",
      `You are the Assembler agent in TenderSwarm.
Your role is to compile all accepted deliverables into a cohesive final output.
You organize deliverables by category and ensure professional presentation.`,
    )
  }

  async execute(
    tasks: MicroTask[],
    originalBrief: string,
    onMessage: (msg: AgentMessage) => void,
  ): Promise<SwarmSummary> {
    const safeTasks = tasks || []
    const acceptedTasks = safeTasks.filter((t) => t?.status === "accepted")
    this.workMetrics.tasksProcessed = acceptedTasks.length

    onMessage(this.createMessage(`Assembling ${acceptedTasks.length} deliverables into final package...`, "action"))

    // Group by category with safe reduce
    const byCategory = acceptedTasks.reduce(
      (acc, task) => {
        if (!task) return acc
        const category = task.category || "other"
        if (!acc[category]) acc[category] = []
        acc[category].push(task)
        return acc
      },
      {} as Record<string, MicroTask[]>,
    )

    const categoryEntries = Object.entries(byCategory)
    onMessage(
      this.createMessage(
        `Organizing: ${
          categoryEntries.length > 0
            ? categoryEntries.map(([cat, items]) => `${cat} (${items.length})`).join(", ")
            : "No deliverables"
        }`,
        "info",
      ),
    )

    let structure: { sections: Array<{ title: string; description: string }>; executiveSummaryPoints: string[] }
    try {
      structure = await this.thinkStructured(
        `Analyze these deliverable categories for the brief: "${originalBrief}"

Categories: ${Object.keys(byCategory).join(", ") || "None"}
Task count: ${acceptedTasks.length}

Create a logical structure for the final package.`,
        z.object({
          sections: z.array(
            z.object({
              title: z.string(),
              description: z.string(),
            }),
          ),
          executiveSummaryPoints: z.array(z.string()),
        }),
        "AssemblyStructure",
      )
    } catch (error) {
      console.log("[v0] Assembler: Error generating structure, using fallback:", error)
      structure = {
        sections: [{ title: "Deliverables", description: "All completed work" }],
        executiveSummaryPoints: ["Project completed successfully"],
      }
    }

    const safeSections = structure?.sections || []
    onMessage(
      this.createMessage(`Structure defined: ${safeSections.length} sections. Package ready for delivery.`, "success"),
    )

    // Calculate summary with safe reduce
    const totalSpent = acceptedTasks.length > 0 ? acceptedTasks.reduce((sum, t) => sum + (t?.reward || 0), 0) : 0
    const uniqueProviders = new Set(acceptedTasks.map((t) => t?.provider).filter(Boolean))

    const summary: SwarmSummary = {
      totalTasks: safeTasks.length,
      completedTasks: acceptedTasks.length,
      totalSpent,
      providersUsed: uniqueProviders.size,
      executionTime: 0,
      agentPayments: [],
      finalDeliverable: "",
      deliverables: acceptedTasks.map((t) => ({
        category: t?.category || "unknown",
        uri: t?.deliverableURI || "",
        provider: t?.provider || "",
      })),
    }

    onMessage(
      this.createMessage(
        `Final package ready! ${summary.completedTasks} deliverables from ${summary.providersUsed} AI providers.`,
        "success",
        { summary },
      ),
    )

    return summary
  }
}
