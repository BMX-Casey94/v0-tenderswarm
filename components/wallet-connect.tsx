"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Wallet, ChevronDown, LogOut, ExternalLink, Coins, RefreshCw } from "lucide-react"
import { useState, useEffect, useCallback, createContext, useContext } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { glassCardStyle } from "@/lib/styles"
import { escrowClient } from "@/lib/contracts/escrow-client"
import { CHAIN_CONFIG, getMNEETokenLink } from "@/lib/contracts/config"
import { WalletModal } from "./wallet-modal"

const DEMO_WALLET_ADDRESS = "0xDEMO00000000000000000000000000000000"
const DEMO_MNEE_BALANCE = "100.0000"

interface WalletContextType {
  address: string | null
  mneeBalance: string | null
  isConnected: boolean
  isDemoMode: boolean
  enableDemoMode: () => void
  disableDemoMode: () => void
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  refreshBalance: () => Promise<void>
}

const WalletContext = createContext<WalletContextType | null>(null)

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null)
  const [mneeBalance, setMneeBalance] = useState<string | null>(null)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  const fetchBalance = useCallback(async () => {
    if (!address) return
    if (isDemoMode) {
      setMneeBalance(DEMO_MNEE_BALANCE)
      return
    }
    try {
      const balance = await escrowClient.getMNEEBalance(address)
      setMneeBalance(balance)
    } catch (error) {
      console.error("Failed to fetch MNEE balance:", error)
      setMneeBalance("0")
    }
  }, [address, isDemoMode])

  useEffect(() => {
    if (typeof window === "undefined") return

    // Check for demo mode
    const demoMode = sessionStorage.getItem("tenderswarm_demo_mode")
    if (demoMode === "true") {
      setAddress(DEMO_WALLET_ADDRESS)
      setMneeBalance(DEMO_MNEE_BALANCE)
      setIsDemoMode(true)
      setIsInitialized(true)
      return
    }

    // Always check MetaMask's actual connection state
    const checkConnection = async () => {
      if (typeof window !== "undefined" && (window as any).ethereum) {
        try {
          const accounts = await (window as any).ethereum.request({ method: "eth_accounts" })
          if (accounts && accounts.length > 0) {
            setAddress(accounts[0])
          }
        } catch (error) {
          console.error("Error checking wallet:", error)
        }
      }
      setIsInitialized(true)
    }
    checkConnection()
  }, [])

  useEffect(() => {
    if (address) {
      fetchBalance()
    }
  }, [address, fetchBalance])

  useEffect(() => {
    if (!address || isDemoMode) return
    const interval = setInterval(fetchBalance, 30000)
    return () => clearInterval(interval)
  }, [address, fetchBalance, isDemoMode])

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          // MetaMask disconnected
          setAddress(null)
          setMneeBalance(null)
          setIsDemoMode(false)
          sessionStorage.removeItem("tenderswarm_demo_mode")
        } else {
          // MetaMask connected or switched accounts
          setAddress(accounts[0])
          setIsDemoMode(false)
          sessionStorage.removeItem("tenderswarm_demo_mode")
        }
      }

      const handleChainChanged = () => {
        // Reload on chain change to ensure correct network
        window.location.reload()
      }
      ;(window as any).ethereum.on("accountsChanged", handleAccountsChanged)
      ;(window as any).ethereum.on("chainChanged", handleChainChanged)

      return () => {
        ;(window as any).ethereum.removeListener("accountsChanged", handleAccountsChanged)
        ;(window as any).ethereum.removeListener("chainChanged", handleChainChanged)
      }
    }
  }, [])

  const enableDemoMode = useCallback(() => {
    console.log("[v0] Enabling demo mode...")
    setAddress(DEMO_WALLET_ADDRESS)
    setMneeBalance(DEMO_MNEE_BALANCE)
    setIsDemoMode(true)
    sessionStorage.setItem("tenderswarm_demo_mode", "true")
    console.log("[v0] Demo mode enabled, address:", DEMO_WALLET_ADDRESS)
  }, [])

  const disableDemoMode = useCallback(() => {
    setAddress(null)
    setMneeBalance(null)
    setIsDemoMode(false)
    sessionStorage.removeItem("tenderswarm_demo_mode")
  }, [])

  const connectWallet = useCallback(async () => {
    if (typeof (window as any).ethereum !== "undefined") {
      try {
        await (window as any).ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${CHAIN_CONFIG.mainnet.id.toString(16)}` }],
        })
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          try {
            await (window as any).ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: `0x${CHAIN_CONFIG.mainnet.id.toString(16)}`,
                  chainName: CHAIN_CONFIG.mainnet.name,
                  rpcUrls: [CHAIN_CONFIG.mainnet.rpcUrl],
                  blockExplorerUrls: [CHAIN_CONFIG.mainnet.blockExplorer],
                  nativeCurrency: {
                    name: "Ether",
                    symbol: "ETH",
                    decimals: 18,
                  },
                },
              ],
            })
          } catch (addError) {
            console.error("Failed to add Ethereum network:", addError)
          }
        }
      }

      const accounts = await (window as any).ethereum.request({
        method: "eth_requestAccounts",
      })

      if (accounts && accounts.length > 0) {
        setAddress(accounts[0])
        setIsDemoMode(false)
        sessionStorage.removeItem("tenderswarm_demo_mode")
      }
    }
  }, [])

  const disconnectWallet = useCallback(() => {
    setAddress(null)
    setMneeBalance(null)
    setIsDemoMode(false)
    sessionStorage.removeItem("tenderswarm_demo_mode")
    // Note: MetaMask stays connected at browser level - user must disconnect from MetaMask directly
  }, [])

  return (
    <WalletContext.Provider
      value={{
        address,
        mneeBalance,
        isConnected: !!address,
        isDemoMode,
        enableDemoMode,
        disableDemoMode,
        connectWallet,
        disconnectWallet,
        refreshBalance: fetchBalance,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider")
  }
  return context
}

export const DEMO_ADDRESS = DEMO_WALLET_ADDRESS

interface WalletConnectProps {
  onConnect?: (address: string) => void
  onDisconnect?: () => void
}

export function WalletConnect({ onConnect, onDisconnect }: WalletConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [isLoadingBalance, setIsLoadingBalance] = useState(false)
  const [showWalletModal, setShowWalletModal] = useState(false)

  const { address, mneeBalance, isDemoMode, enableDemoMode, connectWallet, disconnectWallet, refreshBalance } =
    useWallet()

  const handleConnectWallet = async (connectedAddress: string) => {
    onConnect?.(connectedAddress)
    setShowWalletModal(false)
  }

  const handleConnectClick = () => {
    setShowWalletModal(true)
  }

  const handleDemoMode = () => {
    enableDemoMode()
    setShowWalletModal(false)
    onConnect?.(DEMO_WALLET_ADDRESS)
  }

  const handleDisconnect = () => {
    disconnectWallet()
    onDisconnect?.()
  }

  const handleRefreshBalance = async () => {
    setIsLoadingBalance(true)
    await refreshBalance()
    setIsLoadingBalance(false)
  }

  if (address) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="border-primary/30 text-foreground hover:bg-muted/50 hover:border-primary/50 rounded-xl gap-2 bg-transparent"
          >
            <div className={`w-2 h-2 rounded-full ${isDemoMode ? "bg-amber-500" : "bg-green-500"}`} />
            <span className="font-mono">
              {isDemoMode ? "Demo Mode" : `${address.slice(0, 6)}...${address.slice(-4)}`}
            </span>
            {mneeBalance && (
              <span className="text-primary font-medium ml-1">{Number.parseFloat(mneeBalance).toFixed(2)} MNEE</span>
            )}
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 border-border/50" style={glassCardStyle}>
          <div className="px-3 py-2 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">
                  {isDemoMode ? "Simulated Balance" : "MNEE Balance"}
                </span>
              </div>
              {!isDemoMode && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleRefreshBalance}
                  disabled={isLoadingBalance}
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingBalance ? "animate-spin" : ""}`} />
                </Button>
              )}
            </div>
            <div className="text-lg font-bold text-primary mt-1">
              {isLoadingBalance ? "..." : `${Number.parseFloat(mneeBalance || "0").toFixed(4)} MNEE`}
            </div>
            {isDemoMode && <p className="text-xs text-amber-400 mt-1">Demo mode - no real transactions</p>}
          </div>
          {!isDemoMode && (
            <>
              <DropdownMenuItem
                className="gap-2"
                onClick={() => window.open(`${CHAIN_CONFIG.mainnet.blockExplorer}/address/${address}`, "_blank")}
              >
                <ExternalLink className="w-4 h-4" />
                View on Etherscan
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2" onClick={() => window.open(getMNEETokenLink("mainnet"), "_blank")}>
                <Coins className="w-4 h-4" />
                View MNEE Token
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem onClick={handleDisconnect} className="gap-2 text-destructive focus:text-destructive">
            <LogOut className="w-4 h-4" />
            {isDemoMode ? "Exit Demo Mode" : "Disconnect"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <>
      <Button
        onClick={handleConnectClick}
        disabled={isConnecting}
        className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl gap-2"
      >
        <Wallet className="w-4 h-4" />
        {isConnecting ? "Connecting..." : "Connect Wallet"}
      </Button>

      <WalletModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onConnect={handleConnectWallet}
        onDemoMode={handleDemoMode}
      />
    </>
  )
}
