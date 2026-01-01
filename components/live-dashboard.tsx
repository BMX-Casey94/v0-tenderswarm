"use client"

import { useState, useRef, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSwarm } from "@/lib/hooks/use-swarm"
import type { SwarmStatus, AgentMessage, MicroTask } from "@/lib/types"
import { PaymentFeed } from "./payment-feed"
import { AgentNetwork } from "./agent-network"
import { ProjectCompleteRedirect } from "./project-complete-redirect"
import { TierBadge, TierSelector } from "./tier-badge"
import { useWallet } from "./wallet-connect"
import { WalletModal } from "./wallet-modal"
import { escrowClient } from "@/lib/contracts/escrow-client"
import { CHAIN_CONFIG, DEFAULT_CHAIN } from "@/lib/contracts/config"
import { SwarmProgress } from "./swarm-progress"
import {
  ArrowRightIcon,
  Sparkles,
  Activity,
  Wallet,
  Loader2,
  Play,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  ImageIcon,
  AlertCircle,
  ExternalLink,
  Crown,
} from "lucide-react"
import { glassCardStyle, textGradientGoldStyle } from "@/lib/styles"

const agentColors: Record<string, string> = {
  Coordinator: "#FFD700",
  "Project Manager": "#4A9EFF",
  "Tender Poster": "#FF6B00",
  Evaluator: "#A855F7",
  Assembler: "#22C55E",
}

const PLATFORM_TREASURY = process.env.NEXT_PUBLIC_PLATFORM_TREASURY || "0xd4a27D669c8F27BF293b4D15269E0398CDb27aE1"

export function LiveDashboard() {
  const [brief, setBrief] = useState("")
  const [budget, setBudget] = useState("0.75")
  const [activeTab, setActiveTab] = useState("brief")
  const [showRedirect, setShowRedirect] = useState(false)
  const [txStatus, setTxStatus] = useState<"idle" | "checking" | "approving" | "transferring" | "confirmed" | "error">(
    "idle",
  )
  const [txHash, setTxHash] = useState<string | null>(null)
  const [txError, setTxError] = useState<string | null>(null)
  const [showWalletModal, setShowWalletModal] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { address, mneeBalance, isConnected, isDemoMode, enableDemoMode, refreshBalance } = useWallet()
  const { status, messages, tasks, payments, summary, isRunning, error, startSwarm, reset } = useSwarm()

  const currentTier =
    Number(budget) >= 2.0
      ? "enterprise"
      : Number(budget) >= 1.0
        ? "premium"
        : Number(budget) >= 0.75
          ? "standard"
          : "basic"
  const includesImages = currentTier === "premium" || currentTier === "enterprise"
  const includesVideo = currentTier === "enterprise"

  const budgetNum = Number.parseFloat(budget) || 0
  const balanceNum = Number.parseFloat(mneeBalance || "0")
  const hasSufficientBalance = balanceNum >= budgetNum

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (summary && !showRedirect) {
      setShowRedirect(true)
    }
  }, [summary, showRedirect])

  const handleWalletConnect = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${CHAIN_CONFIG[DEFAULT_CHAIN].id.toString(16)}` }],
        })
      } catch (switchError: any) {
        console.log("Network switch failed:", switchError)
      }

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      })

      if (accounts && accounts.length > 0) {
        setShowWalletModal(false)
      }
    }
  }

  const handleDemoModeFromModal = () => {
    enableDemoMode()
    setShowWalletModal(false)
  }

  const handleDemoMode = async () => {
    enableDemoMode()
    setShowWalletModal(false)
    setActiveTab("swarm")
    await startSwarm(
      brief,
      Number.parseFloat(budget),
      "demo-tx-" + Date.now().toString(16),
      "demo-tx-" + Date.now().toString(16),
      true, // isDemoMode
      "0x0000000000000000000000000000000000000000", // Replace with actual demo address
    )
  }

  const handleStartSwarm = async () => {
    if (!brief || !budget) return

    if (!isConnected || !address) {
      setShowWalletModal(true)
      return
    }

    if (isDemoMode) {
      setActiveTab("swarm")
      await startSwarm(
        brief,
        Number.parseFloat(budget),
        undefined,
        "demo-tx-" + Date.now().toString(16),
        true, // isDemoMode
        address, // userAddress
      )
      return
    }

    setTxStatus("checking")
    setTxError(null)
    setTxHash(null)

    try {
      console.log("[v0] Starting MNEE transfer...")
      console.log("[v0] From:", address)
      console.log("[v0] To:", PLATFORM_TREASURY)
      console.log("[v0] Amount:", budgetNum, "MNEE")

      const { hasBalance, balance } = await escrowClient.verifyBalance(address, budgetNum)
      console.log("[v0] Balance check:", { hasBalance, balance, required: budgetNum })

      if (!hasBalance) {
        setTxError(
          `Insufficient MNEE balance. You have ${Number.parseFloat(balance).toFixed(4)} MNEE but need ${budgetNum} MNEE.`,
        )
        setTxStatus("error")
        return
      }

      setTxStatus("transferring")
      console.log("[v0] Initiating transfer...")
      const transferResult = await escrowClient.transferMNEE(address as `0x${string}`, PLATFORM_TREASURY, budgetNum)
      console.log("[v0] Transfer result:", transferResult)

      if (!transferResult.success) {
        setTxError("MNEE transfer failed. Please try again.")
        setTxStatus("error")
        return
      }

      setTxHash(transferResult.hash)
      setTxStatus("confirmed")

      console.log("[v0] Transfer confirmed, refreshing balance...")
      await refreshBalance()

      setActiveTab("swarm")
      await startSwarm(
        brief,
        Number.parseFloat(budget),
        process.env.NEXT_PUBLIC_TENDER_ESCROW_ADDRESS,
        transferResult.hash,
        false, // isDemoMode (false for live payments)
        address, // userAddress
      )

      await refreshBalance()
    } catch (err: any) {
      console.error("[v0] Transaction failed:", err)

      const errorMessage = err?.message || err?.toString() || "Unknown error"

      if (errorMessage.includes("already pending") || errorMessage.includes("Please wait")) {
        setTxError(
          "MetaMask has a pending transaction. Please open MetaMask, complete or reject the pending request, then try again.",
        )
      } else if (errorMessage.includes("User rejected") || errorMessage.includes("user rejected")) {
        setTxError("Transaction was rejected. Please try again when ready.")
      } else if (errorMessage.includes("insufficient funds")) {
        setTxError("Insufficient funds for gas fees. Please add ETH for transaction fees.")
      } else {
        setTxError(`Transaction failed: ${errorMessage.slice(0, 100)}`)
      }

      setTxStatus("error")
    }
  }

  const handleReset = () => {
    reset()
    setBrief("")
    setBudget("0.75")
    setActiveTab("brief")
    setShowRedirect(false)
    setTxStatus("idle")
    setTxHash(null)
    setTxError(null)
  }

  const renderWalletNotice = () => {
    if (!isConnected && !isDemoMode) {
      return (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 mb-6">
          <div className="flex items-start gap-3">
            <Wallet className="w-5 h-5 text-amber-400 mt-0.5" />
            <div>
              <p className="text-sm text-amber-300 font-medium">Wallet Not Connected</p>
              <p className="text-xs text-amber-400/70 mt-1">
                Connect your wallet to pay with real MNEE tokens on Ethereum.
              </p>
            </div>
          </div>
        </div>
      )
    }

    if (isDemoMode) {
      return (
        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
            <div>
              <p className="text-sm text-blue-300 font-medium">Demo Mode Active</p>
              <p className="text-xs text-blue-400/70 mt-1">
                Using cost-limited AI models with reduced output. Results will be shorter and images/videos are
                disabled. Connect a wallet for full-quality deliverables with premium AI models.
              </p>
            </div>
          </div>
        </div>
      )
    }

    if (!hasSufficientBalance && budgetNum > 0 && !isDemoMode) {
      return (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
            <div>
              <p className="text-sm text-red-300 font-medium">Insufficient MNEE Balance</p>
              <p className="text-xs text-red-400/70 mt-1">
                You have {balanceNum.toFixed(4)} MNEE but need {budgetNum.toFixed(2)} MNEE.
                <a
                  href="https://swap-user.mnee.net/swap"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline ml-1"
                >
                  Get MNEE →
                </a>
              </p>
            </div>
          </div>
        </div>
      )
    }

    if (isConnected && hasSufficientBalance) {
      return (
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 mb-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5" />
            <div>
              <p className="text-sm text-green-300 font-medium">Ready to Pay with MNEE</p>
              <p className="text-xs text-green-400/70 mt-1">
                {budgetNum.toFixed(2)} MNEE will be transferred when you launch the swarm. Unused funds will be
                refunded.
              </p>
            </div>
          </div>
        </div>
      )
    }

    return null
  }

  const renderTxStatus = () => {
    if (txStatus === "idle") return null

    const statusConfig = {
      checking: { icon: <Loader2 className="w-4 h-4 animate-spin" />, text: "Checking balance...", color: "blue" },
      approving: { icon: <Loader2 className="w-4 h-4 animate-spin" />, text: "Approving MNEE...", color: "blue" },
      transferring: {
        icon: <Loader2 className="w-4 h-4 animate-spin" />,
        text: "Transferring MNEE...",
        color: "amber",
      },
      confirmed: { icon: <CheckCircle2 className="w-4 h-4" />, text: "Payment confirmed!", color: "green" },
      error: { icon: <XCircle className="w-4 h-4" />, text: txError || "Transaction failed", color: "red" },
    }

    const config = statusConfig[txStatus]
    if (!config) return null

    return (
      <div
        className={`p-4 rounded-xl mb-6`}
        style={{
          backgroundColor: `rgba(${config.color === "blue" ? "59,130,246" : config.color === "amber" ? "245,158,11" : config.color === "green" ? "34,197,94" : "239,68,68"}, 0.1)`,
          borderWidth: 1,
          borderStyle: "solid",
          borderColor: `rgba(${config.color === "blue" ? "59,130,246" : config.color === "amber" ? "245,158,11" : config.color === "green" ? "34,197,94" : "239,68,68"}, 0.3)`,
        }}
      >
        <div className="flex items-center gap-3">
          <span
            style={{
              color:
                config.color === "blue"
                  ? "#60a5fa"
                  : config.color === "amber"
                    ? "#fbbf24"
                    : config.color === "green"
                      ? "#4ade80"
                      : "#f87171",
            }}
          >
            {config.icon}
          </span>
          <span
            className="text-sm"
            style={{
              color:
                config.color === "blue"
                  ? "#93c5fd"
                  : config.color === "amber"
                    ? "#fcd34d"
                    : config.color === "green"
                      ? "#86efac"
                      : "#fca5a5",
            }}
          >
            {config.text}
          </span>
          {txHash && (
            <a
              href={`${CHAIN_CONFIG[DEFAULT_CHAIN].blockExplorer}/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-xs text-primary hover:underline flex items-center gap-1"
            >
              View TX <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    )
  }

  return (
    <section id="demo" className="relative py-32 px-6">
      {showRedirect && summary && (
        <ProjectCompleteRedirect
          summary={summary}
          tasks={tasks}
          messages={messages}
          payments={payments}
          brief={brief}
          txHash={txHash}
        />
      )}

      <WalletModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onConnect={handleWalletConnect}
        onDemoMode={handleDemoModeFromModal}
      />

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" style={glassCardStyle}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-sm font-medium text-foreground">Live Demo</span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span style={textGradientGoldStyle}>Experience</span>{" "}
            <span
              style={{
                background: "linear-gradient(180deg, #ffffff 0%, #a0a0a0 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              the Swarm
            </span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Submit a brief and watch AI agents coordinate in real-time
          </p>
        </div>

        {error && (
          <div className="max-w-3xl mx-auto mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              <span className="font-medium">Error:</span> {error}
            </div>
            <Button variant="outline" size="sm" onClick={handleReset} className="mt-3 bg-transparent">
              Try Again
            </Button>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList
            className="h-14 p-1.5 w-full max-w-md mx-auto grid grid-cols-3 mb-10 rounded-2xl"
            style={glassCardStyle}
          >
            <TabsTrigger
              value="brief"
              className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Brief
            </TabsTrigger>
            <TabsTrigger
              value="swarm"
              className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Users className="w-4 h-4 mr-2" />
              Swarm
              {tasks.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                  {tasks.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="payments"
              className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Wallet className="w-4 h-4 mr-2" />
              Payments
              {payments.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                  {payments.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="brief" className="mt-0">
            <Card className="p-8 md:p-10 max-w-3xl mx-auto rounded-3xl" style={glassCardStyle}>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <ArrowRightIcon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-foreground">Submit Your Brief</h3>
                    <p className="text-muted-foreground">Describe what you want the agent swarm to build</p>
                  </div>
                </div>
                <TierBadge tier={currentTier as any} />
              </div>

              {renderWalletNotice()}
              {renderTxStatus()}

              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-foreground mb-3 block">Project Description</label>
                  <Textarea
                    placeholder="Example: Create a comprehensive pitch deck and go-to-market strategy for a new African remittances app built on MNEE programmable money infrastructure..."
                    value={brief}
                    onChange={(e) => setBrief(e.target.value)}
                    rows={6}
                    className="resize-none bg-muted/30 border border-border/50 rounded-xl text-foreground focus:border-primary/50 focus:ring-primary/20 custom-scrollbar"
                    disabled={isRunning || txStatus === "transferring" || txStatus === "approving"}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-3 block">Budget (MNEE)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={budget}
                      onChange={(e) => {
                        const val = Math.min(3.0, Math.max(0.25, Number(e.target.value)))
                        setBudget(val.toString())
                      }}
                      className="w-full px-4 py-3 pr-16 bg-muted/30 border border-border/50 rounded-xl text-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      min="0.25"
                      max="3.0"
                      step="0.05"
                      disabled={isRunning || txStatus === "transferring" || txStatus === "approving"}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium pointer-events-none">
                      MNEE
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Min: 0.25 MNEE | Max: 3.0 MNEE</p>
                  <div className="mt-4">
                    <TierSelector budget={Number(budget)} onChange={(b) => setBudget(Math.min(3.0, b).toString())} />
                  </div>
                  <div className="space-y-2 mt-6">
                    {Number(budget) >= 1.0 && (
                      <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-start gap-2">
                        <ImageIcon className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <span className="font-medium text-primary">
                            Premium tier includes up to 3 AI-generated images
                          </span>
                        </div>
                      </div>
                    )}
                    {Number(budget) >= 2.0 && (
                      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex items-start gap-2">
                        <Crown className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <span className="font-medium text-yellow-500">
                            Enterprise tier includes up to 6 AI-generated images
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Launch Button */}
                <div className="flex flex-col items-center justify-center py-4">
                  {!isConnected ? (
                    <Button
                      onClick={() => setShowWalletModal(true)}
                      className="w-full max-w-md py-6 text-lg rounded-xl transition-all duration-300"
                      style={{
                        background: "linear-gradient(135deg, #FFD700 0%, #FF6B00 100%)",
                        color: "#000",
                      }}
                    >
                      <Wallet className="w-5 h-5 mr-2" />
                      Connect Wallet to Launch Swarm
                    </Button>
                  ) : !hasSufficientBalance && !isDemoMode ? (
                    <div className="w-full max-w-md">
                      <Button disabled className="w-full py-6 text-lg rounded-xl opacity-50 cursor-not-allowed">
                        Insufficient MNEE Balance
                      </Button>
                      <p className="text-center text-sm text-red-400 mt-2">
                        You need {budget} MNEE but only have {Number.parseFloat(mneeBalance || "0").toFixed(4)} MNEE
                      </p>
                    </div>
                  ) : (
                    <Button
                      onClick={handleStartSwarm}
                      disabled={!brief || isRunning || txStatus !== "idle"}
                      className="w-full max-w-md py-6 text-lg rounded-xl transition-all duration-300 disabled:opacity-50"
                      style={{
                        background:
                          brief && !isRunning && txStatus === "idle"
                            ? "linear-gradient(135deg, #FFD700 0%, #FF6B00 100%)"
                            : undefined,
                        color: brief && !isRunning && txStatus === "idle" ? "#000" : undefined,
                      }}
                    >
                      {txStatus === "checking" ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Checking Balance...
                        </>
                      ) : txStatus === "approving" ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Approving MNEE...
                        </>
                      ) : txStatus === "transferring" ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Transferring MNEE...
                        </>
                      ) : isRunning ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Swarm Running...
                        </>
                      ) : (
                        <>
                          <Play className="w-5 h-5 mr-2" />
                          {isDemoMode ? "Launch Swarm (Demo)" : "Launch Swarm"}
                        </>
                      )}
                    </Button>
                  )}

                  {/* Demo mode indicator */}
                  {isDemoMode && isConnected && (
                    <p className="text-center text-sm text-amber-400 mt-2">
                      Demo mode active - no real MNEE will be transferred
                    </p>
                  )}

                  {txError && (
                    <div className="w-full max-w-md mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                      <div className="flex items-center gap-2 text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{txError}</span>
                      </div>
                    </div>
                  )}

                  {txHash && !isDemoMode && (
                    <div className="w-full max-w-md mt-4 p-3 rounded-xl bg-green-500/10 border border-green-500/30">
                      <div className="flex items-center justify-between">
                        <span className="text-green-400 text-sm">Transaction confirmed!</span>
                        <a
                          href={`${CHAIN_CONFIG[DEFAULT_CHAIN].blockExplorer}/tx/${txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1 text-sm"
                        >
                          View <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="swarm" className="mt-0">
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <Card className="p-6 rounded-2xl" style={glassCardStyle}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                      <Activity className="w-5 h-5 text-primary" />
                      Swarm Status
                    </h3>
                    <Badge
                      variant="outline"
                      className={`${status === "running" ? "border-green-500/50 text-green-400" : status === "complete" ? "border-primary/50 text-primary" : "border-border/50 text-muted-foreground"}`}
                    >
                      {status === "running" ? "Active" : status === "complete" ? "Complete" : "Idle"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mb-6">
                    {["Coordinator", "Project Manager", "Evaluator", "Assembler"].map((agent) => (
                      <div key={agent} className="text-center">
                        <div
                          className="w-10 h-10 mx-auto rounded-xl flex items-center justify-center text-sm font-bold mb-2"
                          style={{
                            backgroundColor: `${agentColors[agent]}20`,
                            borderWidth: 1,
                            borderStyle: "solid",
                            borderColor: `${agentColors[agent]}40`,
                            color: agentColors[agent],
                          }}
                        >
                          {agent.charAt(0)}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{agent.split(" ")[0]}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 rounded-xl bg-muted/30">
                      <p className="text-2xl font-bold text-foreground">{tasks.length}</p>
                      <p className="text-xs text-muted-foreground">Tasks</p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/30">
                      <p className="text-2xl font-bold text-foreground">{payments.length}</p>
                      <p className="text-xs text-muted-foreground">Payments</p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/30">
                      <p className="text-2xl font-bold text-primary">
                        {payments.reduce((sum, p) => sum + (p.amount || 0), 0).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">MNEE Spent</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 rounded-2xl" style={glassCardStyle}>
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: status === "running" ? "#22c55e" : "#6b7280" }}
                    />
                    Agent Activity
                  </h3>
                  <div className="h-48 overflow-y-auto custom-scrollbar space-y-1 pr-2">
                    {messages.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">Waiting for swarm to start...</p>
                    ) : (
                      messages.map((msg, i) => (
                        <div key={i} className="flex items-start gap-2 py-1.5 text-sm group">
                          <span
                            className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                            style={{ backgroundColor: agentColors[msg.agent] || "#6b7280" }}
                          />
                          <span className="text-primary/80 font-medium text-xs flex-shrink-0">{msg.agent}:</span>
                          <span className="text-muted-foreground truncate flex-1">{msg.message}</span>
                          <span className="text-xs text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </Card>

                <AgentNetwork messages={messages} status={status} compact />
              </div>

              <div>
                <Card className="p-6 rounded-2xl" style={glassCardStyle}>
                  <h3 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    Tasks
                    {tasks.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {tasks.filter((t) => t.status === "accepted").length}/{tasks.length} Complete
                      </Badge>
                    )}
                  </h3>
                  {status.phase !== "idle" && (
                    <div className="mb-6">
                      <SwarmProgress
                        phase={status.phase}
                        progress={status.progress}
                        completedTasks={status.completedTasks}
                        totalTasks={status.totalTasks}
                      />
                    </div>
                  )}
                  <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                    {tasks.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">Tasks will appear here...</p>
                    ) : (
                      tasks.map((task, i) => (
                        <div key={task.id || i} className="p-4 rounded-xl bg-muted/30 border border-border/50">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge
                                  variant="outline"
                                  className="text-xs capitalize"
                                  style={{
                                    borderColor:
                                      task.status === "accepted"
                                        ? "#22c55e40"
                                        : task.status === "pending"
                                          ? "#f59e0b40"
                                          : "#6b728040",
                                    color:
                                      task.status === "accepted"
                                        ? "#22c55e"
                                        : task.status === "pending"
                                          ? "#f59e0b"
                                          : "#6b7280",
                                  }}
                                >
                                  {task.status === "accepted" ? (
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                  ) : task.status === "pending" ? (
                                    <Clock className="w-3 h-3 mr-1" />
                                  ) : (
                                    <XCircle className="w-3 h-3 mr-1" />
                                  )}
                                  {task.status}
                                </Badge>
                                <span className="text-xs text-muted-foreground">{task.category}</span>
                              </div>
                              <p className="text-sm text-foreground truncate">{task.description}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-sm font-medium text-primary">{task.reward?.toFixed(3)} MNEE</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="payments" className="mt-0">
            <PaymentFeed payments={payments} />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  )
}

function StatusBadge({ phase }: { phase: SwarmStatus["phase"] }) {
  const statusConfig: Record<string, { label: string; className: string }> = {
    idle: { label: "Ready", className: "bg-muted text-muted-foreground border-border" },
    initializing: { label: "Initializing", className: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
    analyzing: { label: "Analyzing", className: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
    posting: { label: "Posting Tenders", className: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
    "awaiting-submissions": { label: "Awaiting Bids", className: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30" },
    evaluating: { label: "Evaluating", className: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
    assembling: { label: "Assembling", className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
    complete: { label: "Complete", className: "bg-green-500/15 text-green-400 border-green-500/30" },
    error: { label: "Error", className: "bg-red-500/15 text-red-400 border-red-500/30" },
  }

  const config = statusConfig[phase] || statusConfig.idle

  return (
    <Badge className={`${config.className} border px-3 py-1`}>
      {phase !== "idle" && phase !== "complete" && phase !== "error" && (
        <span className="w-2 h-2 rounded-full bg-current animate-pulse mr-2" />
      )}
      {config.label}
    </Badge>
  )
}

function TaskItem({ task }: { task: MicroTask }) {
  const statusConfig = {
    pending: { icon: <Clock className="w-3 h-3" />, color: "text-muted-foreground", bg: "bg-muted/20" },
    posted: { icon: <Activity className="w-3 h-3 animate-pulse" />, color: "text-orange-400", bg: "bg-orange-500/10" },
    submitted: { icon: <Activity className="w-3 h-3" />, color: "text-cyan-400", bg: "bg-cyan-500/10" },
    accepted: { icon: <CheckCircle2 className="w-3 h-3" />, color: "text-green-500", bg: "bg-green-500/10" },
    rejected: { icon: <XCircle className="w-3 h-3" />, color: "text-red-400", bg: "bg-red-500/10" },
  }

  const config = statusConfig[task.status]

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg ${config.bg} transition-colors`}>
      <div className={`mt-0.5 ${config.color}`}>{config.icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground leading-tight">{task.description}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-xs text-muted-foreground capitalize">{task.category}</span>
        </div>
      </div>
      <Badge variant="outline" className="text-xs shrink-0 font-mono" style={textGradientGoldStyle}>
        {task.reward.toFixed(2)}
      </Badge>
    </div>
  )
}

function CompactAgentMessage({ message }: { message: AgentMessage }) {
  const agentColor = agentColors[message.agent] || "#888888"

  return (
    <div className="flex items-start gap-2 py-1.5 group hover:bg-muted/20 rounded px-2 -mx-2 transition-colors">
      <div
        className="w-2 h-2 rounded-full mt-1.5 shrink-0"
        style={{ backgroundColor: agentColor, boxShadow: `0 0 6px ${agentColor}60` }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-medium" style={{ color: agentColor }}>
            {message.agent}
          </span>
          <span className="text-[10px] text-muted-foreground font-mono opacity-0 group-hover:opacity-100 transition-opacity">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{message.message}</p>
      </div>
    </div>
  )
}

const tiers = [
  { tier: "basic", includesImages: false, maxImages: 0 },
  { tier: "standard", includesImages: false, maxImages: 0 },
  { tier: "premium", includesImages: true, maxImages: 3 },
  { tier: "enterprise", includesImages: true, maxImages: 6 },
]

const Image = () => <div>Image Icon</div>
