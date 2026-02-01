const snarkjs = require('snarkjs');
const path = require('path');
const fs = require('fs');

async function verifyProof() {
    console.log('🔍 Verifying ZK proof locally...\n');

    const buildDir = path.join(__dirname, '../build');
    const vkeyPath = path.join(buildDir, 'verification_key.json');
    const proofPath = path.join(buildDir, 'proof.json');
    const publicPath = path.join(buildDir, 'public.json');

    // 1. Safety Checks
    if (!fs.existsSync(vkeyPath)) {
        console.error('❌ Verification key not found. Run "npm run setup" first.');
        process.exit(1);
    }
    if (!fs.existsSync(proofPath) || !fs.existsSync(publicPath)) {
        console.error('❌ Proof files not found. Run "npm run generate-proof" first.');
        process.exit(1);
    }

    try {
        // 2. Load Data
        const vkey = JSON.parse(fs.readFileSync(vkeyPath, 'utf8'));
        const proof = JSON.parse(fs.readFileSync(proofPath, 'utf8'));
        const publicSignals = JSON.parse(fs.readFileSync(publicPath, 'utf8'));

        console.log('📋 Loaded verification data successfully.');
        console.log(`   Root: ${publicSignals[0].slice(0, 20)}...`);
        console.log(`   Agent Hash: ${publicSignals[1].slice(0, 20)}...`);
        console.log(`   Non-Member Status: ${publicSignals[2] === "1" ? "True" : "False"}`);

        // 3. Verify the proof with Logging
        console.log('\n🎬 Starting cryptographic verification...');
        console.log('--- SNARKJS VERIFY LOG START ---');
        
        // The logger (console) is passed as the 4th argument
        const isValid = await snarkjs.groth16.verify(
            vkey, 
            publicSignals, 
            proof, 
            console 
        );

        console.log('--- SNARKJS VERIFY LOG END ---\n');

        if (isValid) {
            console.log('✅ PROOF IS VALID! ✅');
            console.log('\nVerified via Stellar X-Ray logic:');
            console.log(' - Agent is unique/not in set.');
            console.log(' - Merkle integrity confirmed.');
        } else {
            console.log('❌ PROOF IS INVALID! ❌');
            process.exit(1);
        }

        return isValid;

    } catch (error) {
        console.error('❌ Verification failed with error:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    verifyProof().then(() => process.exit(0));
}

module.exports = { verifyProof };