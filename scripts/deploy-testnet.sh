#!/bin/bash

echo "🚀 Deploying ZK Proof Verifier to Stellar TESTNET"
echo "================================================================"

# Configuration for TESTNET
NETWORK="testnet"
RPC_URL="https://soroban-testnet.stellar.org"
NETWORK_PASSPHRASE="Test SDF Network ; September 2015"

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

if stellar keys show deployer-testnet 2>/dev/null; then
    echo "✅ Using existing 'deployer-testnet' identity"
else
    echo "Creating new 'deployer-testnet' identity..."
    stellar keys generate deployer-testnet --network $NETWORK
    echo "✅ Identity created"
fi

DEPLOYER_ADDRESS=$(stellar keys address deployer-testnet)
echo "   Deployer address: $DEPLOYER_ADDRESS"

# Step 4: Fund the account from Friendbot
echo ""
echo "Step 4: Funding account from Friendbot..."
echo "   This may take a moment..."

curl "https://friendbot.stellar.org?addr=$DEPLOYER_ADDRESS"
sleep 3

echo ""
echo "✅ Account funded with testnet XLM"

# Step 5: Deploy the contract
echo ""
echo "Step 5: Deploying contract to Stellar TESTNET..."
echo "   Network: $NETWORK"
echo "   RPC URL: $RPC_URL"

CONTRACT_ID=$(stellar contract deploy \
    --wasm "contracts/$WASM_PATH" \
    --source deployer-testnet \
    --network $NETWORK 2>&1 | grep -oE 'C[A-Z0-9]{55}')

if [ -z "$CONTRACT_ID" ]; then
    echo "❌ Deployment failed!"
    exit 1
fi

echo "✅ Contract deployed successfully!"
echo "   Contract ID: $CONTRACT_ID"

# Step 6: Save configuration
echo ""
echo "Step 6: Saving testnet configuration..."
mkdir -p config

cat > config/deployment-testnet.json << EOF
{
  "contractId": "$CONTRACT_ID",
  "deployerAddress": "$DEPLOYER_ADDRESS",
  "network": "$NETWORK",
  "rpcUrl": "$RPC_URL",
  "networkPassphrase": "$NETWORK_PASSPHRASE",
  "deployedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

echo "✅ Configuration saved to config/deployment-testnet.json"

# Final summary
echo ""
echo "================================================================"
echo "🎉 TESTNET Deployment Complete! 🎉"
echo "================================================================"
echo ""
echo "Contract Details:"
echo "  ID: $CONTRACT_ID"
echo "  Network: Stellar Testnet"
echo "  Explorer: https://stellar.expert/explorer/testnet/contract/$CONTRACT_ID"
echo "  Deployer: $DEPLOYER_ADDRESS"
echo ""
echo "Next Steps:"
echo "  1. Submit proof: npm run submit-proof-testnet"
echo "  2. View on explorer: https://stellar.expert/explorer/testnet"
echo ""