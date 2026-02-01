const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: "inherit", shell: true });
    p.on("close", (code) => {
      if (code !== 0) reject(new Error(`${cmd} exited with code ${code}`));
      else resolve();
    });
  });
}

async function setupCeremony() {
  console.log("🔐 Starting ZK-SNARK Trusted Setup (Optimized for 4,159 constraints)...\n");

  const rootDir = path.join(__dirname, "..");
  const buildDir = path.join(rootDir, "build");
  if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir);

  const buildR1CS = path.join(buildDir, "non_membership.r1cs");
  const rootR1CS = path.join(rootDir, "non_membership.r1cs");

  if (fs.existsSync(rootR1CS)) fs.copyFileSync(rootR1CS, buildR1CS);

  try {
    // Power 14 is the smallest power of 2 that accommodates your circuit + overhead
    const power = "14"; 
    const entropy = crypto.randomBytes(32).toString("hex");

    const pot0 = path.join(buildDir, "pot_0000.ptau");
    const pot1 = path.join(buildDir, "pot_0001.ptau");
    const potBeacon = path.join(buildDir, "pot_beacon.ptau");
    const potFinal = path.join(buildDir, "pot_final.ptau");
    const zkey0 = path.join(buildDir, "circuit_0000.zkey");
    const zkeyFinal = path.join(buildDir, "non_membership_final.zkey");
    const vkey = path.join(buildDir, "verification_key.json");

    console.log(`\n[1/9] Initializing Powers of Tau (2^${power})...`);
    await run("snarkjs", ["powersoftau", "new", "bn128", power, pot0]);

    console.log("\n[2/9] Adding contribution...");
    await run("snarkjs", ["powersoftau", "contribute", pot0, pot1, `-e="${entropy}"`]);

    console.log("\n[3/9] Applying beacon...");
    await run("snarkjs", ["powersoftau", "beacon", pot1, potBeacon, "0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f", "10"]);

    console.log("\n[4/9] Preparing phase 2...");
    await run("snarkjs", ["powersoftau", "prepare", "phase2", potBeacon, potFinal]);

    console.log("\n[5/9] Verifying Powers of Tau...");
    await run("snarkjs", ["powersoftau", "verify", potFinal]);

    console.log("\n[6/9] Initializing Groth16 setup (This will now succeed)...");
    await run("snarkjs", ["groth16", "setup", buildR1CS, potFinal, zkey0]);

    console.log("\n[7/9] Finalizing zkey contribution...");
    await run("snarkjs", ["zkey", "contribute", zkey0, zkeyFinal, `-e="${entropy}"`]);

    console.log("\n[8/9] Exporting verification_key.json...");
    await run("snarkjs", ["zkey", "export", "verificationkey", zkeyFinal, vkey]);

    console.log("\n[9/9] Final zkey verification...");
    await run("snarkjs", ["zkey", "verify", buildR1CS, potFinal, zkeyFinal]);

    console.log("\n✨ Trusted setup complete!");
  } catch (err) {
    console.error("\n❌ Setup failed:", err.message);
    process.exit(1);
  }
}

setupCeremony();