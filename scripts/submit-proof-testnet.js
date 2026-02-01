const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');

const execAsync = promisify(exec);

async function submitProofTestnet() {
               console.log('📤 Submitting ZK Proof to Stellar TESTNET\n');

               const configPath = path.join(__dirname, '../config/deployment-testnet.json');

               if (!fs.existsSync(configPath)) {
                              console.error('❌ Testnet deployment config not found.');
                              console.error('Please run: ./scripts/deploy-testnet.sh first');
                              process.exit(1);
               }

               const deployment = JSON.parse(fs.readFileSync(configPath, 'utf8'));
               console.log('📋 Testnet Configuration:');
               console.log(`   Contract ID: ${deployment.contractId}`);
               console.log(`   Network: ${deployment.network}`);
               console.log(`   Explorer: https://stellar.expert/explorer/testnet/contract/${deployment.contractId}`);

               const buildDir = path.join(__dirname, '../build');
               const proofPath = path.join(buildDir, 'proof.json');
               const publicPath = path.join(buildDir, 'public.json');

               if (!fs.existsSync(proofPath) || !fs.existsSync(publicPath)) {
                              console.error('❌ Proof not found. Run: npm run generate-proof');
                              process.exit(1);
               }

               const proof = JSON.parse(fs.readFileSync(proofPath, 'utf8'));
               const publicSignals = JSON.parse(fs.readFileSync(publicPath, 'utf8'));

               console.log('\n📊 Proof Data:');
               console.log(`   Root: ${publicSignals[0].slice(0, 30)}...`);
               console.log(`   Agent Hash: ${publicSignals[1].slice(0, 30)}...`);
               console.log(`   Is Non-Member: ${publicSignals[2]}`);

               try {
                              const toHex32 = (numStr) => {
                                             const bn = BigInt(numStr);
                                             let hex = bn.toString(16);
                                             hex = hex.padStart(64, '0');
                                             return '0x' + hex;
                              };

                              const proof_a_x = toHex32(proof.pi_a[0]);
                              const proof_a_y = toHex32(proof.pi_a[1]);
                              const proof_b_x0 = toHex32(proof.pi_b[0][0]);
                              const proof_b_x1 = toHex32(proof.pi_b[0][1]);
                              const proof_b_y0 = toHex32(proof.pi_b[1][0]);
                              const proof_b_y1 = toHex32(proof.pi_b[1][1]);
                              const proof_c_x = toHex32(proof.pi_c[0]);
                              const proof_c_y = toHex32(proof.pi_c[1]);
                              const public_root = toHex32(publicSignals[0]);
                              const public_agent_hash = toHex32(publicSignals[1]);
                              const public_is_non_member = publicSignals[2];

                              console.log('\n📡 Submitting to Stellar Testnet...');

                              const invokeCmd = `stellar contract invoke \
            --id ${deployment.contractId} \
            --source deployer-testnet \
            --network testnet \
            -- verify_non_membership \
            --proof_a_x "${proof_a_x}" \
            --proof_a_y "${proof_a_y}" \
            --proof_b_x0 "${proof_b_x0}" \
            --proof_b_x1 "${proof_b_x1}" \
            --proof_b_y0 "${proof_b_y0}" \
            --proof_b_y1 "${proof_b_y1}" \
            --proof_c_x "${proof_c_x}" \
            --proof_c_y "${proof_c_y}" \
            --public_root "${public_root}" \
            --public_agent_hash "${public_agent_hash}" \
            --public_is_non_member ${public_is_non_member}`;

                              const { stdout } = await execAsync(invokeCmd);
                              const result = stdout.trim();

                              if (result === 'true') {
                                             console.log('\n✅ PROOF VERIFIED ON STELLAR TESTNET! ✅');
                                             console.log('\n🎉 Your proof is now on the public Stellar blockchain!');
                                             console.log(`\nView transaction: https://stellar.expert/explorer/testnet/contract/${deployment.contractId}`);
                              } else {
                                             console.log('\n❌ Verification failed');
                              }

               } catch (error) {
                              console.error('\n❌ Submission failed:', error.message);
                              process.exit(1);
               }
}

submitProofTestnet();