const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');

const execAsync = promisify(exec);

async function submitProof() {
               console.log('📤 Submitting ZK Proof to Stellar Smart Contract\n');
               console.log('='.repeat(70));

               const buildDir = path.join(__dirname, '../build');
               const configDir = path.join(__dirname, '../config');

               // Load configuration
               const deploymentPath = path.join(configDir, 'deployment.json');
               if (!fs.existsSync(deploymentPath)) {
                              console.error('❌ Deployment config not found. Please run deploy-contract.sh first.');
                              process.exit(1);
               }

               const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
               console.log('📋 Deployment Configuration:');
               console.log(`   Contract ID: ${deployment.contractId}`);
               console.log(`   Network: ${deployment.network}`);
               console.log(`   RPC URL: ${deployment.rpcUrl}`);

               // Load proof data
               const proofPath = path.join(buildDir, 'proof.json');
               const publicPath = path.join(buildDir, 'public.json');

               if (!fs.existsSync(proofPath) || !fs.existsSync(publicPath)) {
                              console.error('❌ Proof files not found. Please run "npm run generate-proof" first.');
                              process.exit(1);
               }

               const proof = JSON.parse(fs.readFileSync(proofPath, 'utf8'));
               const publicSignals = JSON.parse(fs.readFileSync(publicPath, 'utf8'));

               console.log('\n📊 Proof Data Loaded:');
               console.log(`   Public signals: ${publicSignals.length}`);
               console.log(`   Root: ${publicSignals[0].slice(0, 30)}...`);
               console.log(`   Agent Hash: ${publicSignals[1].slice(0, 30)}...`);
               console.log(`   Is Non-Member: ${publicSignals[2]}`);

               try {
                              // Convert proof points to hex format for Soroban
                              console.log('\n🔄 Converting proof to Soroban format...');

                              // Helper function to convert big number string to 32-byte hex
                              const toHex32 = (numStr) => {
                                             // Remove any leading zeros from the number string
                                             const bn = BigInt(numStr);
                                             let hex = bn.toString(16);
                                             // Pad to 64 characters (32 bytes)
                                             hex = hex.padStart(64, '0');
                                             return '0x' + hex;
                              };

                              // Extract proof components
                              const proof_a_x = toHex32(proof.pi_a[0]);
                              const proof_a_y = toHex32(proof.pi_a[1]);

                              const proof_b_x0 = toHex32(proof.pi_b[0][0]);
                              const proof_b_x1 = toHex32(proof.pi_b[0][1]);
                              const proof_b_y0 = toHex32(proof.pi_b[1][0]);
                              const proof_b_y1 = toHex32(proof.pi_b[1][1]);

                              const proof_c_x = toHex32(proof.pi_c[0]);
                              const proof_c_y = toHex32(proof.pi_c[1]);

                              // Public inputs
                              const public_root = toHex32(publicSignals[0]);
                              const public_agent_hash = toHex32(publicSignals[1]);
                              const public_is_non_member = publicSignals[2];

                              console.log('✅ Proof converted to Soroban format');

                              // Submit proof to contract
                              console.log('\n📡 Submitting proof to Stellar contract...');
                              console.log('   This may take a moment...\n');

                              const invokeCmd = `stellar contract invoke \\
            --id ${deployment.contractId} \\
            --source deployer \\
            --network ${deployment.network} \\
            -- verify_non_membership \\
            --proof_a_x "${proof_a_x}" \\
            --proof_a_y "${proof_a_y}" \\
            --proof_b_x0 "${proof_b_x0}" \\
            --proof_b_x1 "${proof_b_x1}" \\
            --proof_b_y0 "${proof_b_y0}" \\
            --proof_b_y1 "${proof_b_y1}" \\
            --proof_c_x "${proof_c_x}" \\
            --proof_c_y "${proof_c_y}" \\
            --public_root "${public_root}" \\
            --public_agent_hash "${public_agent_hash}" \\
            --public_is_non_member ${public_is_non_member}`;

                              console.log('Command:', invokeCmd.slice(0, 100) + '...\n');

                              const { stdout, stderr } = await execAsync(invokeCmd);

                              if (stderr && !stderr.includes('warning')) {
                                             console.error('⚠️  Warning:', stderr);
                              }

                              const result = stdout.trim();
                              console.log('📬 Transaction Result:', result);

                              if (result === 'true') {
                                             console.log('\n✅ PROOF VERIFIED ON-CHAIN! ✅');
                                             console.log('\n🎉 Success! Your ZK proof was verified using Stellar X-Ray Protocol!');
                                             console.log('\nWhat this means:');
                                             console.log('  ✓ The AI agent description is confirmed to NOT exist in the Merkle tree');
                                             console.log('  ✓ The proof was cryptographically verified on the Stellar blockchain');
                                             console.log('  ✓ X-Ray Protocol\'s BN254 curve functions validated the proof');
                                             console.log('  ✓ The verification is immutable and transparent on-chain');

                                             // Now register the agent
                                             console.log('\n📝 Registering new AI agent...');

                                             const registerCmd = `stellar contract invoke \\
                --id ${deployment.contractId} \\
                --source deployer \\
                --network ${deployment.network} \\
                -- register_agent \\
                --agent_hash "${public_agent_hash}" \\
                --merkle_root "${public_root}"`;

                                             const { stdout: registerResult } = await execAsync(registerCmd);
                                             console.log('✅ Agent registered! New Merkle root:', registerResult.trim());

                              } else {
                                             console.log('\n❌ PROOF VERIFICATION FAILED ON-CHAIN');
                                             console.log('\nPossible reasons:');
                                             console.log('  - Invalid proof format');
                                             console.log('  - Public inputs don\'t match proof');
                                             console.log('  - Verification key mismatch');
                              }

                              // Save submission record
                              const submissionRecord = {
                                             timestamp: new Date().toISOString(),
                                             contractId: deployment.contractId,
                                             proofHash: public_agent_hash,
                                             verified: result === 'true',
                                             publicSignals: {
                                                            root: public_root,
                                                            agentHash: public_agent_hash,
                                                            isNonMember: public_is_non_member
                                             }
                              };

                              const recordPath = path.join(buildDir, 'submission_record.json');
                              fs.writeFileSync(recordPath, JSON.stringify(submissionRecord, null, 2));
                              console.log(`\n💾 Submission record saved to: ${recordPath}`);

               } catch (error) {
                              console.error('\n❌ Submission failed:', error.message);
                              if (error.stdout) console.error('stdout:', error.stdout);
                              if (error.stderr) console.error('stderr:', error.stderr);
                              process.exit(1);
               }

               console.log('\n' + '='.repeat(70));
               console.log('✅ Submission process complete!');
               console.log('='.repeat(70));
}

submitProof();