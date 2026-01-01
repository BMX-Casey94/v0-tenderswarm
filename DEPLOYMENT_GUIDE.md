# TenderSwarm Deployment Guide - Sepolia Testnet

## Prerequisites

1. **MetaMask or compatible wallet** with Sepolia testnet configured
2. **Sepolia ETH** for gas fees (free from faucets)
3. **Testnet MNEE tokens** (need to deploy)

---

## Step 1: Get Sepolia Testnet ETH

You need Sepolia ETH to deploy contracts and pay gas fees.

**Faucet Options:**
- Alchemy Sepolia Faucet: https://sepoliafaucet.com/
- Infura Sepolia Faucet: https://www.infura.io/faucet/sepolia
- QuickNode Faucet: https://faucet.quicknode.com/ethereum/sepolia

Request 0.5 ETH (should be plenty for all deployments and testing).

---

## Step 2: Deploy Test MNEE Token

Since MNEE (0x8cce...6cF) only exists on Ethereum Mainnet, you need to deploy a test version to Sepolia.

### Option A: Simple ERC-20 (Recommended for Testing)

1. Go to **Remix IDE**: https://remix.ethereum.org/
2. Create new file: `TestMNEE.sol`
3. Paste this code:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestMNEE is ERC20 {
    constructor() ERC20("Test MNEE Token", "MNEE") {
        // Mint 1 million test MNEE to deployer
        _mint(msg.sender, 1000000 * 10**18);
    }
    
    // Allow anyone to mint test tokens (testnet only!)
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
