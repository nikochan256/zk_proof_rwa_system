const { spawn } = require('child_process');
const path = require('path');

async function runStep(name, command, args) {
    console.log(`\n🚀 [PHASE: ${name}]`);
    console.log(`Executing: node ${args.join(' ')}`);
    console.log('═'.repeat(50));

    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            stdio: 'inherit', // This sends all logs (including SnarkJS logs) to your terminal
            shell: true
        });

        child.on('exit', (code) => {
            if (code === 0) {
                console.log(`\n✅ ${name} completed successfully.`);
                resolve();
            } else {
                console.error(`\n❌ ${name} failed with exit code ${code}`);
                reject(new Error(`${name} failed`));
            }
        });
    });
}

async function runFullSuite() {
    const scriptsDir = __dirname;
    
    // Define the sequence of scripts to run
    const pipeline = [
        { name: 'COMPILE', script: 'compile' }, // Uses npm script
        { name: 'SETUP', script: 'setup' },     // Uses npm script
        { name: 'GENERATE', script: 'generate-proof' },
        { name: 'VERIFY', script: 'verify-proof' }
    ];

    console.log('🌟 STARTING COMPREHENSIVE ZK-SYSTEM TEST 🌟');

    try {
        for (const step of pipeline) {
            // We call 'npm run' for each to utilize the memory flags in package.json
            await runStep(step.name, 'npm', ['run', step.script]);
        }

        console.log('\n' + '═'.repeat(50));
        console.log('🎉 ALL PHASES PASSED: SYSTEM IS STELLAR-READY!');
        console.log('═'.repeat(50));
        
    } catch (error) {
        console.error('\n🛑 TEST SUITE ABORTED:', error.message);
        process.exit(1);
    }
}

runFullSuite();