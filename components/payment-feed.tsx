"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Coins, TrendingUp, Zap } from "lucide-react"
import type { Payment } from "@/lib/types"
import { escrowClient } from "@/lib/contracts/escrow-client"
import { glassCardStyle, textGradientGoldStyle } from "@/lib/styles"
import { formatMNEE } from "@/lib/contracts/config"

interface PaymentFeedProps {
  swarmPayments?: Payment[]
}

export function PaymentFeed({ swarmPayments = [] }: PaymentFeedProps) {
  const [chainPayments, setChainPayments] = useState<Payment[]>([])
  const [isLive, setIsLive] = useState(false)

  const allPayments = [...swarmPayments, ...chainPayments]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 50)

  const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0)

  // Try to watch blockchain events
  useEffect(() => {
    try {
      const unwatch = escrowClient.watchTenderAccepted((log: any) => {
        const payment: Payment = {
          id: `chain-${Date.now()}`,
          tenderId: Number(log.args.id),
          amount: Number(log.args.reward) / 1e18, // 18 decimals
          recipient: log.args.winner,
          txHash: log.transactionHash || "",
          timestamp: new Date(),
        }

        playPaymentSound()
        setIsLive(true)
        setChainPayments((prev) => [payment, ...prev].slice(0, 20))
      })

      return () => unwatch()
    } catch (error) {
      // Silent fail
    }
  }, [])

  useEffect(() => {
    if (swarmPayments.length > 0) {
      playPaymentSound()
    }
  }, [swarmPayments.length])

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <Card className="p-6 rounded-2xl lg:col-span-1" style={glassCardStyle}>
        <h3 className="text-lg font-semibold text-foreground mb-6">Payment Stats</h3>

        <div className="space-y-6">
          <div className="p-4 bg-primary/10 rounded-xl border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Total Distributed</span>
            </div>
            <div className="text-3xl font-bold" style={textGradientGoldStyle}>
              {formatMNEE(totalPaid, 4)} MNEE
            </div>
          </div>

          <div className="p-4 bg-muted/30 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <span className="text-sm text-muted-foreground">Transactions</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{allPayments.length}</div>
          </div>

          <div className="p-4 bg-muted/30 rounded-xl">
            <div className="text-sm text-muted-foreground mb-2">Avg. Payment</div>
            <div className="text-2xl font-bold text-foreground">
              {allPayments.length > 0 ? formatMNEE(totalPaid / allPayments.length, 4) : "0.0000"} MNEE
            </div>
          </div>

          {swarmPayments.length > 0 && (
            <div className="p-4 bg-orange-500/10 rounded-xl border border-orange-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-orange-400" />
                <span className="text-sm text-muted-foreground">From Current Swarm</span>
              </div>
              <div className="text-2xl font-bold text-orange-400">{swarmPayments.length}</div>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6 rounded-2xl lg:col-span-2" style={glassCardStyle}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-1">Live Payment Feed</h3>
            <p className="text-sm text-muted-foreground">Real-time MNEE transactions (18 decimals)</p>
          </div>
          <Badge
            className={`${
              isLive
                ? "bg-green-500/15 text-green-400 border-green-500/30"
                : swarmPayments.length > 0
                  ? "bg-orange-500/15 text-orange-400 border-orange-500/30"
                  : "bg-muted text-muted-foreground border-border"
            } border px-3 py-1`}
          >
            <span className="w-2 h-2 rounded-full bg-current animate-pulse mr-2" />
            {isLive ? "Live" : swarmPayments.length > 0 ? "Swarm Active" : "Waiting"}
          </Badge>
        </div>

        <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
          {allPayments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Coins className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg mb-1">No Payments Yet</p>
              <p className="text-sm">Start a swarm to see payments flow</p>
            </div>
          ) : (
            allPayments.map((payment, index) => <PaymentItem key={payment.id} payment={payment} isNew={index === 0} />)
          )}
        </div>
      </Card>
    </div>
  )
}

function PaymentItem({ payment, isNew }: { payment: Payment; isNew?: boolean }) {
  const [showParticles, setShowParticles] = useState(isNew)

  useEffect(() => {
    if (isNew) {
      const timer = setTimeout(() => setShowParticles(false), 1500)
      return () => clearTimeout(timer)
    }
  }, [isNew])

  const isRefund = payment.paymentType === "refund"

  return (
    <div
      className={`relative p-4 rounded-xl ${
        isRefund ? "bg-green-500/10 border border-green-500/30" : "bg-muted/20 border border-border/50"
      } transition-all duration-500 hover:bg-muted/30 hover:border-primary/20 ${isNew ? "animate-in slide-in-from-top-5" : ""}`}
      style={
        isNew
          ? { boxShadow: isRefund ? "0 0 30px rgba(34, 197, 94, 0.15)" : "0 0 30px rgba(255, 215, 0, 0.12)" }
          : undefined
      }
    >
      {showParticles && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-xl">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-2 h-2 rounded-full ${isRefund ? "bg-green-400" : "bg-primary"} animate-ping`}
              style={{
                left: `${15 + i * 15}%`,
                top: `${30 + (i % 2) * 30}%`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: "1s",
              }}
            />
          ))}
        </div>
      )}

      <div className="relative z-10 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className={`w-10 h-10 rounded-xl ${
              isRefund ? "bg-green-500/10 border border-green-500/20" : "bg-primary/10 border border-primary/20"
            } flex items-center justify-center`}
          >
            <Coins className={`w-5 h-5 ${isRefund ? "text-green-400" : "text-primary"}`} />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-lg font-bold ${isRefund ? "text-green-400" : "text-primary"}`}>
                {formatMNEE(payment.amount, 4)} MNEE
              </span>
              {isRefund ? (
                <span className="text-xs text-green-400/70 font-semibold">REFUND</span>
              ) : (
                <span className="text-xs text-muted-foreground">
                  {payment.providerName || `Task #${String(payment.tenderId).slice(-4)}`}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {isRefund ? (
                <span>Unused budget returned to wallet</span>
              ) : (
                <>
                  <span className="font-mono">
                    {payment.recipient.slice(0, 6)}...{payment.recipient.slice(-4)}
                  </span>
                  <span className="text-muted-foreground/50">|</span>
                  <span>{new Date(payment.timestamp).toLocaleTimeString()}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {payment.txHash && (
          <a
            href={escrowClient.getTxLink(payment.txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 hover:bg-muted rounded-lg transition-colors group"
          >
            <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </a>
        )}
      </div>
    </div>
  )
}

function playPaymentSound() {
  if (typeof window === "undefined") return

  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1)

    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.2)
  } catch (error) {
    // Silent fail
  }
}
