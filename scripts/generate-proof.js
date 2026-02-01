const snarkjs = require('snarkjs');
const path = require('path');
const fs = require('fs');
const { MerkleTree } = require('../lib/merkle-tree');

async function generateProof() {
    console.log('🔐 Generating ZK proof for AI agent non-membership...\n');

    const buildDir = path.join(__dirname, '../build');
    const zkeyPath = path.join(buildDir, 'non_membership_final.zkey');
    // Ensure this path matches the folder name created by your circom compile
    const wasmPath = path.join(buildDir, 'non_membership_js/non_membership.wasm');

    // 1. Check if required infrastructure files exist
    if (!fs.existsSync(zkeyPath)) {
        console.error('❌ Proving key not found at:', zkeyPath);
        console.error('👉 Run "npm run setup" first.');
        process.exit(1);
    }

    if (!fs.existsSync(wasmPath)) {
        console.error('❌ WASM file not found at:', wasmPath);
        console.error('👉 Run "npm run compile" first.');
        process.exit(1);
    }

    try {
        // Step 1: Initialize Merkle tree
        console.log('Step 1: Initializing Merkle tree with existing AI agents...');
        const tree = await new MerkleTree(8).init();

        const existingAgents = [
            "AI Assistant for Customer Support - Handles common queries",
            "Code Review Bot - Analyzes pull requests for best practices",
            "Data Analysis Agent - Processes CSV files and generates insights"
        ];

        console.log('\nExisting AI agents:');
        existingAgents.forEach((agent, idx) => {
            const hash = tree.hashString(agent);
            tree.insertLeaf(idx, hash);
            console.log(`  [${idx}] ${agent.slice(0, 40)}... (hash: ${hash.toString().slice(0, 16)}...)`);
        });

        const root = tree.buildTree();
        console.log('\n✅ Merkle tree built');
        console.log(`   Root: ${root.toString()}`);

        // Step 2: Define the non-member agent
        const newAgentDescription = "Marketing Content Generator - Creates social media posts";
        const newAgentHash = tree.hashString(newAgentDescription);

        console.log(`\n📝 Checking new agent: "${newAgentDescription}"`);
        const exists = tree.hasValue(newAgentHash);

        if (exists) {
            console.log('\n⚠️ Agent already exists! No proof needed.');
            return;
        }

        // Step 3: Prepare non-membership proof inputs
        const emptySlotIndex = tree.findEmptySlot();
        if (emptySlotIndex === -1) {
            throw new Error('No empty slots available in tree');
        }

        const mProof = tree.getProof(emptySlotIndex);
        const input = {
            root: mProof.root.toString(),
            agentDescriptionHash: newAgentHash.toString(),
            siblings: mProof.siblings.map(s => s.toString()),
            pathIndices: mProof.pathIndices.map(p => p.toString()),
            leafHash: mProof.leaf.toString()
        };

        // Step 4: Generate the proof using snarkjs
        console.log('\n🚀 Starting ZK-SNARK generation (Groth16)...');
        console.log('--- SNARKJS LOG START ---');
        
        // Passing 'console' as the 4th argument enables verbose logging
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            input,
            wasmPath,
            zkeyPath,
            console 
        );
        
        console.log('--- SNARKJS LOG END ---\n');
        console.log('✅ Proof generated successfully!');

        // Step 5: Save outputs
        const proofPath = path.join(buildDir, 'proof.json');
        const publicPath = path.join(buildDir, 'public.json');

        fs.writeFileSync(proofPath, JSON.stringify(proof, null, 2));
        fs.writeFileSync(publicPath, JSON.stringify(publicSignals, null, 2));

        console.log(`💾 Files saved: \n - ${proofPath}\n - ${publicPath}`);
        
        // Final Status for Stellar X-Ray
        console.log('\n✅ System Ready for Stellar Submission.');
        return { proof, publicSignals };

    } catch (error) {
        console.error('\n❌ Proof generation failed!');
        console.error('Error Details:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    generateProof().then(() => process.exit(0));
}

module.exports = { generateProof };