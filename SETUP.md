# TenderSwarm Setup Guide

## Competition Requirements

This project is built for the MNEE Stablecoin competition and uses the **real MNEE token on Ethereum Mainnet**.

- **MNEE Token Contract**: `0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF`
- **Network**: Ethereum Mainnet (Chain ID: 1)
- **Token Standard**: ERC-20 with 18 decimals
- **Etherscan**: https://etherscan.io/token/0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF

---

## Environment Variables

You only need to set **ONE** environment variable:

### Required Variable

\`\`\`bash
NEXT_PUBLIC_PLATFORM_TREASURY=0xd4a27D669c8F27BF293b4D15269E0398CDb27aE1
\`\`\`

This is your treasury address where MNEE payments will be sent when users launch AI swarms.

### Optional Variables

\`\`\`bash
# Only needed if you want to deploy custom TenderEscrow contract (optional)
NEXT_PUBLIC_TENDER_ESCROW_ADDRESS=0xYourEscrowContractAddress

# AI Gateway API Key (already configured in your workspace)
AI_GATEWAY_API_KEY=your_key_here

# Grok API Key (already configured in your workspace)  
GROK_API_KEY=your_key_here
\`\`\`

---

## How It Works

### MNEE Token (Already Deployed)

The MNEE token is **already deployed on Ethereum Mainnet** at the address above. You don't need to deploy anything for the token - it's ready to use.

### Your Treasury Address

**`0xd4a27D669c8F27BF293b4D15269E0398CDb27aE1`** is where user payments go when they:
1. Connect their wallet with real MNEE tokens
2. Launch an AI swarm with a budget (e.g., 2 MNEE)
3. The app transfers MNEE from their wallet to your treasury

### Demo Mode

Users can also use **Demo Mode** which simulates everything without real transactions:
- Click "Continue in Demo Mode" when connecting wallet
- Get fake 100 MNEE balance
- All transactions are simulated (no real blockchain calls)
- Perfect for testing and demonstrations

---

## How to Use

### For Development

1. Add the environment variable to your `.env.local`:
   \`\`\`bash
   NEXT_PUBLIC_PLATFORM_TREASURY=0xd4a27D669c8F27BF293b4D15269E0398CDb27aE1
   \`\`\`

2. Run the app:
   \`\`\`bash
   npm run dev
   \`\`\`

3. Test with Demo Mode (no real MNEE needed)

### For Production on Vercel

1. Go to your Vercel project settings
2. Add Environment Variable:
   - **Name**: `NEXT_PUBLIC_PLATFORM_TREASURY`
   - **Value**: `0xd4a27D669c8F27BF293b4D15269E0398CDb27aE1`
3. Deploy

### Testing with Real MNEE

1. **Get MNEE tokens**:
   - Buy MNEE on DEXs (Uniswap, etc.)
   - Or get from MNEE faucet/community
   - Transfer to your MetaMask on Ethereum Mainnet

2. **Connect wallet**:
   - Visit your app
   - Click "Connect Wallet"
   - Select MetaMask
   - Approve the connection

3. **Launch a swarm**:
   - Enter your project brief
   - Set budget (e.g., 2 MNEE)
   - Click "Launch Agent Swarm"
   - Approve MNEE transfer in MetaMask

4. **View transaction**:
   - Check your treasury address on Etherscan
   - See the MNEE transfer from user → your treasury
   - Payment feed shows real transaction hash

---

## Technical Details

### Payment Flow (Live Mode)

1. User connects wallet → App checks MNEE balance
2. User launches swarm → App calls `transferMNEE(treasury, budget)`
3. MetaMask prompts user to approve transaction
4. MNEE transfers from user wallet → your treasury
5. Swarm executes and generates deliverables
6. Provider payments are simulated (would need separate escrow contract)

### Payment Flow (Demo Mode)

1. User clicks "Continue in Demo Mode"
2. Fake wallet address: `0xDEMO00000000000000000000000000000000`
3. Fake balance: 100 MNEE
4. All transactions generate fake hashes (0xDEMO...)
5. No real blockchain calls

---

## Frequently Asked Questions

**Q: Do I need to deploy the TenderEscrow contract?**  
A: No, it's optional. Direct MNEE transfers work without it. The escrow contract is for advanced features like multi-party payments and dispute resolution.

**Q: Where can I get MNEE tokens to test?**  
A: Use Demo Mode for testing without real tokens. For real testing, acquire MNEE on Ethereum Mainnet via DEXs.

**Q: Can I use testnet?**  
A: The competition requires using the real MNEE token on Ethereum Mainnet. Testnet won't work with the official MNEE contract.

**Q: What if users don't have enough MNEE?**  
A: The app checks balance before allowing swarm launch. If insufficient, it shows an error. Users must acquire MNEE first.

**Q: Are the AI API keys secure?**  
A: AI Gateway and Grok API keys are stored as secrets and only used server-side in API routes. They never expose to the client.

---

## Support

- **MNEE Token**: https://etherscan.io/token/0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF
- **Your Treasury**: https://etherscan.io/address/0xd4a27D669c8F27BF293b4D15269E0398CDb27aE1
- **Competition**: Check official MNEE competition documentation
