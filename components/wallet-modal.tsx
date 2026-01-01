"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { X, ExternalLink, Wallet, AlertTriangle, Check, Loader2 } from "lucide-react"
import { glassCardStyle } from "@/lib/styles"

interface WalletOption {
  id: string
  name: string
  icon: string
  description: string
  downloadUrl: string
  deepLink?: string
  checkInstalled: () => boolean
  getProvider: () => any
}

const walletOptions: WalletOption[] = [
  {
    id: "metamask",
    name: "MetaMask",
    icon: "🦊",
    description: "The most popular Ethereum wallet",
    downloadUrl: "https://metamask.io/download/",
    deepLink: "https://metamask.app.link/dapp/",
    checkInstalled: () => {
      if (typeof window === "undefined") return false
      const eth = (window as any).ethereum
      if (!eth) return false
      if (eth.isMetaMask && !eth.isBraveWallet) return true
      if (eth.providers?.some((p: any) => p.isMetaMask)) return true
      return false
    },
    getProvider: () => {
      const eth = (window as any).ethereum
      if (eth?.providers) {
        return eth.providers.find((p: any) => p.isMetaMask) || eth
      }
      return eth
    },
  },
  {
    id: "coinbase",
    name: "Coinbase Wallet",
    icon: "🔵",
    description: "Secure wallet by Coinbase",
    downloadUrl: "https://www.coinbase.com/wallet/downloads",
    deepLink: "https://go.cb-w.com/dapp?cb_url=",
    checkInstalled: () => {
      if (typeof window === "undefined") return false
      const eth = (window as any).ethereum
      if (!eth) return false
      if (eth.isCoinbaseWallet) return true
      if (eth.providers?.some((p: any) => p.isCoinbaseWallet)) return true
      return false
    },
    getProvider: () => {
      const eth = (window as any).ethereum
      if (eth?.providers) {
        return eth.providers.find((p: any) => p.isCoinbaseWallet) || eth
      }
      return eth
    },
  },
  {
    id: "trust",
    name: "Trust Wallet",
    icon: "🛡️",
    description: "Multi-chain crypto wallet",
    downloadUrl: "https://trustwallet.com/download",
    deepLink: "https://link.trustwallet.com/open_url?url=",
    checkInstalled: () => {
      if (typeof window === "undefined") return false
      const eth = (window as any).ethereum
      if (!eth) return false
      if (eth.isTrust || eth.isTrustWallet) return true
      return false
    },
    getProvider: () => (window as any).ethereum,
  },
  {
    id: "rabby",
    name: "Rabby Wallet",
    icon: "🐰",
    description: "Better UX for DeFi users",
    downloadUrl: "https://rabby.io/",
    checkInstalled: () => {
      if (typeof window === "undefined") return false
      const eth = (window as any).ethereum
      if (!eth) return false
      if (eth.isRabby) return true
      return false
    },
    getProvider: () => (window as any).ethereum,
  },
]

interface WalletModalProps {
  isOpen: boolean
  onClose: () => void
  onConnect: (address: string) => Promise<void> | void // Accept address string, not wallet ID
  onDemoMode?: () => void
}

export function WalletModal({ isOpen, onClose, onConnect, onDemoMode }: WalletModalProps) {
  const [connecting, setConnecting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [installedWallets, setInstalledWallets] = useState<Set<string>>(new Set())
  const [hasAnyWallet, setHasAnyWallet] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isOpen) return

    const detectWallets = () => {
      const installed = new Set<string>()
      const hasEth = typeof window !== "undefined" && !!(window as any).ethereum
      setHasAnyWallet(hasEth)

      walletOptions.forEach((wallet) => {
        if (wallet.checkInstalled()) {
          installed.add(wallet.id)
        }
      })

      if (hasEth && installed.size === 0) {
        installed.add("metamask")
      }

      setInstalledWallets(installed)
    }

    const timer = setTimeout(detectWallets, 100)
    return () => clearTimeout(timer)
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  if (!isOpen || !mounted) return null

  const handleConnect = async (wallet: WalletOption) => {
    const isInstalled = installedWallets.has(wallet.id)

    if (!isInstalled && !hasAnyWallet) {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      if (isMobile && wallet.deepLink) {
        window.location.href = wallet.deepLink + encodeURIComponent(window.location.href)
      } else {
        window.open(wallet.downloadUrl, "_blank")
      }
      return
    }

    setConnecting(wallet.id)
    setError(null)

    try {
      const provider = wallet.getProvider()

      if (!provider) {
        throw new Error(`${wallet.name} provider not found`)
      }

      const accounts = await provider.request({
        method: "eth_requestAccounts",
      })

      if (accounts && accounts.length > 0) {
        console.log("[v0] Connected to wallet:", wallet.name, "Address:", accounts[0])

        if ((window as any).ethereum !== provider) {
          ;(window as any).ethereum.selectedProvider = provider
        }

        await onConnect(accounts[0])
        onClose()
      }
    } catch (err: any) {
      console.error("[v0] Wallet connection error:", err)
      if (err.code === 4001) {
        setError("Connection rejected. Please approve the connection in your wallet.")
      } else if (err.code === -32002) {
        setError("Connection pending. Please check your wallet extension.")
      } else {
        setError(err.message || "Failed to connect wallet")
      }
    } finally {
      setConnecting(null)
    }
  }

  const handleDemoMode = () => {
    if (onDemoMode) {
      onDemoMode()
    }
    onClose()
  }

  const modalContent = (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.85)",
          backdropFilter: "blur(8px)",
        }}
      />

      {/* Modal Content */}
      <div
        style={{
          ...glassCardStyle,
          position: "relative",
          width: "100%",
          maxWidth: "28rem",
          margin: "1rem",
          padding: "1.5rem",
          borderRadius: "1.5rem",
          backgroundColor: "rgba(10, 10, 10, 0.98)",
          border: "1px solid rgba(255, 215, 0, 0.2)",
          maxHeight: "85vh",
          overflowY: "auto",
          zIndex: 10000,
        }}
        className="custom-scrollbar"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #FFD700 0%, #FF6B00 100%)",
              }}
            >
              <Wallet className="w-5 h-5 text-black" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Connect Wallet</h2>
              <p className="text-sm text-muted-foreground">To pay with MNEE tokens</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-muted/50">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {!hasAnyWallet ? (
          <div className="mb-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-300">No Wallet Detected</p>
                <p className="text-xs text-amber-400/70 mt-1">
                  Install a wallet extension or open this page in your wallet's browser.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-4 p-4 rounded-xl bg-green-500/10 border border-green-500/30">
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-300">Wallet Detected</p>
                <p className="text-xs text-green-400/70 mt-1">
                  Click your wallet below to connect and approve the connection.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Wallet Options */}
        <div className="space-y-3">
          {walletOptions.map((wallet) => {
            const isInstalled = installedWallets.has(wallet.id)
            const isConnecting = connecting === wallet.id

            return (
              <button
                key={wallet.id}
                onClick={() => handleConnect(wallet)}
                disabled={isConnecting}
                className={`w-full p-4 rounded-xl border transition-all duration-200 flex items-center gap-4 group disabled:opacity-50 ${
                  isInstalled
                    ? "border-green-500/30 bg-green-500/5 hover:bg-green-500/10 hover:border-green-500/50"
                    : "border-border/50 bg-muted/20 hover:bg-muted/40 hover:border-primary/30"
                }`}
              >
                <div className="text-3xl">{wallet.icon}</div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{wallet.name}</span>
                    {isInstalled && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Ready
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isInstalled ? "Click to connect" : wallet.description}
                  </p>
                </div>
                {isConnecting ? (
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                ) : isInstalled ? (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                    style={{
                      background: "linear-gradient(135deg, #FFD700 0%, #FF6B00 100%)",
                    }}
                  >
                    <span className="text-black font-bold">→</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-muted-foreground group-hover:text-primary transition-colors">
                    <span className="text-xs">Install</span>
                    <ExternalLink className="w-4 h-4" />
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Demo Mode Option */}
        <div className="mt-4 pt-4 border-t border-border/50">
          <button
            onClick={handleDemoMode}
            className="w-full p-4 rounded-xl border-2 border-dashed border-amber-500/30 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all duration-200 text-center group"
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-lg">🎮</span>
              <span className="text-foreground font-semibold group-hover:text-amber-400 transition-colors">
                Continue in Demo Mode
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Try TenderSwarm without real payments (simulated 100 MNEE wallet)
            </p>
          </button>
        </div>

        {/* Footer */}
        <div className="mt-4">
          <p className="text-xs text-center text-muted-foreground">
            By connecting, you agree to transfer MNEE tokens for AI services.
            <br />
            <a
              href="https://ethereum.org/wallets"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Learn more about Ethereum wallets →
            </a>
          </p>
        </div>
      </div>
    </div>
  )

  // Render into document.body via portal
  return createPortal(modalContent, document.body)
}
