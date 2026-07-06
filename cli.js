import readline from 'readline';
import orchestrator from './agents/index.js';

// CLI entry point
async function main() {
  const args = process.argv.slice(2);
  let task = '';

  // Simple arg parsing
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--task' || args[i] === '-t') {
      task = args[i + 1] || '';
      break;
    }
  }

  console.clear();
  console.log('==================================================');
  console.log('🛰️  OMNIPILOT AI - OFFLINE MULTI-AGENT SYSTEM CLI');
  console.log('==================================================\n');

  if (task) {
    await executeTask(task);
  } else {
    // Interactive prompt mode
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('📝 Enter agent task / goal: ', async (input) => {
      rl.close();
      if (!input.trim()) {
        console.log('❌ Task description cannot be empty.');
        process.exit(1);
      }
      await executeTask(input);
    });
  }
}

async function executeTask(taskDescription) {
  console.log(`🤖 Planning task execution for: "${taskDescription}"...\n`);
  console.log('--- [ EXECUTION TRACE LOGS ] ---');
  
  try {
    const response = await orchestrator.runTask(taskDescription);
    
    // Print trace logs with spacing
    response.trace.forEach(log => {
      let icon = '🔹';
      if (log.step === 'tool_call') icon = '🛠️';
      else if (log.step === 'tool_response') icon = '📥';
      else if (log.step === 'security_block') icon = '⚠️';
      else if (log.step === 'finish') icon = '✅';
      
      console.log(`[${log.timestamp.split('T')[1].substring(0, 8)}] ${icon} [${log.agent}] (${log.step.toUpperCase()}): ${log.detail}`);
    });

    console.log('\n--- [ FINAL RESPONSE REPORT ] ---');
    console.log(response.result);
    console.log('\n==================================================');
  } catch (error) {
    console.error(`\n❌ Execution failed: ${error.message}`);
  }
}

main();
