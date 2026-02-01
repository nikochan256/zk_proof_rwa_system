# 🧠 zkProof RWA System — Private AI Agent Registration

A zero-knowledge–powered system that ensures **new AI agents are unique before registration**, without revealing any existing agent data.

This project combines **Merkle trees**, **Poseidon hashing**, **Circom zero-knowledge circuits**, and a **Stellar Soroban smart contract** to achieve **public verifiability with private guarantees**.

---

## ✨ Why This Exists

When registering AI agents (or digital entities in general):
- You must prevent duplicate registrations
- You must not expose the existing agent database
- You must not reveal which agents already exist

This system solves all three using **zero-knowledge non-membership proofs**.

Only **provably new AI agents** can be registered.

---

## 🔐 Zero-Knowledge Workflow

```
STEP 1: Existing AI Agents (Private)
["Agent 1", "Agent 2", "Agent 3"]
         ↓
  Poseidon Hashing
         ↓
[hash1, hash2, hash3, 0, 0, ...]
         ↓
Merkle Tree Construction
         ↓
  Merkle Root (public commitment)

STEP 2: New Agent Submission
"New AI Agent Description"
         ↓
  Poseidon Hash
         ↓
Check if already present

STEP 3: Zero-Knowledge Proof
The Circom circuit proves:
  ✓ An empty slot exists in the Merkle tree
  ✓ The new agent hash is different
  ✓ The Merkle root is valid
  ✓ No tree contents are revealed

Proof = (π_a, π_b, π_c)
Public Inputs = (root, agent_hash, valid_flag)

STEP 4: On-Chain Verification (Stellar)
Soroban smart contract receives proof result
         ↓
If valid → Register agent & update state
If invalid → Reject submission
```

---

## 📊 Complete System Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          OFF-CHAIN (PRIVATE)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────┐                    ┌──────────────────┐             │
│  │  Existing Agents │                    │  New Agent       │             │
│  │ ["A1", "A2",...] │                    │  Request         │             │
│  └────────┬─────────┘                    └────────┬─────────┘             │
│           │                                       │                        │
│           ▼                                       ▼                        │
│  ┌──────────────────┐                    ┌──────────────────┐             │
│  │ Poseidon Hashing │                    │ Poseidon Hashing │             │
│  └────────┬─────────┘                    └────────┬─────────┘             │
│           │                                       │                        │
│           ▼                                       ▼                        │
│  ┌──────────────────┐                    ┌──────────────────┐             │
│  │ [hash1, hash2,   │                    │  New Agent Hash  │             │
│  │  hash3, 0, 0...] │                    └────────┬─────────┘             │
│  └────────┬─────────┘                             │                        │
│           │                                       │                        │
│           ▼                                       ▼                        │
│  ┌──────────────────┐                    ┌──────────────────┐             │
│  │ Build Merkle     │                    │   Check if       │             │
│  │ Tree             │                    │   Duplicate?     │             │
│  └────────┬─────────┘                    └────────┬─────────┘             │
│           │                                       │                        │
│           │                          ┌────────────┴────────────┐           │
│           │                          │                         │           │
│           │                      NO (Continue)            YES (Reject)     │
│           │                          │                         │           │
│           ▼                          ▼                         ▼           │
│     ┌─────────────┐          ┌──────────────┐        ┌──────────────┐    │
│     │ Merkle Root │◄─────────┤ Generate ZK  │        │   REJECTED   │    │
│     │  (Public)   │          │ Proof Circuit│        │  (Duplicate) │    │
│     └─────┬───────┘          └──────┬───────┘        └──────────────┘    │
│           │                         │                                     │
│           │                         │                                     │
│           │          ┌──────────────▼──────────────┐                      │
│           │          │  Proof Output (π_a,π_b,π_c) │                      │
│           │          │  + Public Inputs            │                      │
│           │          └──────────────┬──────────────┘                      │
│           │                         │                                     │
└───────────┼─────────────────────────┼─────────────────────────────────────┘
            │                         │
            │                         │ Submit Proof
            │ Public Root             │
            │                         │
┌───────────┼─────────────────────────┼─────────────────────────────────────┐
│           │                         ▼                                     │
│           │              ┌──────────────────┐                             │
│           │              │ Stellar Soroban  │                             │
│           └─────────────►│ Smart Contract   │                             │
│                          │ Verify Proof     │                             │
│                          └────────┬─────────┘                             │
│                                   │                                       │
│                          ┌────────┴────────┐                              │
│                          │                 │                              │
│                      VALID            INVALID                             │
│                          │                 │                              │
│                          ▼                 ▼                              │
│                  ┌──────────────┐  ┌──────────────┐                       │
│                  │ Register     │  │   REJECT     │                       │
│                  │ New Agent    │  │ Registration │                       │
│                  └──────┬───────┘  └──────────────┘                       │
│                         │                                                 │
│                         ▼                                                 │
│                  ┌──────────────┐                                         │
│                  │ Update       │                                         │
│                  │ Merkle Root  │                                         │
│                  └──────┬───────┘                                         │
│                         │                                                 │
│                         ▼                                                 │
│                  ┌──────────────┐                                         │
│                  │ Emit Event   │                                         │
│                  │ ✅ Success   │                                         │
│                  └──────────────┘                                         │
│                                                                           │
│                    ON-CHAIN (PUBLIC - STELLAR)                            │
└───────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         🔒 PRIVACY GUARANTEES                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ✓ No Agent Data Exposed         ✓ No Tree Structure Revealed              │
│  ✓ No Existing Agents Leaked     ✓ Zero-Knowledge Verification             │
│  ✓ Public Auditability           ✓ Cryptographic Proof of Uniqueness       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🧩 System Architecture

### Off-Chain (Private)
- Agent descriptions
- Poseidon hashing
- Merkle tree construction
- Circom proof generation
- JavaScript orchestration

### On-Chain (Public)
- Merkle root storage
- Agent registry
- Duplicate prevention
- Proof result validation

**The blockchain never sees:**
- Agent descriptions
- Tree structure
- Proof internals

---

## 📂 Project Structure

```
zkproof-system/
│
├── circuits/
│   ├── non_membership.circom          # ZK non-membership circuit
│   ├── non_membership_js/             # Compiled circuit artifacts
│   │   ├── non_membership.wasm
│   │   └── witness_calculator.js
│   └── build/
│       ├── non_membership.r1cs        # Rank-1 Constraint System
│       ├── non_membership_0000.zkey   # Proving key
│       └── verification_key.json      # Verification key
│
├── contracts/
│   ├── src/
│   │   └── lib.rs                     # Soroban smart contract
│   ├── Cargo.toml
│   └── Cargo.lock
│
├── scripts/
│   ├── compile-circuit.js             # Compile Circom circuit
│   ├── generate-proof.js              # Generate ZK proofs
│   ├── verify-proof.js                # Verify proofs off-chain
│   ├── submit-proof.js                # Submit to Stellar
│   └── test-system.js                 # End-to-end testing
│
├── lib/
│   ├── merkle-tree.js                 # Merkle tree helpers
│   └── poseidon-hash.js               # Poseidon hashing utilities
│
├── tests/
│   ├── circuit.test.js                # Circuit unit tests
│   └── integration.test.js            # Full system tests
│
├── keys/
│   ├── proving_key.zkey               # ZK proving key
│   └── verification_key.json          # ZK verification key
│
├── package.json
├── package-lock.json
├── .env.example                       # Configuration template
└── Readme.md                          # This file
```

---

## 🛠️ Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **ZK Circuits** | Circom | Zero-knowledge proof generation |
| **Hashing** | Poseidon | ZK-friendly cryptographic hashing |
| **Data Structure** | Merkle Trees | Efficient membership verification |
| **Orchestration** | Node.js | Proof generation & coordination |
| **Blockchain** | Stellar Soroban | On-chain verification & registry |
| **Smart Contracts** | Rust | Soroban contract implementation |

---

## 🔒 Security Guarantees

- ✅ **Zero-knowledge privacy** — Agent data never exposed
- ✅ **Cryptographic non-membership proof** — Mathematical certainty
- ✅ **On-chain replay protection** — Prevents double registration
- ✅ **Tamper-resistant registry** — Immutable blockchain storage
- ✅ **Public verification** — Anyone can verify without seeing data

---

## 🚀 Quick Start

### Prerequisites
```bash
# Install Circom
curl -L https://github.com/iden3/circom/releases/latest/download/circom-linux-amd64 -o circom
chmod +x circom
sudo mv circom /usr/local/bin/

# Install Node.js dependencies
npm install

# Install Rust and Stellar CLI
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
cargo install --locked stellar-cli
```

### Setup Environment
```bash
# Copy environment template
cp .env.example .env

# Edit with your Stellar account details
nano .env
```

### Compile Circuit
```bash
# Compile the Circom circuit
node scripts/compile-circuit.js

# Generate proving and verification keys
npm run setup-keys
```

### Generate Proof
```bash
# Register a new AI agent
node scripts/generate-proof.js "New AI Agent Description"
```

### Verify Proof
```bash
# Verify proof locally before submission
node scripts/verify-proof.js
```

### Submit to Stellar
```bash
# Submit verified proof to blockchain
node scripts/submit-proof.js
```

---

## 📋 Usage Example

### JavaScript API

```javascript
const { buildMerkleTree, generateProof, verifyProof, submitToStellar } = require('./lib');

// 1. Initialize system with existing agents
const existingAgents = [
  "AI Trading Agent v1.0",
  "Customer Support Bot",
  "Content Generation Agent"
];

const merkleTree = buildMerkleTree(existingAgents);
console.log("Merkle Root:", merkleTree.root);

// 2. Attempt to register new agent
const newAgent = "Unique AI Research Assistant";

try {
  // Generate proof
  const proof = await generateProof(newAgent, merkleTree);
  console.log("Proof generated:", proof);

  // Verify locally
  const isValid = await verifyProof(proof);
  
  if (isValid) {
    // Submit to Stellar
    const txHash = await submitToStellar(proof);
    console.log("✅ Agent registered! Tx:", txHash);
  } else {
    console.log("❌ Invalid proof");
  }
  
} catch (error) {
  if (error.message === "DUPLICATE_AGENT") {
    console.log("❌ Agent already exists");
  } else {
    console.error("Error:", error);
  }
}
```

### Command Line Interface

```bash
# Register agent
./zkproof register "My AI Agent Description"

# Check if agent exists (returns only yes/no, no data exposed)
./zkproof check "My AI Agent Description"

# Get current Merkle root
./zkproof get-root

# Verify a proof file
./zkproof verify proof.json
```

---

## 🔍 How It Works

### 1. **Initial Setup (Off-Chain)**
```
Existing Agents → Poseidon Hash → Merkle Tree → Public Root
```

### 2. **Registration Request**
```
New Agent → Hash → Duplicate Check → ZK Proof Generation
```

### 3. **Proof Construction**
The Circom circuit proves:
- ✓ A valid empty slot exists at position `i` in the Merkle tree
- ✓ The Merkle path from slot `i` to root is valid
- ✓ `hash(newAgent) ≠ hash(existingAgent[j])` for all `j`
- ✓ The public Merkle root matches

**Without revealing:**
- Which agents exist
- Tree structure
- Position of empty slot

### 4. **On-Chain Verification**
```rust
// Soroban smart contract (simplified)
pub fn register_agent(
    env: Env,
    agent_hash: BytesN<32>,
    proof_valid: bool,
    new_root: BytesN<32>
) -> Result<(), Error> {
    // Verify proof result
    if !proof_valid {
        return Err(Error::InvalidProof);
    }
    
    // Check current root matches
    let current_root = get_merkle_root(&env);
    // ... verification logic ...
    
    // Register agent
    set_agent_registered(&env, agent_hash, true);
    set_merkle_root(&env, new_root);
    
    Ok(())
}
```

---

## ✅ Final Outcome

Only AI agents that are **cryptographically proven to be new** can be registered.

**Guarantees:**
- ❌ No duplicates possible
- ❌ No trust assumptions needed
- ❌ No data exposure occurs
- ✅ Public verifiability maintained
- ✅ Privacy fully preserved

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run circuit tests only
npm run test:circuit

# Run integration tests
npm run test:integration

# Run end-to-end system test
node scripts/test-system.js

# Generate test coverage
npm run coverage
```

### Test Scenarios

1. **Successful Registration** — New agent is accepted
2. **Duplicate Detection** — Existing agent is rejected
3. **Invalid Proof** — Malformed proof is rejected
4. **Root Mismatch** — Outdated Merkle root is rejected
5. **Concurrent Registrations** — Multiple agents registered simultaneously

---

## 📌 Future Extensions

- [ ] **Merkle Root Upgrades** — Automatic tree rebalancing
- [ ] **Multi-Agent Batch Proofs** — Register multiple agents in one proof
- [ ] **Cross-Chain Proof Anchoring** — Verify on multiple blockchains
- [ ] **Decentralized Agent Marketplaces** — Trading verified agents
- [ ] **IPFS Integration** — Store agent metadata off-chain
- [ ] **Recursive Proof Composition** — Combine multiple proofs
- [ ] **Agent Reputation System** — Track agent performance on-chain
- [ ] **Revocation Mechanism** — Deregister agents with ZK proof
- [ ] **Time-Locked Registrations** — Temporary agent slots
- [ ] **Hierarchical Agent Trees** — Parent-child agent relationships

---

## 📚 Resources

### Documentation
- [Circom Documentation](https://docs.circom.io/)
- [Stellar Soroban Docs](https://soroban.stellar.org/)
- [Poseidon Hash Specification](https://eprint.iacr.org/2019/458.pdf)

### Related Papers
- [Zero-Knowledge Proofs: An Illustrated Primer](https://blog.cryptographyengineering.com/2014/11/27/zero-knowledge-proofs-illustrated-primer/)
- [Merkle Trees and Their Applications](https://brilliant.org/wiki/merkle-tree/)

---

## 🤝 Contributing

Contributions welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

### Development Setup
```bash
# Fork and clone the repo
git clone https://github.com/yourusername/zkproof-system.git
cd zkproof-system

# Install dependencies
npm install

# Create a feature branch
git checkout -b feature/your-feature

# Make your changes and test
npm test

# Submit a pull request
```

---

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details

---

## 🙏 Acknowledgments

- Circom team for zero-knowledge circuit tools
- Stellar Foundation for Soroban smart contracts
- iden3 for Poseidon hash implementation

---

## 📧 Contact

- **Issues:** [GitHub Issues](https://github.com/yourusername/zkproof-system/issues)
- **Discussions:** [GitHub Discussions](https://github.com/yourusername/zkproof-system/discussions)
- **Email:** your.email@example.com

---

**Publicly verified. Privately proven.**

🔐 Zero-Knowledge | 🌟 Stellar Soroban | 🌲 Merkle Trees | ⚡ Circom

---

*Built with privacy, secured by mathematics, verified by everyone.*
