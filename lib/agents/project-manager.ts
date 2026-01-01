// Project Manager Agent - Breaks down briefs into micro-tasks
import { z } from "zod"
import { BaseAgent } from "./agent-base"
import type { ClientBrief, MicroTask, AgentMessage } from "@/lib/types"
import { calculateTaskReward } from "./smart-pricing"
import { inferCapabilitiesFromTask } from "./ai-providers"

const taskSchema = z.object({
  tasks: z
    .array(
      z.object({
        description: z.string().describe("A specific, actionable task description"),
        reward: z.number().min(0.1).max(2).describe("MNEE reward for this task (0.1-2)"),
        category: z.enum([
          "research",
          "design",
          "copywriting",
          "financial-modeling",
          "strategy",
          "development",
          "marketing",
        ]),
        estimatedTime: z.number().describe("Estimated time in seconds (60-600)"),
      }),
    )
    .min(3)
    .max(10),
})

export class ProjectManagerAgent extends BaseAgent {
  constructor() {
    super(
      "Project Manager",
      `You are the Project Manager agent in TenderSwarm.
Your role is to break down client briefs into atomic micro-tasks.

CRITICAL BUDGET RULES:
- The total of ALL task rewards MUST NOT exceed the provided budget
- Divide the budget evenly across tasks
- For a 5 MNEE budget with 5 tasks, each task should be ~1 MNEE
- For a 10 MNEE budget with 10 tasks, each task should be ~1 MNEE
- NEVER create tasks with rewards that sum to more than the budget

Each task MUST:
- Be highly specific and independently executable
- Have a clear, measurable deliverable
- Include an appropriate MNEE reward (budget divided by number of tasks)
- Fit into one of these categories: research, design, copywriting, strategy, and marketing

Balance the budget EXACTLY across all tasks.`,
    )
  }

  async execute(brief: ClientBrief, onMessage: (msg: AgentMessage) => void, maxTasks?: number): Promise<MicroTask[]> {
    onMessage(this.createMessage(`Analyzing brief: "${brief.text.slice(0, 80)}..."`, "thinking"))

    const taskCount = Math.min(Math.max(Math.floor(brief.budget), 3), maxTasks || 10)

    let result: { tasks: Array<{ description: string; reward: number; category: string; estimatedTime: number }> }

    try {
      console.log("[v0] ProjectManager: Calling thinkStructured...")
      result = await this.thinkStructured(
        `Break down this client brief into exactly ${taskCount} micro-tasks:

"${brief.text}"

BUDGET: ${brief.budget} MNEE total
NUMBER OF TASKS: ${taskCount}

Create diverse tasks across research, design, copywriting, strategy, and marketing.
Make each task specific enough that a freelancer could complete it independently.
Assign rewards based on task complexity (0.1 to 2 MNEE each).`,
        taskSchema,
        "TaskBreakdown",
      )
      console.log("[v0] ProjectManager: Got result:", JSON.stringify(result))
    } catch (error) {
      console.log("[v0] ProjectManager: Error from thinkStructured:", error)
      const rewardPerTask = Number((brief.budget / taskCount).toFixed(2))
      result = this.generateFallbackTasks(brief, taskCount, rewardPerTask)
    }

    if (!result || !result.tasks || !Array.isArray(result.tasks) || result.tasks.length === 0) {
      console.log("[v0] ProjectManager: Invalid result, using fallback tasks")
      const rewardPerTask = Number((brief.budget / taskCount).toFixed(2))
      result = this.generateFallbackTasks(brief, taskCount, rewardPerTask)
    }

    const safeTasks = result.tasks || []

    const tasks: MicroTask[] = safeTasks.map((task, index) => {
      const dynamicReward = calculateTaskReward(
        task?.description || "",
        task?.category || "research",
        brief.budget,
        safeTasks.length,
      )

      const requiredCapabilities = inferCapabilitiesFromTask(task?.category || "research", task?.description || "")

      return {
        id: `task-${Date.now()}-${index}`,
        description: task?.description || `Task ${index + 1}`,
        reward: dynamicReward,
        category: (task?.category as MicroTask["category"]) || "research",
        estimatedTime: task?.estimatedTime || 120,
        status: "pending",
        requiredCapabilities,
      }
    })

    const availableBudget = brief.budget * 0.8
    const totalAssigned = tasks.reduce((sum, t) => sum + t.reward, 0)
    if (totalAssigned > availableBudget && totalAssigned > 0) {
      const scale = availableBudget / totalAssigned
      tasks.forEach((t) => {
        t.reward = Number((t.reward * scale).toFixed(4))
      })
    }

    const totalReward = tasks.reduce((sum, t) => sum + t.reward, 0)
    onMessage(
      this.createMessage(
        `Created ${tasks.length} tasks totaling ${totalReward.toFixed(2)} MNEE. Categories: ${[...new Set(tasks.map((t) => t.category))].join(", ")}`,
        "success",
        { taskCount: tasks.length, categories: [...new Set(tasks.map((t) => t.category))] },
      ),
    )

    return tasks
  }

  private generateFallbackTasks(
    brief: ClientBrief,
    taskCount: number,
    rewardPerTask: number,
  ): { tasks: Array<{ description: string; reward: number; category: string; estimatedTime: number }> } {
    const categories = [
      "research",
      "design",
      "copywriting",
      "strategy",
      "marketing",
      "development",
      "financial-modeling",
    ]
    const briefKeywords = brief.text.toLowerCase()

    const taskTemplates = [
      {
        description: `Conduct market research and competitive analysis for: ${brief.text.slice(0, 50)}`,
        category: "research",
        time: 180,
      },
      { description: `Create visual design concepts and mockups`, category: "design", time: 240 },
      { description: `Write compelling copy and messaging framework`, category: "copywriting", time: 150 },
      { description: `Develop strategic roadmap and milestones`, category: "strategy", time: 200 },
      { description: `Plan marketing channels and campaign strategy`, category: "marketing", time: 160 },
      { description: `Outline technical architecture and requirements`, category: "development", time: 220 },
      { description: `Build financial projections and pricing model`, category: "financial-modeling", time: 180 },
      { description: `Analyze target audience and user personas`, category: "research", time: 140 },
      { description: `Create brand guidelines and identity system`, category: "design", time: 200 },
      { description: `Draft executive summary and pitch deck outline`, category: "copywriting", time: 160 },
    ]

    const tasks = taskTemplates.slice(0, taskCount).map((template, index) => ({
      description: template.description,
      reward: rewardPerTask,
      category: template.category,
      estimatedTime: template.time,
    }))

    return { tasks }
  }
}
