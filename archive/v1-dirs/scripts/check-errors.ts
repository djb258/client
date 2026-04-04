/**
 * Error Log Checker
 *
 * CLI utility to check error logs from shq.error_log
 * Usage: npm run errors:check [command]
 */

import { getUnresolvedErrors, getCriticalErrors, getErrorSummaryByAgent, queryErrors } from './error-logger';

const command = process.argv[2] || 'unresolved';

async function main() {
  console.log(`\n📊 Error Log Report: ${command.toUpperCase()}\n`);

  try {
    switch (command) {
      case 'unresolved': {
        const errors = await getUnresolvedErrors(50);
        console.log(`Found ${errors.length} unresolved errors:\n`);

        errors.forEach((err, idx) => {
          console.log(`${idx + 1}. [${err.error_type}] ${err.error_message}`);
          console.log(`   Agent: ${err.agent_id || 'N/A'} | Process: ${err.process_id || 'N/A'}`);
          console.log(`   Created: ${err.timestamp_created}`);
          if (err.details) {
            console.log(`   Details: ${JSON.stringify(err.details, null, 2)}`);
          }
          console.log('');
        });
        break;
      }

      case 'critical': {
        const errors = await getCriticalErrors();
        console.log(`Found ${errors.length} critical errors:\n`);

        errors.forEach((err, idx) => {
          console.log(`${idx + 1}. ⚠️  [${err.error_type}] ${err.error_message}`);
          console.log(`   Agent: ${err.agent_id || 'N/A'} | Process: ${err.process_id || 'N/A'}`);
          console.log(`   Resolved: ${err.resolved ? '✅ Yes' : '❌ No'}`);
          console.log(`   Created: ${err.timestamp_created}`);
          if (err.details) {
            console.log(`   Details: ${JSON.stringify(err.details, null, 2)}`);
          }
          console.log('');
        });
        break;
      }

      case 'summary': {
        const summary = await getErrorSummaryByAgent();
        console.log(`Error Summary by Agent (Last 30 Days):\n`);

        summary.forEach((item) => {
          console.log(`Agent: ${item.agent_id || 'Unknown'}`);
          console.log(`  Error Type: ${item.error_type}`);
          console.log(`  Total: ${item.total_errors} | Resolved: ${item.resolved_count} | Unresolved: ${item.unresolved_count}`);
          if (item.avg_resolution_hours) {
            console.log(`  Avg Resolution Time: ${item.avg_resolution_hours.toFixed(2)} hours`);
          }
          console.log(`  Last Error: ${item.last_error_at}`);
          console.log('');
        });
        break;
      }

      case 'recent': {
        const since = new Date();
        since.setHours(since.getHours() - 24); // Last 24 hours

        const errors = await queryErrors({ since, limit: 50 });
        console.log(`Found ${errors.length} errors in last 24 hours:\n`);

        errors.forEach((err, idx) => {
          const status = err.resolved ? '✅' : '❌';
          console.log(`${idx + 1}. ${status} [${err.error_type}] ${err.error_message}`);
          console.log(`   Agent: ${err.agent_id || 'N/A'} | Process: ${err.process_id || 'N/A'}`);
          console.log(`   Created: ${err.timestamp_created}`);
          console.log('');
        });
        break;
      }

      default:
        console.log('Available commands:');
        console.log('  unresolved - Show all unresolved errors (default)');
        console.log('  critical   - Show critical errors from last 7 days');
        console.log('  summary    - Show error summary by agent (last 30 days)');
        console.log('  recent     - Show all errors from last 24 hours');
        console.log('\nUsage: npm run errors:check [command]');
    }
  } catch (err) {
    console.error('❌ Error fetching error logs:', err);
    process.exit(1);
  }
}

main();
