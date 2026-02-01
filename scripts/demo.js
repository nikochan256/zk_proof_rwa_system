const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');

const execAsync = promisify(exec);

async function runCommand(command, description) {
               console.log(`\n🔧 ${description}...`);
               console.log(`   Command: ${command.slice(0, 60)}${command.length > 60 ? '...' : ''}`);

               try {
                              const { stdout, stderr } = await execAsync(command);
                              if (stdout) console.log(stdout);
                              if (stderr && !stderr.includes('warning')) console.warn('⚠️ ', stderr);
                              console.log(`✅ ${description} - Complete`);
                              return true;
               } catch (error) {
                              console.error(`❌ ${description} - Failed:`, error.message);
                              return false;
               }
}

async function demo() {
               console.log('🎬 Stellar X-Ray ZK Proof System - Complete Demo');
               console.log('='.repeat(80));
               console.log('\nThis demo will walk you through the entire ZK proof workflow:');
               console.log('  1. Compile the Circom circuit');
               console.log('  2. Run trusted setup ceremony');
               console.log('  3. Generate a proof of AI agent non-membership');
               console.log('  4. Verify the proof locally');
               console.log('  5. (Optional) Deploy to Stellar and verify on-chain');
               console.log('\n' + '='.repeat(80));

               // Wait for user
               console.log('\n⏳ Starting in 3 seconds...\n');
               await new Promise(resolve => setTimeout(resolve, 3000));

               // Phase 1: Compilation
               console.log('\n' + '═'.repeat(80));
               console.log('PHASE 1: CIRCUIT COMPILATION');
               console.log('═'.repeat(80));

               const compiled = await runCommand('node scripts/compile-circuit.js', 'Compiling Circom circuit to R1CS and WASM');

               if (!compiled) {
                              console.error('\n❌ Compilation failed. Please check your Circom installation.');
                              console.error('Make sure circom is in your PATH (System32 folder)');
                              process.exit(1);
               }

               // Phase 2: Trusted Setup
               console.log('\n' + '═'.repeat(80));
               console.log('PHASE 2: TRUSTED SETUP CEREMONY');
               console.log('═'.repeat(80));
               console.log('\n⚠️  This step takes 2-5 minutes. Please be patient...\n');

               const setup = await runCommand('node scripts/setup-ceremony.js', 'Running Powers of Tau ceremony');

               if (!setup) {
                              console.error('\n❌ Trusted setup failed.');
                              process.exit(1);
               }

               // Phase 3: Proof Generation
               console.log('\n' + '═'.repeat(80));
               console.log('PHASE 3: PROOF GENERATION');
               console.log('═'.repeat(80));

               const generated = await runCommand('node scripts/generate-proof.js', 'Generating ZK proof of non-membership');

               if (!generated) {
                              console.error('\n❌ Proof generation failed.');
                              process.exit(1);
               }

               // Phase 4: Local Verification
               console.log('\n' + '═'.repeat(80));
               console.log('PHASE 4: LOCAL VERIFICATION');
               console.log('═'.repeat(80));

               const verified = await runCommand('node scripts/verify-proof.js', 'Verifying proof locally');

               if (!verified) {
                              console.error('\n❌ Proof verification failed.');
                              process.exit(1);
               }

               // Phase 5: Complete Test Suite
               console.log('\n' + '═'.repeat(80));
               console.log('PHASE 5: COMPREHENSIVE TESTING');
               console.log('═'.repeat(80));

               const tested = await runCommand('node scripts/test-system.js', 'Running complete test suite');

               if (!tested) {
                              console.error('\n❌ Tests failed.');
                              process.exit(1);
               }

               // Final Summary
               console.log('\n' + '═'.repeat(80));
               console.log('🎉 DEMO COMPLETE - ALL PHASES SUCCESSFUL! 🎉');
               console.log('═'.repeat(80));

               console.log('\n📊 Summary:');
               console.log('  ✅ Circuit compiled successfully');
               console.log('  ✅ Trusted setup completed');
               console.log('  ✅ ZK proof generated');
               console.log('  ✅ Proof verified locally');
               console.log('  ✅ All tests passed');
               console.log('  ✅ BN254 compatibility confirmed');

               console.log('\n🚀 Ready for Stellar Deployment!');
               console.log('\nNext Steps for On-Chain Verification:');
               console.log('  1. Make sure Docker Desktop is running');
               console.log('  2. Verify Stellar network is running:');
               console.log('     docker ps | grep stellar');
               console.log('  3. Deploy the smart contract (in Git Bash/WSL):');
               console.log('     chmod +x scripts/deploy-contract.sh');
               console.log('     ./scripts/deploy-contract.sh');
               console.log('  4. Submit proof on-chain:');
               console.log('     npm run submit-proof');

               console.log('\n📁 Generated Files:');
               console.log('  - build/non_membership.r1cs (constraint system)');
               console.log('  - build/non_membership.wasm (witness calculator)');
               console.log('  - build/non_membership_final.zkey (proving key)');
               console.log('  - build/verification_key.json (verification key)');
               console.log('  - build/proof.json (generated proof)');
               console.log('  - build/public.json (public signals)');

               console.log('\n💡 What You Just Proved:');
               console.log('  Your ZK proof cryptographically demonstrates that a specific AI agent');
               console.log('  description does NOT exist in your Merkle tree database, without');
               console.log('  revealing any information about which other agents ARE in the database.');
               console.log('  This proof is ready to be verified on the Stellar blockchain using');
               console.log('  X-Ray Protocol\'s native BN254 pairing functions!');

               console.log('\n📚 Learn More:');
               console.log('  - Check README.md for detailed documentation');
               console.log('  - View circuits/non_membership.circom for circuit logic');
               console.log('  - See contracts/src/lib.rs for Soroban smart contract');

               console.log('\n' + '═'.repeat(80));
}

// Run demo
demo().catch(error => {
               console.error('\n❌ Demo failed:', error);
               process.exit(1);
});