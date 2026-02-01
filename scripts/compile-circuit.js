const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');

const execAsync = promisify(exec);

async function compileCircuit() {
               console.log('🔧 Compiling Circom circuit...\n');

               const circuitPath = path.join(__dirname, '../circuits/non_membership.circom');
               const buildDir = path.join(__dirname, '../build');

               // Create build directory if it doesn't exist
               if (!fs.existsSync(buildDir)) {
                              fs.mkdirSync(buildDir, { recursive: true });
               }

               try {
                              // Compile circuit to R1CS and WASM
                              console.log('Step 1: Compiling circuit to R1CS and WASM...');
                              const compileCmd = `circom "${circuitPath}" --r1cs --wasm --sym --c -o "${buildDir}"`;
                              const { stdout: compileOutput } = await execAsync(compileCmd);
                              console.log(compileOutput);

                              // Display circuit info
                              console.log('\nStep 2: Getting circuit info...');
                              const r1csPath = path.join(buildDir, 'non_membership.r1cs');
                              const infoCmd = `snarkjs r1cs info "${r1csPath}"`;
                              const { stdout: infoOutput } = await execAsync(infoCmd);
                              console.log(infoOutput);

                              // Export R1CS to JSON for inspection
                              console.log('Step 3: Exporting R1CS to JSON...');
                              const jsonPath = path.join(buildDir, 'non_membership.r1cs.json');
                              const exportCmd = `snarkjs r1cs export json "${r1csPath}" "${jsonPath}"`;
                              await execAsync(exportCmd);
                              console.log(`✅ R1CS exported to: ${jsonPath}`);

                              console.log('\n✅ Circuit compilation complete!');
                              console.log(`   R1CS: ${r1csPath}`);
                              console.log(`   WASM: ${path.join(buildDir, 'non_membership_js/non_membership.wasm')}`);

               } catch (error) {
                              console.error('❌ Compilation failed:', error.message);
                              if (error.stdout) console.error('stdout:', error.stdout);
                              if (error.stderr) console.error('stderr:', error.stderr);
                              process.exit(1);
               }
}

compileCircuit();