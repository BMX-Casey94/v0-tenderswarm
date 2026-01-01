# TenderSwarm Provider Payment Architecture

## Current Setup (Treasury Model)

All AI agents currently use **Vercel AI Gateway** models and payments route to your **Platform Treasury** address:

\`\`\`
Treasury Address: 0xd4a27D669c8F27BF293b4D15269E0398CDb27aE1
\`\`\`

### Payment Flow

\`\`\`
User Wallet
    ↓
    Pays 1 MNEE to launch swarm
    ↓
Platform Treasury (receives initial payment)
    ↓
    AI Swarm runs (7 specialised agents)
    ↓
Provider Payments (currently all to treasury)
    ├─ Grok Researcher → 0xd4a2...aE1 (0.25 MNEE)
    ├─ GPT-4 Strategist → 0xd4a2...aE1 (0.2 MNEE)
    ├─ Claude Writer → 0xd4a2...aE1 (0.3 MNEE)
    ├─ ... (other agents)
    └─ ... Refund 'Unspent' Budget back to User.
\`\`\`

**Result:** Currently All MNEE stays in treasury Wallet for Hackathon Purposes, but the system tracks which "virtual provider" completed each task.

---

## Current AI Providers

Configured in `lib/agents/ai-providers.ts`:

| Provider Name | Specialty | AI Model | Payment Address |
|--------------|-----------|----------|-----------------|
| Grok Research Specialist | research | xai/grok-3-fast | Treasury |
| GPT-4 Strategy Consultant | strategy | openai/gpt-4 | Treasury |
| Claude Content Creator | copywriting | anthropic/claude-3.5-sonnet | Treasury |
| Grok Design Architect | design | xai/grok-3-fast | Treasury |
| GPT-4 Technical Lead | development | openai/gpt-4 | Treasury |
| Claude Financial Analyst | financial-modeling | anthropic/claude-3.5-sonnet | Treasury |
| Grok Marketing Specialist | marketing | xai/grok-3-fast | Treasury |

---

## How to Add Real Providers (Future)

When we're ready to onboard real AI service providers who want to earn MNEE:

### Step 1: Provider Registers

Provider provides:
- **Name** (e.g., "DeepMind Research AI")
- **Ethereum wallet address** (e.g., `0x1234...ABCD`)
- **Specialty** (research, design, copywriting, etc.)
- **AI model** (optional - can use your AI Gateway or their own)
- **Slot fee** (e.g., 100 MNEE upfront to list for 30 days)

### Step 2: Update ai-providers.ts

\`\`\`typescript
// Before (treasury model):
{
  id: "grok-researcher",
  name: "Grok Research Specialist",
  address: PLATFORM_TREASURY, // ← Treasury gets paid
  specialty: "research",
  aiModel: "xai/grok-3-fast",
  description: "Expert at market research...",
  responseTime: 8000,
  isActive: true,
}

// After (real provider):
{
  id: "deepmind-researcher",
  name: "DeepMind Research AI",
  address: "0x1234567890abcdef1234567890abcdef12345678", // ← Real provider wallet
  specialty: "research",
  aiModel: "xai/grok-3-fast", // or their custom model
  description: "Advanced AI research powered by DeepMind",
  responseTime: 8000,
  isActive: true,
  owner: "0xProviderOwnerAddress", // Owner who paid the slot fee
  slotExpiry: new Date("2025-02-15"), // When slot expires
}
\`\`\`

### Step 3: Payments Automatically Route

No other code changes needed! The system will automatically:
1. Assign tasks to the new provider based on specialty
2. Generate deliverables using their AI model
3. Send MNEE payments directly to their wallet address on-chain
4. Display their name in the Live Payment Feed

---

## Slot Marketplace (Future Enhancement)

You can monetize by selling "provider slots":

### Revenue Model

1. **Upfront Slot Fee**: Provider pays 100 MNEE to list for 30 days
2. **Platform Fee**: Take 10% of each task payment
3. **Performance Metrics**: Track provider quality scores

### Example Economics

\`\`\`
Provider "DeepMind Research AI" joins:
  - Pays 100 MNEE slot fee → Your treasury
  - Gets listed in research category
  
User launches 10 MNEE swarm:
  - Research task assigned to DeepMind (2 MNEE)
  - DeepMind receives: 1.8 MNEE (90%)
  - Platform receives: 0.2 MNEE (10% fee)
\`\`\`

### Implementation Sketch

\`\`\`typescript
// Add to ai-providers.ts:
export interface ProviderSlot {
  provider: AIProvider
  slotFee: number // MNEE paid upfront
  platformFee: number // % of each task (e.g., 0.1 = 10%)
  startDate: Date
  expiryDate: Date
  tasksCompleted: number
  totalEarned: number
  qualityScore: number // 0-100
}

// When provider registers:
await escrowClient.transferMNEE(
  providerOwnerAddress,
  PLATFORM_TREASURY,
  100 // slot fee
)

// When provider completes task:
const providerAmount = taskReward * (1 - platformFee) // 90%
const platformAmount = taskReward * platformFee // 10%

await escrowClient.transferMNEE(userAddress, providerAddress, providerAmount)
await escrowClient.transferMNEE(userAddress, PLATFORM_TREASURY, platformAmount)
\`\`\`

---

## Current System Benefits

### Why Treasury Model Works Now

1. **Simplicity**: No complex multi-party payments yet
2. **Testing**: Verify all blockchain transactions work correctly
3. **Demo Mode**: Users can test without real MNEE
4. **Live Mode**: Real payments flow through your treasury

### When User Launches Swarm

**Demo Mode:**
- Simulated payments (0xDEMO... hashes)
- No real blockchain transactions
- Instant results for testing

**Live Mode:**
- Real MNEE transfers on Ethereum Mainnet
- User → Treasury (initial payment)
- Treasury → Providers (currently all treasury, but tracked separately)
- Etherscan verification links

---

## File Structure

\`\`\`
lib/
├── agents/
│   ├── ai-providers.ts          ← Central provider config (edit addresses here)
│   ├── content-generator.ts     ← Uses providers from config
│   ├── evaluator.ts            ← Handles payments to provider addresses
│   └── swarm-orchestrator.ts   ← Coordinates everything
├── contracts/
│   ├── config.ts               ← PLATFORM_TREASURY address
│   └── escrow-client.ts        ← Handles MNEE transfers
└── simulator/
    └── provider-simulator.ts    ← Uses AI_PROVIDERS for simulation
\`\`\`

---

## Testing Checklist

- [x] Demo mode works without real payments
- [x] Live mode connects to Ethereum Mainnet
- [x] MNEE balance displays correctly
- [x] Payments route to treasury address
- [x] Payment feed shows transactions with Etherscan links
- [x] All 7 AI providers use correct AI Gateway models
- [x] Test real MNEE transfer on mainnet (when ready)
- [x] Verify treasury receives payments
- [x] Check Etherscan for transaction confirmations

---

## Quick Reference

**To Change Payment Address for All Providers:**

Edit `lib/contracts/config.ts`:
\`\`\`typescript
export const PLATFORM_TREASURY = "0xYourNewAddress" as `0x${string}`
\`\`\`

**To Add a New Provider:**

Edit `lib/agents/ai-providers.ts` and add to `AI_PROVIDERS` array:
\`\`\`typescript
{
  id: "unique-id",
  name: "Provider Name",
  address: "0xProviderWalletAddress", // or PLATFORM_TREASURY
  specialty: "research", // or design, copywriting, etc.
  aiModel: "xai/grok-3-fast",
  description: "What they specialize in",
  responseTime: 8000,
  isActive: true,
}
\`\`\`

**To Temporarily Disable a Provider:**

Change `isActive: false` in `ai-providers.ts`

---

## Support

For questions about the provider system:
1. Check `ai-providers.ts` for current configuration
2. Review payment flow in `evaluator.ts`
3. Test in Demo Mode first before going live
4. Verify transactions on Etherscan in Live Mode
