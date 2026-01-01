"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MarkdownPreview } from "@/components/markdown-preview"
import { ImageGallery } from "@/components/image-gallery"
import { VideoPlayer } from "@/components/video-player"
import { TierBadge } from "@/components/tier-badge"
import type { SwarmSummary, MicroTask, AgentMessage, Payment } from "@/lib/types"
import {
  CheckCircle2,
  FileText,
  Activity,
  Wallet,
  Download,
  Bot,
  Eye,
  ArrowDownLeft,
  Receipt,
  ArrowLeft,
  Share2,
  Clock,
  Coins,
  ImageIcon,
  Film,
  ExternalLink,
} from "lucide-react"
import { glassCardStyle, textGradientGoldStyle } from "@/lib/styles"
import { CHAIN_CONFIG, DEFAULT_CHAIN } from "@/lib/contracts/config"

const agentColors: Record<string, string> = {
  Coordinator: "#FFD700",
  "Project Manager": "#4A9EFF",
  "Tender Poster": "#FF6B00",
  Evaluator: "#A855F7",
  Assembler: "#22C55E",
}

export default function ResultsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("deliverable")
  const [selectedDeliverable, setSelectedDeliverable] = useState<number | null>(null)
  const [data, setData] = useState<{
    summary: SwarmSummary | null
    tasks: MicroTask[]
    messages: AgentMessage[]
    payments: Payment[]
    brief: string
    txHash?: string | null
  } | null>(null)

  useEffect(() => {
    const storedData = sessionStorage.getItem("swarmResults")
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData)
        if (parsed.messages) {
          parsed.messages = parsed.messages.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          }))
        }
        if (parsed.payments) {
          parsed.payments = parsed.payments.map((p: any) => ({
            ...p,
            timestamp: new Date(p.timestamp),
          }))
        }
        if (parsed.summary?.agentPayments) {
          parsed.summary.agentPayments = parsed.summary.agentPayments.map((p: any) => ({
            ...p,
            timestamp: new Date(p.timestamp),
          }))
        }
        setData(parsed)
      } catch (e) {
        console.error("Failed to parse results:", e)
        router.push("/")
      }
    } else {
      router.push("/")
    }
  }, [router])

  if (!data || !data.summary) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    )
  }

  const { summary, tasks, messages, payments, brief, txHash } = data
  const safePayments = payments || []
  const safeTasks = tasks || []
  const safeMessages = messages || []
  const safeAgentPayments = summary?.agentPayments || []
  const safeDeliverables = summary?.deliverables || []
  const safeImages = summary?.generatedImages || []
  const safeVideos = summary?.generatedVideos || []
  const safeCostBreakdown = summary?.costBreakdown || {
    agentFees: 0,
    providerPayments: 0,
    platformFee: 0,
    totalCost: 0,
  }

  const handleExport = () => {
    const exportData = {
      brief,
      summary,
      tasks: safeTasks,
      deliverables: safeDeliverables,
      payments: safePayments,
      paymentTxHash: txHash,
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `tenderswarm-results-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleShare = async () => {
    const shareText = `Just completed a project with TenderSwarm!\n\n${safeTasks.length} tasks completed by AI agents using ${summary.totalSpent.toFixed(2)} MNEE tokens.`
    if (navigator.share) {
      await navigator.share({ title: "TenderSwarm Results", text: shareText })
    } else {
      await navigator.clipboard.writeText(shareText)
      alert("Results copied to clipboard!")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Project Complete</h1>
                <p className="text-sm text-muted-foreground">{safeTasks.length} deliverables created</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {txHash && (
              <a
                href={`${CHAIN_CONFIG[DEFAULT_CHAIN].blockExplorer}/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm hover:bg-green-500/20 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Paid on-chain</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <TierBadge tier={summary.tier} />
            <Button variant="outline" size="sm" onClick={handleShare} className="rounded-xl gap-2 bg-transparent">
              <Share2 className="w-4 h-4" />
              Share
            </Button>
            <Button size="sm" onClick={handleExport} className="rounded-xl gap-2 bg-primary text-primary-foreground">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="border-b border-border/50 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <StatCard
              label="Deliverables"
              value={summary.completedTasks.toString()}
              icon={<FileText className="w-4 h-4" />}
              color="primary"
            />
            <StatCard
              label="Budget"
              value={`${summary.originalBudget.toFixed(2)} MNEE`}
              icon={<Wallet className="w-4 h-4" />}
              color="amber"
            />
            <StatCard
              label="Actual Cost"
              value={`${safeCostBreakdown.totalCost.toFixed(4)} MNEE`}
              icon={<Receipt className="w-4 h-4" />}
              color="blue"
            />
            <StatCard
              label="Refund"
              value={`${summary.refundAmount.toFixed(4)} MNEE`}
              icon={<ArrowDownLeft className="w-4 h-4" />}
              color="green"
            />
            <StatCard
              label="Duration"
              value={`${summary.executionTime}s`}
              icon={<Clock className="w-4 h-4" />}
              color="purple"
            />
            <StatCard
              label="Providers"
              value={summary.providersUsed.toString()}
              icon={<Bot className="w-4 h-4" />}
              color="cyan"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-12 p-1.5 mb-8 rounded-xl inline-flex" style={glassCardStyle}>
            <TabsTrigger
              value="deliverable"
              className="rounded-lg px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <FileText className="w-4 h-4 mr-2" />
              Final Document
            </TabsTrigger>
            <TabsTrigger
              value="tasks"
              className="rounded-lg px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Eye className="w-4 h-4 mr-2" />
              Deliverables ({safeDeliverables.length})
            </TabsTrigger>
            {safeImages.length > 0 && (
              <TabsTrigger
                value="images"
                className="rounded-lg px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Images ({safeImages.length})
              </TabsTrigger>
            )}
            {safeVideos.length > 0 && (
              <TabsTrigger
                value="videos"
                className="rounded-lg px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Film className="w-4 h-4 mr-2" />
                Videos ({safeVideos.length})
              </TabsTrigger>
            )}
            <TabsTrigger
              value="costs"
              className="rounded-lg px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Coins className="w-4 h-4 mr-2" />
              Costs
            </TabsTrigger>
            <TabsTrigger
              value="agents"
              className="rounded-lg px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Bot className="w-4 h-4 mr-2" />
              Agents
            </TabsTrigger>
            <TabsTrigger
              value="activity"
              className="rounded-lg px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Activity className="w-4 h-4 mr-2" />
              Activity
            </TabsTrigger>
            <TabsTrigger
              value="payments"
              className="rounded-lg px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Wallet className="w-4 h-4 mr-2" />
              Payments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="deliverable" className="mt-0">
            <Card className="p-8 rounded-2xl" style={glassCardStyle}>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">Final Assembled Document</h2>
                <p className="text-muted-foreground">AI-generated deliverables compiled into a single document</p>
              </div>
              <div className="prose prose-invert max-w-none">
                <MarkdownPreview content={summary.finalDeliverable || "No content generated."} />
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="tasks" className="mt-0">
            <div className="grid gap-6">
              {safeDeliverables.length === 0 ? (
                <Card className="p-8 rounded-2xl text-center" style={glassCardStyle}>
                  <p className="text-muted-foreground">No deliverables available</p>
                </Card>
              ) : (
                safeDeliverables.map((deliverable, index) => (
                  <Card key={index} className="rounded-2xl overflow-hidden" style={glassCardStyle}>
                    <div
                      className="p-4 border-b border-border/50 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => setSelectedDeliverable(selectedDeliverable === index ? null : index)}
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="capitalize">
                          {deliverable.category}
                        </Badge>
                        <span className="text-sm text-muted-foreground">by {deliverable.provider || "AI Agent"}</span>
                      </div>
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    </div>
                    {selectedDeliverable === index && (
                      <div className="p-6">
                        <MarkdownPreview content={deliverable.content || "No content available."} />
                        {deliverable.image && (
                          <div className="mt-6 p-4 rounded-lg bg-muted/30 border border-border/50">
                            <p className="text-sm text-muted-foreground mb-3">Generated Image:</p>
                            <img
                              src={`data:${deliverable.image.mimeType};base64,${deliverable.image.base64Data}`}
                              alt={deliverable.image.prompt}
                              className="rounded-lg max-w-full h-auto"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {safeImages.length > 0 && (
            <TabsContent value="images" className="mt-0">
              <ImageGallery images={safeImages} />
            </TabsContent>
          )}

          {safeVideos.length > 0 && (
            <TabsContent value="videos" className="mt-0">
              <div className="grid gap-6 md:grid-cols-2">
                {safeVideos.map((video) => (
                  <VideoPlayer key={video.id} video={video} />
                ))}
              </div>
            </TabsContent>
          )}

          <TabsContent value="costs" className="mt-0">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="p-6 rounded-2xl" style={glassCardStyle}>
                <h3 className="text-lg font-semibold text-foreground mb-4">Cost Breakdown</h3>
                <div className="space-y-4">
                  <CostRow label="Original Budget" value={summary.originalBudget} highlight="primary" />
                  <div className="border-t border-border/50 pt-4 space-y-3">
                    <CostRow label="Agent Fees" value={safeCostBreakdown.agentFees} />
                    <CostRow label="Provider Payments" value={safeCostBreakdown.providerPayments} />
                    <CostRow label="Platform Fee" value={safeCostBreakdown.platformFee} />
                  </div>
                  <div className="border-t border-border/50 pt-4 space-y-3">
                    <CostRow label="Total Cost" value={safeCostBreakdown.totalCost} highlight="amber" />
                    <CostRow label="Refund Amount" value={summary.refundAmount} highlight="green" />
                  </div>
                </div>
              </Card>

              <Card className="p-6 rounded-2xl" style={glassCardStyle}>
                <h3 className="text-lg font-semibold text-foreground mb-4">Efficiency Metrics</h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Budget Utilization</span>
                      <span className="text-foreground font-medium">
                        {summary.originalBudget > 0
                          ? ((safeCostBreakdown.totalCost / summary.originalBudget) * 100).toFixed(1)
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{
                          width: `${summary.originalBudget > 0 ? (safeCostBreakdown.totalCost / summary.originalBudget) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-muted/30 rounded-lg text-center">
                      <div className="text-xl font-bold text-primary">
                        {safeTasks.length > 0 ? (safeCostBreakdown.totalCost / safeTasks.length).toFixed(4) : "0.0000"}
                      </div>
                      <div className="text-xs text-muted-foreground">MNEE per Task</div>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg text-center">
                      <div className="text-xl font-bold text-green-400">
                        {summary.originalBudget > 0
                          ? ((summary.refundAmount / summary.originalBudget) * 100).toFixed(1)
                          : 0}
                        %
                      </div>
                      <div className="text-xs text-muted-foreground">Returned</div>
                    </div>
                  </div>

                  {txHash && (
                    <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/15">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-medium text-green-400">On-Chain Payment Verified</span>
                      </div>
                      <a
                        href={`${CHAIN_CONFIG[DEFAULT_CHAIN].blockExplorer}/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 font-mono"
                      >
                        {txHash.slice(0, 20)}...{txHash.slice(-10)}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="agents" className="mt-0">
            <Card className="p-6 rounded-2xl" style={glassCardStyle}>
              <h3 className="text-lg font-semibold text-foreground mb-4">Agent Fee Distribution</h3>
              <div className="space-y-3">
                {safeAgentPayments.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No agent payments recorded</p>
                ) : (
                  safeAgentPayments.map((payment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: agentColors[payment.agent] || "#888",
                            boxShadow: `0 0 8px ${agentColors[payment.agent] || "#888"}60`,
                          }}
                        />
                        <div>
                          <span className="font-medium text-foreground">{payment.agent}</span>
                          <p className="text-xs text-muted-foreground">{payment.reason}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-medium" style={textGradientGoldStyle}>
                          {payment.amount.toFixed(6)} MNEE
                        </div>
                        {payment.tokensUsed && (
                          <div className="text-xs text-muted-foreground">
                            {payment.tokensUsed.toLocaleString()} tokens
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="mt-0">
            <Card className="p-6 rounded-2xl" style={glassCardStyle}>
              <h3 className="text-lg font-semibold text-foreground mb-4">Activity Log</h3>
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {safeMessages.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No activity recorded</p>
                ) : (
                  safeMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/20 transition-colors"
                    >
                      <div
                        className="w-2 h-2 rounded-full mt-2 shrink-0"
                        style={{
                          backgroundColor: agentColors[msg.agent] || "#888",
                          boxShadow: `0 0 6px ${agentColors[msg.agent] || "#888"}60`,
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-medium" style={{ color: agentColors[msg.agent] || "#888" }}>
                            {msg.agent}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{msg.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="mt-0">
            <Card className="p-6 rounded-2xl" style={glassCardStyle}>
              <h3 className="text-lg font-semibold text-foreground mb-4">Provider Payments</h3>
              <div className="space-y-2">
                {safePayments.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No payments recorded</p>
                ) : (
                  safePayments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                          <Wallet className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <span className="font-medium text-foreground">
                            {payment.providerName || `Provider ${(payment.taskId || "N/A").slice(0, 8)}`}
                          </span>
                          <p className="text-xs text-muted-foreground">
                            Task: {(payment.taskId || "N/A").slice(0, 12)}...
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-medium" style={textGradientGoldStyle}>
                          {payment.amount.toFixed(4)} MNEE
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(payment.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string
  value: string
  icon: React.ReactNode
  color: string
}) {
  const colorMap: Record<string, string> = {
    primary: "text-primary",
    amber: "text-amber-400",
    blue: "text-blue-400",
    green: "text-green-400",
    purple: "text-purple-400",
    cyan: "text-cyan-400",
  }

  return (
    <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
      <div className="flex items-center gap-2 mb-1">
        <span className={colorMap[color] || "text-primary"}>{icon}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className={`text-lg font-bold ${colorMap[color] || "text-primary"}`}>{value}</div>
    </div>
  )
}

function CostRow({
  label,
  value,
  highlight,
}: {
  label: string
  value: number
  highlight?: "primary" | "amber" | "green"
}) {
  const colorClass =
    highlight === "green"
      ? "text-green-400"
      : highlight === "amber"
        ? "text-amber-400"
        : highlight === "primary"
          ? "text-primary"
          : "text-foreground"

  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-mono font-medium ${colorClass}`}>{value.toFixed(4)} MNEE</span>
    </div>
  )
}
