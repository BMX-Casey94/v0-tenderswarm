// Contract configuration for Ethereum Mainnet with MNEE ERC-20
// Competition Requirements: Use MNEE at 0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF

// NOTE: All addresses below are PUBLIC blockchain information, not secrets.
// Contract addresses and wallet addresses are visible on Etherscan and are
// required by the client to interact with the blockchain.

export const CHAIN_CONFIG = {
  mainnet: {
    id: 1,
    name: "Ethereum",
    rpcUrl: "https://ethereum.publicnode.com",
    blockExplorer: "https://etherscan.io",
  },
  sepolia: {
    id: 11155111,
    name: "Sepolia Testnet",
    rpcUrl: "https://ethereum-sepolia-rpc.publicnode.com",
    blockExplorer: "https://sepolia.etherscan.io",
  },
} as const

export const CONTRACT_ADDRESSES = {
  // TenderEscrow contract address (optional - direct MNEE transfers work without it)
  tenderEscrow: process.env.NEXT_PUBLIC_TENDER_ESCROW_ADDRESS || "0x0000000000000000000000000000000000000000",

  // MNEE ERC-20 token - PRODUCTION ADDRESS on Ethereum Mainnet
  mneeToken: "0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF",
} as const

export const MNEE_CONFIG = {
  address: CONTRACT_ADDRESSES.mneeToken as `0x${string}`,
  decimals: 18,
  symbol: "MNEE",
  name: "MNEE Token",
  chainId: 1, // Ethereum Mainnet
} as const

// ERC-20 ABI for MNEE token interactions
export const ERC20_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "decimals",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    name: "symbol",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
] as const

export const PLATFORM_TREASURY =
  (process.env.NEXT_PUBLIC_PLATFORM_TREASURY as `0x${string}`) || "0xd4a27D669c8F27BF293b4D15269E0398CDb27aE1"

export const DEFAULT_CHAIN = process.env.NEXT_PUBLIC_CHAIN === "sepolia" ? "sepolia" : "mainnet"

// Format MNEE for display (human readable)
export function formatMNEE(amount: number, decimals = 4): string {
  return amount.toFixed(decimals)
}

// Convert MNEE amount to wei (for contract calls)
export function parseMNEEToWei(amount: number): bigint {
  // Multiply by 10^18 for 18 decimal places
  const wei = amount * 10 ** MNEE_CONFIG.decimals
  return BigInt(Math.floor(wei))
}

// Convert wei back to MNEE (from contract responses)
export function parseWeiToMNEE(wei: bigint): number {
  return Number(wei) / 10 ** MNEE_CONFIG.decimals
}

// Format wei as MNEE string for display
export function formatWeiAsMNEE(wei: bigint, decimals = 4): string {
  return formatMNEE(parseWeiToMNEE(wei), decimals)
}

// Validate MNEE address
export function isValidMNEEAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

// Get Etherscan link for transaction
export function getEtherscanTxLink(txHash: string, chain: "mainnet" | "sepolia" = "mainnet"): string {
  return `${CHAIN_CONFIG[chain].blockExplorer}/tx/${txHash}`
}

// Get Etherscan link for address
export function getEtherscanAddressLink(address: string, chain: "mainnet" | "sepolia" = "mainnet"): string {
  return `${CHAIN_CONFIG[chain].blockExplorer}/address/${address}`
}

// Get Etherscan link for MNEE token
export function getMNEETokenLink(chain: "mainnet" | "sepolia" = "mainnet"): string {
  return `${CHAIN_CONFIG[chain].blockExplorer}/token/${MNEE_CONFIG.address}`
}
