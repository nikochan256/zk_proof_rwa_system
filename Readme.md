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

The blockchain never sees:
- Agent descriptions
- Tree structure
- Proof internals

---

## 📂 Project Structure

zkproof-system/
├── circuits/
│ └── non_membership.circom # ZK non-membership circuit
│
├── contracts/
│ ├── src/
│ │ └── lib.rs # Soroban smart contract
│ └── Cargo.toml
│
├── scripts/
│ ├── compile-circuit.js
│ ├── generate-proof.js
│ ├── verify-proof.js
│ ├── submit-proof.js
│ └── test-system.js
│
├── lib/
│ └── merkle-tree.js # Merkle tree helpers
│
├── non_membership.r1cs # Compiled circuit
├── package.json
├── package-lock.json
└── Readme.md


---

## 🛠️ Technology Stack

- **Circom** — Zero-knowledge circuit design
- **Poseidon Hash** — ZK-friendly hashing
- **Merkle Trees** — Efficient membership checks
- **Node.js** — Proof orchestration
- **Stellar Soroban** — On-chain verification and registry

---

## 🔒 Security Guarantees

- Zero-knowledge privacy
- Cryptographic non-membership proof
- On-chain replay protection
- Tamper-resistant registry
- Public verification without data leakage

---

## ✅ Final Outcome

Only AI agents that are **cryptographically proven to be new** can be registered.

No duplicates.  
No trust assumptions.  
No data exposure.

---

## 🚀 Status

- ZK circuit implemented
- Soroban smart contract deployed on Stellar testnet
- End-to-end proof → verification pipeline working

---

## 📌 Future Extensions

- Merkle root upgrades
- Multi-agent batch proofs
- Cross-chain proof anchoring
- Decentralized agent marketplaces

---

**Publicly verified. Privately proven.**
