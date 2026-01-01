import { createPublicClient, createWalletClient, custom, http, formatUnits, getAddress } from "viem"
import { mainnet, sepolia } from "viem/chains"
import { TENDER_ESCROW_ABI, MNEE_TOKEN_ADDRESS } from "./tender-escrow-abi"
import { CONTRACT_ADDRESSES, CHAIN_CONFIG, DEFAULT_CHAIN, parseMNEEToWei, ERC20_ABI } from "./config"

const chain = DEFAULT_CHAIN === "mainnet" ? mainnet : sepolia

export class EscrowClient {
  private publicClient
  private contractAddress: string

  constructor(contractAddress?: string) {
    this.contractAddress = contractAddress || CONTRACT_ADDRESSES.tenderEscrow

    this.publicClient = createPublicClient({
      chain,
      transport: http(CHAIN_CONFIG[DEFAULT_CHAIN].rpcUrl, {
        timeout: 10000,
        retryCount: 2,
      }),
    })
  }

  private getWalletClient(account: `0x${string}`) {
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("No wallet provider found")
    }
    return createWalletClient({
      account,
      chain,
      transport: custom(window.ethereum),
    })
  }

  private checksumAddress(address: string): `0x${string}` {
    return getAddress(address) as `0x${string}`
  }

  async getMNEEAllowance(owner: string, spender: string): Promise<string> {
    const allowance = await this.publicClient.readContract({
      address: MNEE_TOKEN_ADDRESS,
      abi: ERC20_ABI,
      functionName: "allowance",
      args: [this.checksumAddress(owner), this.checksumAddress(spender)],
    })
    return formatUnits(allowance, 18)
  }

  async approveMNEE(
    account: `0x${string}`,
    spender: string,
    amount: number,
  ): Promise<{ hash: string; success: boolean }> {
    try {
      const walletClient = this.getWalletClient(account)
      const amountWei = parseMNEEToWei(amount)

      const hash = await walletClient.writeContract({
        address: MNEE_TOKEN_ADDRESS,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [this.checksumAddress(spender), amountWei],
      })

      // Wait for confirmation
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash })

      return {
        hash,
        success: receipt.status === "success",
      }
    } catch (error) {
      console.error("Failed to approve MNEE:", error)
      throw error
    }
  }

  async transferMNEE(account: `0x${string}`, to: string, amount: number): Promise<{ hash: string; success: boolean }> {
    try {
      const walletClient = this.getWalletClient(account)
      const amountWei = parseMNEEToWei(amount)

      const hash = await walletClient.writeContract({
        address: MNEE_TOKEN_ADDRESS,
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [this.checksumAddress(to), amountWei],
      })

      // Wait for confirmation
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash })

      return {
        hash,
        success: receipt.status === "success",
      }
    } catch (error) {
      console.error("Failed to transfer MNEE:", error)
      throw error
    }
  }

  async verifyBalance(
    address: string,
    requiredAmount: number,
  ): Promise<{
    hasBalance: boolean
    balance: string
    required: string
  }> {
    const balance = await this.getMNEEBalance(address)
    const balanceNum = Number.parseFloat(balance)

    return {
      hasBalance: balanceNum >= requiredAmount,
      balance,
      required: requiredAmount.toString(),
    }
  }

  // Read functions
  async getTenderCount(): Promise<number> {
    const count = await this.publicClient.readContract({
      address: this.contractAddress as `0x${string}`,
      abi: TENDER_ESCROW_ABI,
      functionName: "tenderCount",
    })
    return Number(count)
  }

  async getTender(tenderId: number) {
    const tender = await this.publicClient.readContract({
      address: this.contractAddress as `0x${string}`,
      abi: TENDER_ESCROW_ABI,
      functionName: "tenders",
      args: [BigInt(tenderId)],
    })

    return {
      taskHash: tender[0],
      reward: formatUnits(tender[1], 18),
      winner: tender[2],
      deliverableURI: tender[3],
      completed: tender[4],
    }
  }

  async getMNEEBalance(address: string): Promise<string> {
    try {
      const balance = await this.publicClient.readContract({
        address: MNEE_TOKEN_ADDRESS,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [this.checksumAddress(address)],
      })
      return formatUnits(balance, 18)
    } catch (error) {
      console.error("Failed to get MNEE balance:", error)
      return "0"
    }
  }

  // Watch for events
  watchTenderCreated(callback: (log: any) => void) {
    return this.publicClient.watchContractEvent({
      address: this.contractAddress as `0x${string}`,
      abi: TENDER_ESCROW_ABI,
      eventName: "TenderCreated",
      onLogs: (logs) => {
        logs.forEach(callback)
      },
    })
  }

  watchTenderAccepted(callback: (log: any) => void) {
    try {
      return this.publicClient.watchContractEvent({
        address: this.contractAddress as `0x${string}`,
        abi: TENDER_ESCROW_ABI,
        eventName: "TenderAccepted",
        onLogs: (logs) => {
          logs.forEach(callback)
        },
        onError: (error) => {
          console.log("[v0] Error watching TenderAccepted events:", error)
        },
      })
    } catch (error) {
      console.log("[v0] Failed to set up event watcher:", error)
      return () => {}
    }
  }

  watchDeliverySubmitted(callback: (log: any) => void) {
    return this.publicClient.watchContractEvent({
      address: this.contractAddress as `0x${string}`,
      abi: TENDER_ESCROW_ABI,
      eventName: "DeliverySubmitted",
      onLogs: (logs) => {
        logs.forEach(callback)
      },
    })
  }

  // Get block explorer link
  getTxLink(txHash: string): string {
    return `${CHAIN_CONFIG[DEFAULT_CHAIN].blockExplorer}/tx/${txHash}`
  }

  getAddressLink(address: string): string {
    return `${CHAIN_CONFIG[DEFAULT_CHAIN].blockExplorer}/address/${address}`
  }
}

// Singleton instance
export const escrowClient = new EscrowClient()
