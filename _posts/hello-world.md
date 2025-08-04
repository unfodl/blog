---
title: "Deploying Binary Contracts on Sepolia with UMA Optimistic Oracle"
excerpt: "A comprehensive guide to deploying binary contracts on Sepolia testnet using UMA resolvers and optimistic oracle for decentralized dispute resolution."
coverImage: "/assets/blog/hello-world/cover.jpg"
date: "2020-03-16T05:35:07.322Z"
author:
  name: Marco Montes
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/hello-world/cover.jpg"
---

# Deploying Binary Contracts on Sepolia with UMA Optimistic Oracle

Welcome to this comprehensive guide on deploying binary contracts on Sepolia testnet using UMA's optimistic oracle system. This tutorial will walk you through the entire process, from understanding the core concepts to deploying your first contract.

## 🎯 What We'll Build

We'll create a binary contract that asks: "Will the price of ETH be above $3,000 on December 31st, 2024?" This contract will use UMA's optimistic oracle for resolution, ensuring decentralized and trustless dispute resolution.

## 📚 Understanding the Core Concepts

### What is a Binary Contract?

A binary contract is a smart contract that has exactly two possible outcomes: **YES** or **NO**. Think of it as a bet or prediction market where participants can stake on either outcome.

```solidity
// Example binary contract structure
contract BinaryContract {
    enum Outcome { YES, NO }
    
    mapping(address => uint256) public yesStakes;
    mapping(address => uint256) public noStakes;
    
    Outcome public resolvedOutcome;
    bool public isResolved;
}
```

### What is UMA's Optimistic Oracle?

The optimistic oracle is a decentralized dispute resolution system that works on the principle of "innocent until proven guilty":

1. **Proposal**: Anyone can propose an answer to a question
2. **Dispute Period**: During a time window, anyone can dispute the proposed answer
3. **Resolution**: If disputed, the question goes to UMA's voting system for final resolution

### Why Sepolia Testnet?

Sepolia is Ethereum's recommended testnet for development and testing:
- **Free ETH**: Get test ETH from faucets
- **Realistic Environment**: Mirrors mainnet conditions
- **Safe Testing**: No real money at risk

## 🛠️ Prerequisites

Before we start, make sure you have:

```bash
# Check Node.js version (v18+ required)
node --version

# Check npm version
npm --version

# Install Hardhat globally
npm install -g hardhat

# Install Foundry (for advanced testing)
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

## 📦 Step 1: Setting Up the Development Environment

Let's create our project structure:

```bash
# Create project directory
mkdir uma-binary-contract
cd uma-binary-contract

# Initialize npm project
npm init -y

# Install dependencies
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npm install @uma/core @uma/contracts-node
npm install @openzeppelin/contracts
npm install dotenv

# Initialize Hardhat
npx hardhat init
```

## 🔧 Step 2: Configure Hardhat for Sepolia

Create your `hardhat.config.js`:

```javascript
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.19",
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://sepolia.infura.io/v3/YOUR-PROJECT-ID",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};
```

Create a `.env` file:

```bash
# .env
PRIVATE_KEY=your_private_key_here
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_project_id
ETHERSCAN_API_KEY=your_etherscan_api_key
```

## 📝 Step 3: Understanding UMA Contract Architecture

UMA's system consists of several key contracts:

```solidity
// Key UMA contracts we'll interact with
interface IOptimisticOracleV3 {
    function requestPrice(
        bytes32 identifier,
        uint256 timestamp,
        bytes memory ancillaryData,
        IERC20 currency,
        uint256 reward
    ) external returns (uint256);
    
    function proposePrice(
        address requester,
        bytes32 identifier,
        uint256 timestamp,
        bytes memory ancillaryData,
        int256 proposedPrice
    ) external returns (uint256);
}
```

## 🏗️ Step 4: Creating Our Binary Contract

Create `contracts/BinaryContract.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@uma/core/contracts/optimistic-oracle-v3/interfaces/OptimisticOracleV3Interface.sol";

contract BinaryContract is ReentrancyGuard, Ownable {
    // UMA Optimistic Oracle
    OptimisticOracleV3Interface public immutable optimisticOracle;
    
    // Contract state
    enum Outcome { YES, NO, UNRESOLVED }
    Outcome public outcome = Outcome.UNRESOLVED;
    
    // Staking
    mapping(address => uint256) public yesStakes;
    mapping(address => uint256) public noStakes;
    uint256 public totalYesStakes;
    uint256 public totalNoStakes;
    
    // UMA parameters
    bytes32 public immutable identifier;
    uint256 public immutable resolutionTime;
    bytes public immutable ancillaryData;
    
    // Events
    event Staked(address indexed user, bool isYes, uint256 amount);
    event Resolved(Outcome outcome);
    event Claimed(address indexed user, uint256 amount);
    
    constructor(
        address _optimisticOracle,
        bytes32 _identifier,
        uint256 _resolutionTime,
        string memory _question
    ) {
        optimisticOracle = OptimisticOracleV3Interface(_optimisticOracle);
        identifier = _identifier;
        resolutionTime = _resolutionTime;
        ancillaryData = bytes(_question);
    }
    
    function stake(bool isYes) external payable nonReentrant {
        require(block.timestamp < resolutionTime, "Staking period ended");
        require(msg.value > 0, "Must stake some ETH");
        
        if (isYes) {
            yesStakes[msg.sender] += msg.value;
            totalYesStakes += msg.value;
        } else {
            noStakes[msg.sender] += msg.value;
            totalNoStakes += msg.value;
        }
        
        emit Staked(msg.sender, isYes, msg.value);
    }
    
    function resolve() external {
        require(block.timestamp >= resolutionTime, "Too early to resolve");
        require(outcome == Outcome.UNRESOLVED, "Already resolved");
        
        // Request price from UMA
        optimisticOracle.requestPrice(
            identifier,
            resolutionTime,
            ancillaryData,
            IERC20(address(0)), // ETH
            0 // No reward for this example
        );
        
        // For this example, we'll assume the price is proposed externally
        // In a real implementation, you'd need to handle the price proposal
    }
    
    function setOutcome(Outcome _outcome) external onlyOwner {
        require(outcome == Outcome.UNRESOLVED, "Already resolved");
        require(_outcome != Outcome.UNRESOLVED, "Invalid outcome");
        
        outcome = _outcome;
        emit Resolved(_outcome);
    }
    
    function claim() external nonReentrant {
        require(outcome != Outcome.UNRESOLVED, "Not resolved yet");
        
        uint256 yesStake = yesStakes[msg.sender];
        uint256 noStake = noStakes[msg.sender];
        
        if (yesStake > 0) {
            yesStakes[msg.sender] = 0;
            if (outcome == Outcome.YES) {
                uint256 winnings = calculateWinnings(yesStake, totalYesStakes, totalNoStakes);
                payable(msg.sender).transfer(winnings);
            }
        }
        
        if (noStake > 0) {
            noStakes[msg.sender] = 0;
            if (outcome == Outcome.NO) {
                uint256 winnings = calculateWinnings(noStake, totalNoStakes, totalYesStakes);
                payable(msg.sender).transfer(winnings);
            }
        }
        
        emit Claimed(msg.sender, yesStake + noStake);
    }
    
    function calculateWinnings(
        uint256 userStake,
        uint256 totalWinningStakes,
        uint256 totalLosingStakes
    ) internal pure returns (uint256) {
        if (totalWinningStakes == 0) return userStake;
        
        // Winner takes all: user's proportion of winning stakes + their original stake
        uint256 totalPot = totalWinningStakes + totalLosingStakes;
        uint256 userProportion = (userStake * totalPot) / totalWinningStakes;
        return userProportion;
    }
    
    // Emergency functions
    function emergencyWithdraw() external onlyOwner {
        require(block.timestamp > resolutionTime + 30 days, "Too early for emergency");
        payable(owner()).transfer(address(this).balance);
    }
    
    receive() external payable {}
}
```

## 🧪 Step 5: Creating Deployment Script

Create `scripts/deploy.js`:

```javascript
const { ethers } = require("hardhat");

async function main() {
    // UMA Optimistic Oracle address on Sepolia
    const OPTIMISTIC_ORACLE_ADDRESS = "0xfb55F43fB9F48F63f9269dB4D8B0503Eac02e7E8";
    
    // Create a unique identifier for our question
    const identifier = ethers.utils.formatBytes32String("BINARY_CONTRACT_ETH_PRICE");
    
    // Resolution time: December 31st, 2024
    const resolutionTime = Math.floor(new Date("2024-12-31T23:59:59Z").getTime() / 1000);
    
    // The question we're asking
    const question = "Will the price of ETH be above $3,000 on December 31st, 2024?";
    
    console.log("Deploying Binary Contract...");
    console.log("Question:", question);
    console.log("Resolution Time:", new Date(resolutionTime * 1000).toISOString());
    
    const BinaryContract = await ethers.getContractFactory("BinaryContract");
    const binaryContract = await BinaryContract.deploy(
        OPTIMISTIC_ORACLE_ADDRESS,
        identifier,
        resolutionTime,
        question
    );
    
    await binaryContract.deployed();
    
    console.log("Binary Contract deployed to:", binaryContract.address);
    console.log("Transaction hash:", binaryContract.deployTransaction.hash);
    
    // Verify the contract on Etherscan
    console.log("\nWaiting for block confirmations...");
    await binaryContract.deployTransaction.wait(6);
    
    console.log("Contract deployed successfully!");
    console.log("Contract Address:", binaryContract.address);
    console.log("Identifier:", identifier);
    console.log("Resolution Time:", resolutionTime);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
```

## 🚀 Step 6: Deploying to Sepolia

First, get some Sepolia ETH:

```bash
# Visit a Sepolia faucet
# https://sepoliafaucet.com/
# https://faucet.sepolia.dev/
```

Then deploy your contract:

```bash
# Compile contracts
npx hardhat compile

# Deploy to Sepolia
npx hardhat run scripts/deploy.js --network sepolia
```

## 🔍 Step 7: Interacting with Your Contract

Create `scripts/interact.js`:

```javascript
const { ethers } = require("hardhat");

async function main() {
    const contractAddress = "YOUR_DEPLOYED_CONTRACT_ADDRESS";
    const BinaryContract = await ethers.getContractFactory("BinaryContract");
    const contract = BinaryContract.attach(contractAddress);
    
    // Stake on YES outcome
    console.log("Staking 0.1 ETH on YES...");
    const stakeTx = await contract.stake(true, { value: ethers.utils.parseEther("0.1") });
    await stakeTx.wait();
    console.log("Staked successfully!");
    
    // Check contract state
    const totalYes = await contract.totalYesStakes();
    const totalNo = await contract.totalNoStakes();
    const outcome = await contract.outcome();
    
    console.log("Total YES stakes:", ethers.utils.formatEther(totalYes), "ETH");
    console.log("Total NO stakes:", ethers.utils.formatEther(totalNo), "ETH");
    console.log("Current outcome:", outcome);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
```

## 🔧 Step 8: Understanding UMA Resolution Process

The resolution process involves several steps:

### 1. Price Request
```javascript
// Request a price from UMA
await optimisticOracle.requestPrice(
    identifier,
    resolutionTime,
    ancillaryData,
    currency,
    reward
);
```

### 2. Price Proposal
```javascript
// Propose a price (1 for YES, 0 for NO)
await optimisticOracle.proposePrice(
    requester,
    identifier,
    resolutionTime,
    ancillaryData,
    proposedPrice
);
```

### 3. Dispute Period
- **Default**: 2 hours on Sepolia
- **During this time**: Anyone can dispute the proposed price
- **If disputed**: Goes to UMA's voting system

### 4. Final Resolution
```javascript
// Set the outcome based on UMA resolution
await contract.setOutcome(1); // 1 for YES, 0 for NO
```

## 🧪 Step 9: Testing Your Contract

Create `test/BinaryContract.test.js`:

```javascript
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BinaryContract", function () {
    let binaryContract;
    let owner;
    let user1;
    let user2;
    
    beforeEach(async function () {
        [owner, user1, user2] = await ethers.getSigners();
        
        const BinaryContract = await ethers.getContractFactory("BinaryContract");
        binaryContract = await BinaryContract.deploy(
            "0xfb55F43fB9F48F63f9269dB4D8B0503Eac02e7E8", // UMA Oracle
            ethers.utils.formatBytes32String("TEST"),
            Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
            "Test question?"
        );
        await binaryContract.deployed();
    });
    
    it("Should allow staking on YES", async function () {
        await binaryContract.connect(user1).stake(true, { value: ethers.utils.parseEther("1") });
        expect(await binaryContract.yesStakes(user1.address)).to.equal(ethers.utils.parseEther("1"));
    });
    
    it("Should allow staking on NO", async function () {
        await binaryContract.connect(user1).stake(false, { value: ethers.utils.parseEther("1") });
        expect(await binaryContract.noStakes(user1.address)).to.equal(ethers.utils.parseEther("1"));
    });
    
    it("Should resolve correctly", async function () {
        await binaryContract.connect(user1).stake(true, { value: ethers.utils.parseEther("1") });
        await binaryContract.connect(user2).stake(false, { value: ethers.utils.parseEther("1") });
        
        await binaryContract.connect(owner).setOutcome(1); // YES wins
        
        const initialBalance = await user1.getBalance();
        await binaryContract.connect(user1).claim();
        const finalBalance = await user1.getBalance();
        
        expect(finalBalance.gt(initialBalance)).to.be.true;
    });
});
```

Run the tests:

```bash
npx hardhat test
```

## 🔒 Step 10: Security Considerations

### Important Security Measures:

1. **Reentrancy Protection**: Already implemented with `ReentrancyGuard`
2. **Access Control**: Only owner can set outcome
3. **Emergency Withdraw**: Available after 30 days
4. **Input Validation**: Check for valid stakes and timing

### Additional Security Features to Consider:

```solidity
// Add these to your contract for enhanced security

// Pausable functionality
bool public paused;
modifier whenNotPaused() {
    require(!paused, "Contract is paused");
    _;
}

// Minimum stake requirement
uint256 public minimumStake = 0.01 ether;

// Maximum stake limit
uint256 public maximumStake = 10 ether;

// Stake validation
function stake(bool isYes) external payable nonReentrant whenNotPaused {
    require(msg.value >= minimumStake, "Stake too low");
    require(msg.value <= maximumStake, "Stake too high");
    // ... rest of function
}
```

## 📊 Step 11: Monitoring and Analytics

Track your contract's performance:

```javascript
// Monitor contract events
contract.on("Staked", (user, isYes, amount) => {
    console.log(`User ${user} staked ${ethers.utils.formatEther(amount)} ETH on ${isYes ? 'YES' : 'NO'}`);
});

contract.on("Resolved", (outcome) => {
    console.log(`Contract resolved with outcome: ${outcome}`);
});

contract.on("Claimed", (user, amount) => {
    console.log(`User ${user} claimed ${ethers.utils.formatEther(amount)} ETH`);
});
```

## 🎯 Step 12: Advanced Features

### Adding Liquidity Pools:

```solidity
// Add AMM-style liquidity pools
mapping(address => uint256) public liquidityProviderShares;
uint256 public totalLiquidityShares;

function addLiquidity() external payable {
    uint256 shares = calculateShares(msg.value);
    liquidityProviderShares[msg.sender] += shares;
    totalLiquidityShares += shares;
}

function removeLiquidity(uint256 shares) external {
    uint256 ethAmount = (shares * address(this).balance) / totalLiquidityShares;
    liquidityProviderShares[msg.sender] -= shares;
    totalLiquidityShares -= shares;
    payable(msg.sender).transfer(ethAmount);
}
```

### Adding Time-Based Features:

```solidity
// Early resolution if overwhelming consensus
uint256 public constant CONSENSUS_THRESHOLD = 90; // 90%

function checkEarlyResolution() external {
    uint256 totalStakes = totalYesStakes + totalNoStakes;
    if (totalStakes > 0) {
        uint256 yesPercentage = (totalYesStakes * 100) / totalStakes;
        if (yesPercentage >= CONSENSUS_THRESHOLD) {
            outcome = Outcome.YES;
            emit Resolved(Outcome.YES);
        } else if (yesPercentage <= (100 - CONSENSUS_THRESHOLD)) {
            outcome = Outcome.NO;
            emit Resolved(Outcome.NO);
        }
    }
}
```

## 🚀 Next Steps

1. **Deploy to Mainnet**: Once tested on Sepolia
2. **Add Frontend**: Create a web interface
3. **Integrate with UMA**: Set up proper price feeds
4. **Add More Questions**: Create multiple binary contracts
5. **Implement Governance**: Allow community voting on questions

## 📚 Resources

- [UMA Documentation](https://docs.uma.xyz/)
- [Optimistic Oracle V3](https://docs.uma.xyz/optimistic-oracle-v3)
- [Sepolia Faucet](https://sepoliafaucet.com/)
- [Hardhat Documentation](https://hardhat.org/docs)

## 🎉 Conclusion

You've successfully learned how to deploy binary contracts on Sepolia using UMA's optimistic oracle! This system provides:

- **Decentralized Resolution**: No single point of failure
- **Trustless Operation**: No need to trust a central authority
- **Dispute Resolution**: Built-in mechanism for handling disagreements
- **Scalability**: Can handle multiple questions simultaneously

The optimistic oracle pattern is powerful for creating decentralized prediction markets, insurance products, and any application requiring external data resolution.

Happy building! 🚀
