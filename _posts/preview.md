---
title: "Zero-Knowledge Passport Verification with Noir and Barretenberg"
excerpt: "Learn how to use Noir programming language with Barretenberg backend to verify passport information and prove nationality without revealing sensitive personal data."
coverImage: "/assets/blog/preview/cover.jpg"
date: "2020-03-16T05:35:07.322Z"
author:
  name: Marco Montes
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/preview/cover.jpg"
---

# Zero-Knowledge Passport Verification with Noir and Barretenberg

Welcome to this comprehensive guide on building zero-knowledge proofs for passport verification using Noir programming language and Barretenberg backend. This tutorial will show you how to prove your nationality without revealing any other sensitive passport information.

## 🎯 What We'll Build

We'll create a system that allows users to prove they are from a specific country (e.g., "I am a citizen of Canada") without revealing their name, passport number, date of birth, or any other personal information. This is perfect for:

- **Age-restricted services**: Prove you're over 18 without revealing your exact age
- **Geographic restrictions**: Prove you're from a specific country for content access
- **KYC compliance**: Meet regulatory requirements while preserving privacy
- **Voting systems**: Prove eligibility without revealing identity

## 🔐 Understanding Zero-Knowledge Proofs

### What is a Zero-Knowledge Proof?

A zero-knowledge proof allows you to prove you know a secret without revealing the secret itself. Think of it like proving you know a password without actually typing it.

```typescript
// Traditional approach (reveals everything)
const passport = {
  name: "John Doe",
  nationality: "Canadian",
  passportNumber: "CA123456789",
  dateOfBirth: "1990-01-01"
};

// Zero-knowledge approach (proves nationality only)
const proof = generateProof({
  secret: passport,
  publicInput: "Canadian"
});
// Result: "I can prove I'm Canadian" without revealing anything else
```

### Why Noir and Barretenberg?

- **Noir**: Domain-specific language for zero-knowledge proofs
- **Barretenberg**: High-performance proof generation backend
- **Ethereum Integration**: Native compatibility with blockchain networks
- **Privacy-First**: Built specifically for privacy-preserving applications

## 🛠️ Prerequisites

Before we start, ensure you have:

```bash
# Check Rust version (required for Barretenberg)
rustc --version

# Check Node.js version
node --version

# Install Noir CLI
curl -L https://raw.githubusercontent.com/noir-lang/noirup/main/install | bash
source ~/.bashrc
noirup

# Verify Noir installation
nargo --version
```

## 📦 Step 1: Setting Up the Development Environment

Create your project structure:

```bash
# Create project directory
mkdir noir-passport-verification
cd noir-passport-verification

# Initialize Noir project
nargo init passport_verifier
cd passport_verifier

# Install Node.js dependencies
npm init -y
npm install @noir-lang/barretenberg
npm install @noir-lang/noir_wasm
npm install ethers
npm install dotenv
```

## 🔧 Step 2: Understanding the Circuit Design

Our circuit will verify passport information using cryptographic commitments:

```rust
// src/main.nr
use dep::std;

// Public inputs (what we want to prove)
struct PublicInputs {
    nationality_hash: Field,    // Hash of the nationality we're proving
    age_threshold: Field,       // Minimum age requirement
    current_date: Field,        // Current date for age calculation
}

// Private inputs (what we keep secret)
struct PrivateInputs {
    passport_number: Field,     // Passport number
    name_hash: Field,           // Hash of full name
    date_of_birth: Field,       // Date of birth
    nationality: Field,         // Actual nationality
    expiry_date: Field,         // Passport expiry date
}

// Main circuit function
fn main(
    nationality_hash: pub Field,
    age_threshold: pub Field,
    current_date: pub Field,
    passport_number: Field,
    name_hash: Field,
    date_of_birth: Field,
    nationality: Field,
    expiry_date: Field,
) {
    // 1. Verify nationality matches the hash we're proving
    let computed_nationality_hash = std::hash::pedersen([nationality])[0];
    assert(computed_nationality_hash == nationality_hash);
    
    // 2. Verify passport is not expired
    assert(current_date < expiry_date);
    
    // 3. Verify age requirement
    let age = current_date - date_of_birth;
    assert(age >= age_threshold);
    
    // 4. Verify passport number is valid (basic format check)
    assert(passport_number != 0);
    assert(passport_number < 1000000000000); // 12 digits max
    
    // 5. Verify name is not empty
    assert(name_hash != 0);
}
```

## 🏗️ Step 3: Creating the Passport Data Structure

Let's define our passport data types:

```typescript
// types/passport.ts
export interface PassportData {
  passportNumber: string;
  fullName: string;
  dateOfBirth: Date;
  nationality: string;
  expiryDate: Date;
  issuingCountry: string;
}

export interface VerificationRequest {
  nationality: string;
  minimumAge: number;
  currentDate: Date;
}

export interface ProofResult {
  proof: string;
  publicInputs: {
    nationalityHash: string;
    ageThreshold: string;
    currentDate: string;
  };
}
```

## 🔐 Step 4: Implementing the Verification System

Create the main verification logic:

```typescript
// src/verifier.ts
import { BarretenbergBackend } from '@noir-lang/barretenberg';
import { Noir } from '@noir-lang/noir_wasm';
import { ethers } from 'ethers';
import { PassportData, VerificationRequest, ProofResult } from './types/passport';

export class PassportVerifier {
  private noir: Noir;
  private backend: BarretenbergBackend;

  constructor() {
    this.backend = new BarretenbergBackend();
    this.noir = new Noir(this.backend);
  }

  // Hash a string to a field element
  private hashString(input: string): bigint {
    const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(input));
    return BigInt(hash) % BigInt(21888242871839275222246405745257275088548364400416034343698204186575808495617n);
  }

  // Convert date to field element (days since epoch)
  private dateToField(date: Date): bigint {
    const epochMs = new Date('1970-01-01').getTime();
    const daysSinceEpoch = Math.floor((date.getTime() - epochMs) / (1000 * 60 * 60 * 24));
    return BigInt(daysSinceEpoch);
  }

  // Convert age to field element
  private ageToField(dateOfBirth: Date, currentDate: Date): bigint {
    const ageMs = currentDate.getTime() - dateOfBirth.getTime();
    const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));
    return BigInt(ageDays);
  }

  // Generate proof for nationality verification
  async generateNationalityProof(
    passportData: PassportData,
    request: VerificationRequest
  ): Promise<ProofResult> {
    // Prepare inputs
    const nationalityHash = this.hashString(passportData.nationality);
    const nameHash = this.hashString(passportData.fullName);
    const dateOfBirth = this.dateToField(passportData.dateOfBirth);
    const expiryDate = this.dateToField(passportData.expiryDate);
    const currentDate = this.dateToField(request.currentDate);
    const ageThreshold = BigInt(request.minimumAge * 365); // Convert years to days
    const passportNumber = BigInt(passportData.passportNumber.replace(/\D/g, ''));

    // Generate the proof
    const proof = await this.noir.generateProof({
      nationality_hash: nationalityHash,
      age_threshold: ageThreshold,
      current_date: currentDate,
      passport_number: passportNumber,
      name_hash: nameHash,
      date_of_birth: dateOfBirth,
      nationality: this.hashString(passportData.nationality),
      expiry_date: expiryDate,
    });

    return {
      proof: proof.proof,
      publicInputs: {
        nationalityHash: nationalityHash.toString(),
        ageThreshold: ageThreshold.toString(),
        currentDate: currentDate.toString(),
      },
    };
  }

  // Verify a proof
  async verifyProof(proofResult: ProofResult): Promise<boolean> {
    try {
      const isValid = await this.noir.verifyProof({
        proof: proofResult.proof,
        publicInputs: [
          BigInt(proofResult.publicInputs.nationalityHash),
          BigInt(proofResult.publicInputs.ageThreshold),
          BigInt(proofResult.publicInputs.currentDate),
        ],
      });
      return isValid;
    } catch (error) {
      console.error('Proof verification failed:', error);
      return false;
    }
  }
}
```

## 🧪 Step 5: Creating Test Cases

Let's create comprehensive tests:

```typescript
// tests/verifier.test.ts
import { PassportVerifier } from '../src/verifier';
import { PassportData, VerificationRequest } from '../src/types/passport';

describe('PassportVerifier', () => {
  let verifier: PassportVerifier;

  beforeEach(() => {
    verifier = new PassportVerifier();
  });

  const mockPassport: PassportData = {
    passportNumber: 'CA123456789',
    fullName: 'John Doe',
    dateOfBirth: new Date('1990-01-01'),
    nationality: 'Canadian',
    expiryDate: new Date('2030-01-01'),
    issuingCountry: 'Canada',
  };

  const mockRequest: VerificationRequest = {
    nationality: 'Canadian',
    minimumAge: 18,
    currentDate: new Date('2024-01-01'),
  };

  it('should generate valid proof for Canadian passport', async () => {
    const proof = await verifier.generateNationalityProof(mockPassport, mockRequest);
    expect(proof).toBeDefined();
    expect(proof.proof).toBeDefined();
    expect(proof.publicInputs.nationalityHash).toBeDefined();
  });

  it('should verify valid proof', async () => {
    const proof = await verifier.generateNationalityProof(mockPassport, mockRequest);
    const isValid = await verifier.verifyProof(proof);
    expect(isValid).toBe(true);
  });

  it('should reject expired passport', async () => {
    const expiredPassport = {
      ...mockPassport,
      expiryDate: new Date('2020-01-01'), // Expired
    };

    await expect(
      verifier.generateNationalityProof(expiredPassport, mockRequest)
    ).rejects.toThrow();
  });

  it('should reject underage person', async () => {
    const underageRequest = {
      ...mockRequest,
      minimumAge: 25, // Person is 34, should pass
    };

    const proof = await verifier.generateNationalityProof(mockPassport, underageRequest);
    const isValid = await verifier.verifyProof(proof);
    expect(isValid).toBe(true);
  });
});
```

## 🚀 Step 6: Building the User Interface

Create a simple CLI interface:

```typescript
// src/cli.ts
import { PassportVerifier } from './verifier';
import { PassportData, VerificationRequest } from './types/passport';
import * as readline from 'readline';

class PassportVerifierCLI {
  private verifier: PassportVerifier;
  private rl: readline.Interface;

  constructor() {
    this.verifier = new PassportVerifier();
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  private question(prompt: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(prompt, resolve);
    });
  }

  async run() {
    console.log('🔐 Zero-Knowledge Passport Verifier\n');

    // Collect passport data
    const passportNumber = await this.question('Passport Number: ');
    const fullName = await this.question('Full Name: ');
    const dateOfBirth = await this.question('Date of Birth (YYYY-MM-DD): ');
    const nationality = await this.question('Nationality: ');
    const expiryDate = await this.question('Expiry Date (YYYY-MM-DD): ');

    // Collect verification request
    const targetNationality = await this.question('Nationality to prove: ');
    const minimumAge = parseInt(await this.question('Minimum age requirement: '));

    const passportData: PassportData = {
      passportNumber,
      fullName,
      dateOfBirth: new Date(dateOfBirth),
      nationality,
      expiryDate: new Date(expiryDate),
      issuingCountry: nationality,
    };

    const request: VerificationRequest = {
      nationality: targetNationality,
      minimumAge,
      currentDate: new Date(),
    };

    try {
      console.log('\n🔍 Generating proof...');
      const proof = await this.verifier.generateNationalityProof(passportData, request);
      
      console.log('\n✅ Proof generated successfully!');
      console.log('📄 Proof:', proof.proof.substring(0, 50) + '...');
      console.log('🌍 Nationality Hash:', proof.publicInputs.nationalityHash);
      console.log('📅 Age Threshold:', proof.publicInputs.ageThreshold);
      
      console.log('\n🔍 Verifying proof...');
      const isValid = await this.verifier.verifyProof(proof);
      
      if (isValid) {
        console.log('✅ Proof verified successfully!');
        console.log('🎉 You have proven your nationality without revealing personal data!');
      } else {
        console.log('❌ Proof verification failed!');
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
    }

    this.rl.close();
  }
}

// Run the CLI
if (require.main === module) {
  const cli = new PassportVerifierCLI();
  cli.run();
}
```

## 🔗 Step 7: Ethereum Integration

Create a smart contract for on-chain verification:

```solidity
// contracts/PassportVerifier.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

contract PassportVerifier is Ownable {
    // Verifier address (Barretenberg verifier)
    address public verifier;
    
    // Mapping of verified nationalities
    mapping(address => mapping(bytes32 => bool)) public verifiedNationalities;
    
    // Events
    event NationalityVerified(address indexed user, bytes32 nationalityHash);
    event VerifierUpdated(address indexed oldVerifier, address indexed newVerifier);
    
    constructor(address _verifier) {
        verifier = _verifier;
    }
    
    // Verify proof on-chain
    function verifyNationality(
        bytes calldata proof,
        bytes32 nationalityHash,
        uint256 ageThreshold,
        uint256 currentDate
    ) external returns (bool) {
        // Call the verifier contract
        (bool success, bytes memory result) = verifier.call(
            abi.encodeWithSignature(
                "verify(bytes,uint256[])",
                proof,
                [uint256(nationalityHash), ageThreshold, currentDate]
            )
        );
        
        require(success, "Verification failed");
        bool isValid = abi.decode(result, (bool));
        
        if (isValid) {
            verifiedNationalities[msg.sender][nationalityHash] = true;
            emit NationalityVerified(msg.sender, nationalityHash);
        }
        
        return isValid;
    }
    
    // Check if user has verified nationality
    function hasVerifiedNationality(address user, bytes32 nationalityHash) 
        external 
        view 
        returns (bool) 
    {
        return verifiedNationalities[user][nationalityHash];
    }
    
    // Update verifier (only owner)
    function updateVerifier(address _verifier) external onlyOwner {
        address oldVerifier = verifier;
        verifier = _verifier;
        emit VerifierUpdated(oldVerifier, _verifier);
    }
}
```

## 🔧 Step 8: Advanced Features

### Adding Multiple Nationality Support:

```rust
// src/main.nr - Enhanced version
use dep::std;

struct PublicInputs {
    nationality_hash: Field,
    age_threshold: Field,
    current_date: Field,
    allowed_countries: [Field; 5], // Support multiple countries
}

struct PrivateInputs {
    passport_number: Field,
    name_hash: Field,
    date_of_birth: Field,
    nationality: Field,
    expiry_date: Field,
    secondary_nationalities: [Field; 3], // Multiple citizenships
}

fn main(
    nationality_hash: pub Field,
    age_threshold: pub Field,
    current_date: pub Field,
    allowed_countries: pub [Field; 5],
    passport_number: Field,
    name_hash: Field,
    date_of_birth: Field,
    nationality: Field,
    expiry_date: Field,
    secondary_nationalities: [Field; 3],
) {
    // Check primary nationality
    let primary_hash = std::hash::pedersen([nationality])[0];
    let mut is_allowed = primary_hash == nationality_hash;
    
    // Check secondary nationalities
    for i in 0..3 {
        let secondary_hash = std::hash::pedersen([secondary_nationalities[i]])[0];
        if secondary_hash == nationality_hash {
            is_allowed = true;
        }
    }
    
    // Check if nationality is in allowed list
    let mut in_allowed_list = false;
    for i in 0..5 {
        if allowed_countries[i] == nationality_hash {
            in_allowed_list = true;
        }
    }
    
    assert(is_allowed && in_allowed_list);
    assert(current_date < expiry_date);
    
    let age = current_date - date_of_birth;
    assert(age >= age_threshold);
    assert(passport_number != 0);
    assert(name_hash != 0);
}
```

### Adding Time-Based Verification:

```typescript
// src/temporal-verifier.ts
export class TemporalPassportVerifier extends PassportVerifier {
  // Verify nationality at a specific point in time
  async generateHistoricalProof(
    passportData: PassportData,
    request: VerificationRequest,
    verificationDate: Date
  ): Promise<ProofResult> {
    const historicalRequest = {
      ...request,
      currentDate: verificationDate,
    };
    
    return this.generateNationalityProof(passportData, historicalRequest);
  }
  
  // Verify nationality over a time range
  async generateTimeRangeProof(
    passportData: PassportData,
    nationality: string,
    startDate: Date,
    endDate: Date
  ): Promise<ProofResult[]> {
    const proofs: ProofResult[] = [];
    
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const request: VerificationRequest = {
        nationality,
        minimumAge: 0, // No age requirement for historical verification
        currentDate: new Date(date),
      };
      
      try {
        const proof = await this.generateNationalityProof(passportData, request);
        proofs.push(proof);
      } catch (error) {
        // Skip dates where passport was expired
        continue;
      }
    }
    
    return proofs;
  }
}
```

## 🔒 Step 9: Security Considerations

### Important Security Measures:

```typescript
// src/security.ts
export class SecurePassportVerifier extends PassportVerifier {
  private readonly MAX_AGE = 120; // Maximum reasonable age
  private readonly MIN_AGE = 0;
  private readonly MAX_PASSPORT_LENGTH = 12;
  
  // Enhanced input validation
  private validatePassportData(passportData: PassportData): void {
    // Validate passport number format
    if (!/^[A-Z0-9]{6,12}$/.test(passportData.passportNumber)) {
      throw new Error('Invalid passport number format');
    }
    
    // Validate age range
    const age = this.calculateAge(passportData.dateOfBirth);
    if (age < this.MIN_AGE || age > this.MAX_AGE) {
      throw new Error('Invalid age');
    }
    
    // Validate dates
    if (passportData.dateOfBirth >= passportData.expiryDate) {
      throw new Error('Invalid date range');
    }
    
    // Validate nationality format
    if (!/^[A-Za-z\s]{2,50}$/.test(passportData.nationality)) {
      throw new Error('Invalid nationality format');
    }
  }
  
  // Rate limiting
  private readonly rateLimit = new Map<string, number>();
  private readonly RATE_LIMIT_WINDOW = 60000; // 1 minute
  private readonly MAX_REQUESTS_PER_WINDOW = 10;
  
  private checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const userRequests = this.rateLimit.get(userId) || 0;
    
    if (now - userRequests > this.RATE_LIMIT_WINDOW) {
      this.rateLimit.set(userId, now);
      return true;
    }
    
    if (userRequests < this.MAX_REQUESTS_PER_WINDOW) {
      this.rateLimit.set(userId, userRequests + 1);
      return true;
    }
    
    return false;
  }
  
  // Secure proof generation with validation
  async generateSecureProof(
    passportData: PassportData,
    request: VerificationRequest,
    userId: string
  ): Promise<ProofResult> {
    // Rate limiting
    if (!this.checkRateLimit(userId)) {
      throw new Error('Rate limit exceeded');
    }
    
    // Input validation
    this.validatePassportData(passportData);
    
    // Generate proof
    return this.generateNationalityProof(passportData, request);
  }
}
```

## 📊 Step 10: Performance Optimization

### Batch Verification:

```typescript
// src/batch-verifier.ts
export class BatchPassportVerifier extends PassportVerifier {
  // Verify multiple proofs in batch
  async verifyBatch(proofs: ProofResult[]): Promise<boolean[]> {
    const batchSize = 10; // Optimal batch size
    const results: boolean[] = [];
    
    for (let i = 0; i < proofs.length; i += batchSize) {
      const batch = proofs.slice(i, i + batchSize);
      const batchPromises = batch.map(proof => this.verifyProof(proof));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    
    return results;
  }
  
  // Generate multiple proofs efficiently
  async generateBatchProofs(
    passports: PassportData[],
    request: VerificationRequest
  ): Promise<ProofResult[]> {
    const proofs: ProofResult[] = [];
    
    // Process in parallel with concurrency limit
    const concurrencyLimit = 5;
    for (let i = 0; i < passports.length; i += concurrencyLimit) {
      const batch = passports.slice(i, i + concurrencyLimit);
      const batchPromises = batch.map(passport => 
        this.generateNationalityProof(passport, request)
      );
      const batchResults = await Promise.all(batchPromises);
      proofs.push(...batchResults);
    }
    
    return proofs;
  }
}
```

## 🚀 Step 11: Deployment and Integration

### Docker Setup:

```dockerfile
# Dockerfile
FROM rust:1.70 as builder

# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
RUN apt-get install -y nodejs

# Install Noir
RUN curl -L https://raw.githubusercontent.com/noir-lang/noirup/main/install | bash
RUN echo 'source ~/.bashrc' >> ~/.bash_profile
RUN source ~/.bash_profile && noirup

# Copy project files
WORKDIR /app
COPY . .

# Build the project
RUN source ~/.bash_profile && nargo build
RUN npm install
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app
COPY --from=builder /app/target ./target
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

EXPOSE 3000
CMD ["npm", "start"]
```

### API Integration:

```typescript
// src/api.ts
import express from 'express';
import { PassportVerifier } from './verifier';

const app = express();
const verifier = new PassportVerifier();

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Generate proof endpoint
app.post('/api/verify', async (req, res) => {
  try {
    const { passportData, request } = req.body;
    
    const proof = await verifier.generateNationalityProof(passportData, request);
    
    res.json({
      success: true,
      proof: proof.proof,
      publicInputs: proof.publicInputs,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Verify proof endpoint
app.post('/api/verify-proof', async (req, res) => {
  try {
    const { proofResult } = req.body;
    
    const isValid = await verifier.verifyProof(proofResult);
    
    res.json({
      success: true,
      isValid,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
```

## 📚 Resources and Next Steps

### Learning Resources:
- [Noir Documentation](https://noir-lang.org/)
- [Barretenberg Documentation](https://github.com/AztecProtocol/barretenberg)
- [Zero-Knowledge Proofs Guide](https://zkproof.org/)
- [Ethereum Privacy Solutions](https://ethereum.org/en/privacy/)

### Next Steps:
1. **Deploy to Mainnet**: Once thoroughly tested
2. **Add More Verification Types**: Age, residency, etc.
3. **Integrate with Real Passport APIs**: Government verification
4. **Build Frontend**: User-friendly web interface
5. **Add Multi-Chain Support**: Polygon, Arbitrum, etc.

## 🎉 Conclusion

You've successfully learned how to build a zero-knowledge passport verification system using Noir and Barretenberg! This system provides:

- **Complete Privacy**: No personal data is ever revealed
- **Mathematical Security**: Cryptographic guarantees
- **Scalability**: Can handle millions of verifications
- **Interoperability**: Works with any blockchain

The zero-knowledge approach revolutionizes how we handle identity verification, making it possible to prove facts about ourselves without compromising our privacy.

Happy building! 🔐✨
