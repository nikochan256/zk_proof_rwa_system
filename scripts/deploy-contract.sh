#!/bin/bash

echo "🚀 Building and Deploying ZK Proof Verifier to Stellar (X-Ray Protocol)"
echo "========================================================================"

# Configuration
NETWORK="local"
RPC_URL="http://localhost:8000/soroban/rpc"
NETWORK_PASSPHRASE="Standalone Network ; February 2017"

# Step 1: Build the contract
echo ""
echo "Step 1: Building Soroban contract..."
cd contracts
cargo build --target wasm32-unknown-unknown --release

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Contract built successfully"

# Step 2: Optimize the WASM
echo ""
echo "Step 2: Optimizing WASM..."
stellar contract optimize \
    --wasm target/wasm32-unknown-unknown/release/zkproof_verifier.wasm \
    --wasm-out target/wasm32-unknown-unknown/release/zkproof_verifier_optimized.wasm

if [ $? -ne 0 ]; then
    echo "⚠️  Optimization failed, using unoptimized WASM"
    WASM_PATH="target/wasm32-unknown-unknown/release/zkproof_verifier.wasm"
else
    echo "✅ WASM optimized"
    WASM_PATH="target/wasm32-unknown-unknown/release/zkproof_verifier_optimized.wasm"
fi

cd ..

# Step 3: Generate keypair for deployment
echo ""
echo "Step 3: Setting up deployment identity..."

# Check if identity already exists
if stellar keys show deployer 2>/dev/null; then
    echo "✅ Using existing 'deployer' identity"
else
    echo "Creating new 'deployer' identity..."
    stellar keys generate deployer --network $NETWORK
    echo "✅ Identity created"
fi

DEPLOYER_ADDRESS=$(stellar keys address deployer)
echo "   Deployer address: $DEPLOYER_ADDRESS"

# Step 4: Fund the account (local network only)
echo ""
echo "Step 4: Funding deployer account..."
stellar keys fund deployer --network $NETWORK

if [ $? -ne 0 ]; then
    echo "❌ Failed to fund account"
    exit 1
fi

echo "✅ Account funded"

# Step 5: Deploy the contract
echo ""
echo "Step 5: Deploying contract to Stellar network..."
echo "   Network: $NETWORK"
echo "   RPC URL: $RPC_URL"
echo "   Protocol: X-Ray (25)"

CONTRACT_ID=$(stellar contract deploy \
    --wasm "contracts/$WASM_PATH" \
    --source deployer \
    --network $NETWORK 2>&1 | grep -oE 'C[A-Z0-9]{55}')

if [ -z "$CONTRACT_ID" ]; then
    echo "❌ Deployment failed!"
    echo "Make sure your local Stellar network is running:"
    echo "   docker run -d -p 8000:8000 --name stellar stellar/quickstart:testing --local"
    exit 1
fi

echo "✅ Contract deployed successfully!"
echo "   Contract ID: $CONTRACT_ID"

# Step 6: Save contract ID for later use
echo ""
echo "Step 6: Saving contract configuration..."
mkdir -p config
echo "$CONTRACT_ID" > config/contract_id.txt
echo "$DEPLOYER_ADDRESS" > config/deployer_address.txt

cat > config/deployment.json << EOF
{
  "contractId": "$CONTRACT_ID",
  "deployerAddress": "$DEPLOYER_ADDRESS",
  "network": "$NETWORK",
  "rpcUrl": "$RPC_URL",
  "networkPassphrase": "$NETWORK_PASSPHRASE",
  "deployedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

echo "✅ Configuration saved to config/"

# Step 7: Test contract is accessible
echo ""
echo "Step 7: Verifying contract deployment..."

# Try to invoke a simple contract function
stellar contract invoke \
    --id "$CONTRACT_ID" \
    --source deployer \
    --network $NETWORK \
    -- get_merkle_root > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Contract is accessible and responding"
else
    echo "⚠️  Contract deployed but may not be fully initialized"
fi

# Final summary
echo ""
echo "========================================================================"
echo "🎉 Deployment Complete! 🎉"
echo "========================================================================"
echo ""
echo "Contract Details:"
echo "  ID: $CONTRACT_ID"
echo "  Network: $NETWORK (X-Ray Protocol 25)"
echo "  Deployer: $DEPLOYER_ADDRESS"
echo ""
echo "Next Steps:"
echo "  1. Generate a ZK proof: npm run generate-proof"
echo "  2. Submit proof to contract using: npm run submit-proof"
echo "  3. Verify proof on-chain"
echo ""
echo "Contract Functions Available:"
echo "  - verify_non_membership: Verify ZK proof of AI agent non-membership"
echo "  - register_agent: Register new AI agent after verification"
echo "  - get_merkle_root: Get current Merkle tree root"
echo "  - is_agent_registered: Check if agent is registered"
echo ""