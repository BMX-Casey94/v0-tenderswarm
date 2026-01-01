# TenderSwarm

> **Decentralised AI Agent Marketplace powered by MNEE tokens**

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/corsacasey-gmailcoms-projects/v0-tender-swarm-implementation)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/fMfQnB7lZZx)

## Overview

TenderSwarm is a decentralised platform that connects users with specialised AI agents to complete complex projects. Built on Ethereum using the MNEE token standard (`0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF`), it demonstrates a working prototype of an AI agent marketplace with real blockchain-powered payments.

### What it Does

Users submit project briefs with MNEE token budgets. The platform automatically:
1. Decomposes projects into specialized micro-tasks
2. Distributes tasks to AI agents based on expertise
3. Generates deliverables through parallel agent execution
4. Evaluates quality and triggers on-chain payments
5. Assembles results into a final document
6. Refunds unused budget to the user

## Key Features

- **Real Blockchain Payments**: Live MNEE transfers on Ethereum Mainnet with Etherscan verification
- **7 Specialised AI Agents**: Research, Strategy, Content, Design, Development, Financial, Marketing
- **Multi-Tier System**: Basic, Standard, Premium, and Enterprise tiers with dynamic pricing
- **Smart Budget Management**: Automatic cost tracking with unused fund refunds
- **Demo Mode**: Test the platform without spending real tokens
- **Live Dashboard**: Real-time agent activity, task progress, and payment tracking
- **Wallet Integration**: MetaMask support for secure token transactions

## Tech Stack

### Frontend
- **Next.js 15** with App Router and React 19
- **TypeScript** for type safety
- **Tailwind CSS v4** for styling
- **Shadcn/ui** component library
- **Recharts** for data visualization

### Blockchain
- **Ethereum Mainnet** (Chain ID: 1)
- **Viem** for blockchain interactions
- **MNEE Token** (ERC-20) at `0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF`

### AI Infrastructure
- **Vercel AI SDK v5** with AI Gateway
- **Multiple AI Models**: xAI Grok, OpenAI GPT-4, Anthropic Claude
- **Demo Mode Models**: Cost-limited alternatives for testing

## Architecture

### Agent System

TenderSwarm uses a 7-agent architecture:

1. **Coordinator**: Orchestrates the entire swarm lifecycle
2. **Project Manager**: Decomposes briefs into micro-tasks
3. **Tender Poster**: Publishes tasks to the provider network
4. **Content Generator**: Routes tasks to specialised AI providers
5. **Evaluator**: Scores deliverables and triggers payments
6. **Assembler**: Compiles final documents
7. **Cost Tracker**: Monitors budget and calculates refunds

### Payment Flow

```
User Wallet
    ↓ (Initial Payment)
Platform Treasury
    ↓ (Task Distribution)
AI Providers (7 specialized agents)
    ↓ (Quality Work)
Provider Payments (On-chain MNEE transfers)
    ↓ (Unused Budget)
Refund to User Wallet
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- MetaMask wallet with MNEE tokens
- Ethereum Mainnet RPC access

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-org/v0-tenderswarm.git
cd v0-tenderswarm
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
# Required
GROK_API_KEY=your_grok_api_key
AI_GATEWAY_API_KEY=your_ai_gateway_key

# Blockchain Config
NEXT_PUBLIC_CHAIN=1
NEXT_PUBLIC_TENDER_ESCROW_ADDRESS=0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF
NEXT_PUBLIC_PLATFORM_TREASURY=0xYourTreasuryAddress
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

### Usage

**Demo Mode** (No cost):
1. Click "Continue in Demo Mode" on the dashboard
2. Enter your project brief
3. Watch the AI swarm execute with simulated payments

**Live Mode** (Real MNEE):
1. Connect your MetaMask wallet
2. Ensure you have MNEE tokens ([Get MNEE](https://swap-user.mnee.net/swap))
3. Set your budget (0.25 MNEE minimum)
4. Submit your brief and approve the transaction
5. Watch real-time progress and verify payments on Etherscan

## Project Structure

```
├── app/
│   ├── api/swarm/          # Swarm execution endpoint
│   ├── results/            # Results display page
│   └── page.tsx            # Main dashboard
├── components/
│   ├── live-dashboard.tsx  # Real-time swarm monitoring
│   ├── payment-feed.tsx    # Live payment stream
│   └── wallet-connect.tsx  # Wallet integration
├── lib/
│   ├── agents/             # 7-agent system
│   ├── contracts/          # Blockchain client & ABIs
│   └── types.ts            # TypeScript definitions
└── scripts/                # SQL migration scripts
```

## Tier Pricing

| Tier | Max Tasks | Budget Range | Tokens/Task | Use Case |
|------|-----------|--------------|-------------|----------|
| **Basic** | 3 | 0.25-0.5 MNEE | 4,000 | Simple projects |
| **Standard** | 5 | 0.5-1.0 MNEE | 6,000 | Standard work |
| **Premium** | 8 | 1.0-2.0 MNEE | 8,000 | Complex projects |
| **Enterprise** | 12 | 2.0+ MNEE | 12,000 | Large scale |

## Documentation

- [Setup Guide](./SETUP.md) - Detailed installation and configuration
- [Provider Architecture](./PROVIDER_ARCHITECTURE.md) - How to add AI providers
- [Deployment Guide](./DEPLOYMENT_GUIDE.md) - Production deployment instructions

## Live Demo

**Production**: [https://vercel.com/corsacasey-gmailcoms-projects/v0-tender-swarm-implementation](https://vercel.com/corsacasey-gmailcoms-projects/v0-tender-swarm-implementation)

**v0 Chat**: [https://v0.app/chat/fMfQnB7lZZx](https://v0.app/chat/fMfQnB7lZZx)

## Hackathon Context

Built for the MNEE Token Hackathon. TenderSwarm demonstrates a practical application of the MNEE token contract (`0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF`) by creating a decentralized marketplace where AI agents earn cryptocurrency for completing specialized tasks. The platform showcases real blockchain integration with live on-chain payments, refund mechanisms, and transparent transaction tracking.

## Future Enhancements

- **Provider Marketplace**: Allow external AI service providers to register and earn MNEE
- **Slot-Based Listings**: Providers pay upfront fees for marketplace visibility
- **Quality Scoring**: Track provider performance and user ratings
- **Multi-Chain Support**: Expand beyond Ethereum Mainnet
- **Advanced Task Types**: Image generation, video processing, data analysis
- **Governance**: DAO-based platform decisions

## Contributing

This project was built entirely using v0.app.

## License

MIT License - See LICENSE file for details

## Support

For questions or issues:
- Open an issue on GitHub
- Check the [SETUP.md](./SETUP.md) guide
- Review transaction logs in the browser console
- Verify blockchain transactions on [Etherscan](https://etherscan.io)

---

**Built with v0.app** | **Powered by MNEE** | **Deployed on Vercel**
