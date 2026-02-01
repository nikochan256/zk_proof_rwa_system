const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');

const execAsync = promisify(exec);

async function checkCommand(command, name) {
               try {
                              await execAsync(command);
                              console.log(`  ✅ ${name} - Installed`);
                              return true;
               } catch (error) {
                              console.log(`  ❌ ${name} - Not found`);
                              return false;
               }
}

async function checkFile(filepath, name) {
               const exists = fs.existsSync(filepath);
               console.log(`  ${exists ? '✅' : '❌'} ${name} - ${exists ? 'Found' : 'Missing'}`);
               return exists;
}

async function checkSystemStatus() {
               console.log('🔍 Stellar X-Ray ZK Proof System - Status Check\n');
               console.log('='.repeat(70));

               // Check Prerequisites
               console.log('\n📋 Prerequisites:');
               const rustOk = await checkCommand('rustc --version', 'Rust');
               const cargoOk = await checkCommand('cargo --version', 'Cargo');
               const stellarOk = await checkCommand('stellar --version', 'Stellar CLI');
               const circomOk = await checkCommand('circom --version', 'Circom');
               const nodeOk = await checkCommand('node --version', 'Node.js');
               const npmOk = await checkCommand('npm --version', 'npm');

               // Check Docker
               console.log('\n🐳 Docker:');
               try {
                              const { stdout } = await execAsync('docker ps');
                              if (stdout.includes('stellar')) {
                                             console.log('  ✅ Stellar container - Running');
                                             console.log('  ✅ Port 8000 - Available for RPC');
                              } else {
                                             console.log('  ⚠️  Stellar container - Not running');
                                             console.log('     Start with: docker start stellar');
                              }
               } catch (error) {
                              console.log('  ❌ Docker - Not running or not installed');
               }

               // Check Node Modules
               console.log('\n📦 Node Dependencies:');
               const nodeModulesOk = await checkFile(
                              path.join(__dirname, '../node_modules'),
                              'node_modules'
               );

               if (!nodeModulesOk) {
                              console.log('     Run: npm install');
               } else {
                              const circomlibOk = await checkFile(
                                             path.join(__dirname, '../node_modules/circomlib'),
                                             'circomlib'
                              );
                              const snarkjsOk = await checkFile(
                                             path.join(__dirname, '../node_modules/snarkjs'),
                                             'snarkjs'
                              );
               }

               // Check Build Artifacts
               console.log('\n🔨 Build Artifacts:');
               const buildDir = path.join(__dirname, '../build');

               const r1csOk = await checkFile(
                              path.join(buildDir, 'non_membership.r1cs'),
                              'R1CS (compiled circuit)'
               );
               const wasmOk = await checkFile(
                              path.join(buildDir, 'non_membership_js/non_membership.wasm'),
                              'WASM (witness calculator)'
               );
               const zkeyOk = await checkFile(
                              path.join(buildDir, 'non_membership_final.zkey'),
                              'Proving Key (zkey)'
               );
               const vkeyOk = await checkFile(
                              path.join(buildDir, 'verification_key.json'),
                              'Verification Key'
               );
               const proofOk = await checkFile(
                              path.join(buildDir, 'proof.json'),
                              'Generated Proof'
               );
               const publicOk = await checkFile(
                              path.join(buildDir, 'public.json'),
                              'Public Signals'
               );

               if (!r1csOk || !wasmOk) {
                              console.log('\n     Run: npm run compile');
               }
               if (!zkeyOk || !vkeyOk) {
                              console.log('     Run: npm run setup');
               }
               if (!proofOk || !publicOk) {
                              console.log('     Run: npm run generate-proof');
               }

               // Check Contract Artifacts
               console.log('\n📜 Smart Contract:');
               const contractSrc = await checkFile(
                              path.join(__dirname, '../contracts/src/lib.rs'),
                              'Contract Source'
               );
               const contractWasm = await checkFile(
                              path.join(__dirname, '../contracts/target/wasm32-unknown-unknown/release/zkproof_verifier.wasm'),
                              'Contract WASM'
               );

               if (contractSrc && !contractWasm) {
                              console.log('     Build contract: cd contracts && cargo build --target wasm32-unknown-unknown --release');
               }

               // Check Deployment Config
               console.log('\n🚀 Deployment:');
               const configDir = path.join(__dirname, '../config');
               const deploymentOk = await checkFile(
                              path.join(configDir, 'deployment.json'),
                              'Deployment Config'
               );

               if (deploymentOk) {
                              const deployment = JSON.parse(fs.readFileSync(
                                             path.join(configDir, 'deployment.json'),
                                             'utf8'
                              ));
                              console.log(`     Contract ID: ${deployment.contractId}`);
                              console.log(`     Network: ${deployment.network}`);
                              console.log(`     Deployed: ${deployment.deployedAt}`);
               } else {
                              console.log('     Run: ./scripts/deploy-contract.sh');
               }

               // Overall Status
               console.log('\n' + '='.repeat(70));
               console.log('📊 Overall Status:\n');

               const prereqsReady = rustOk && cargoOk && stellarOk && circomOk && nodeOk && npmOk;
               const buildReady = r1csOk && wasmOk && zkeyOk && vkeyOk;
               const proofReady = proofOk && publicOk;
               const deployReady = deploymentOk;

               if (prereqsReady && buildReady && proofReady && deployReady) {
                              console.log('  🎉 System is FULLY OPERATIONAL!');
                              console.log('     Ready to generate and verify proofs on-chain.');
                              console.log('\n  Quick Commands:');
                              console.log('     - Generate new proof: npm run generate-proof');
                              console.log('     - Verify locally: npm run verify-proof');
                              console.log('     - Submit on-chain: npm run submit-proof');
               } else if (prereqsReady && buildReady && proofReady) {
                              console.log('  ⚠️  System is PARTIALLY READY');
                              console.log('     Off-chain proof generation working.');
                              console.log('     Deploy contract for on-chain verification.');
                              console.log('\n  Next Step:');
                              console.log('     ./scripts/deploy-contract.sh');
               } else if (prereqsReady && buildReady) {
                              console.log('  ⚠️  System is PARTIALLY BUILT');
                              console.log('     Circuit compiled and setup complete.');
                              console.log('\n  Next Step:');
                              console.log('     npm run generate-proof');
               } else if (prereqsReady && nodeModulesOk) {
                              console.log('  ⚠️  System NEEDS BUILDING');
                              console.log('     Prerequisites installed.');
                              console.log('\n  Next Steps:');
                              console.log('     1. npm run compile');
                              console.log('     2. npm run setup (takes 2-5 minutes)');
               } else if (prereqsReady) {
                              console.log('  ⚠️  Dependencies NEEDED');
                              console.log('     Prerequisites installed.');
                              console.log('\n  Next Step:');
                              console.log('     npm install');
               } else {
                              console.log('  ❌ System NOT READY');
                              console.log('     Missing prerequisites.');
                              console.log('\n  Install missing tools first!');
               }

               console.log('\n' + '='.repeat(70));

               // Recommendations
               console.log('\n💡 Recommendations:\n');

               if (!prereqsReady) {
                              console.log('  1. Install all prerequisites (Rust, Stellar CLI, Circom, etc.)');
               }
               if (prereqsReady && !nodeModulesOk) {
                              console.log('  1. Run: npm install');
               }
               if (prereqsReady && nodeModulesOk && !buildReady) {
                              console.log('  1. Run complete demo: npm run demo');
                              console.log('     (This will compile, setup, generate, and verify)');
               }
               if (prereqsReady && buildReady && !deployReady) {
                              console.log('  1. Deploy contract: ./scripts/deploy-contract.sh');
                              console.log('  2. Submit proof: npm run submit-proof');
               }
               if (prereqsReady && buildReady && deployReady) {
                              console.log('  ✨ System ready! Try customizing:');
                              console.log('     - AI agent descriptions in scripts/generate-proof.js');
                              console.log('     - Circuit depth in circuits/non_membership.circom');
                              console.log('     - Contract logic in contracts/src/lib.rs');
               }

               console.log('\n📚 Documentation:');
               console.log('  - Quick Start: QUICKSTART.md');
               console.log('  - Full Guide: README.md');
               console.log('  - Run demo: npm run demo');
}

checkSystemStatus().catch(error => {
               console.error('Error checking status:', error);
});