/**
 * Sync ERD Metrics
 *
 * Queries the Neon database and updates erd/ERD_METRICS.yaml with current counts.
 *
 * Usage: doppler run -- node scripts/sync_erd_metrics.js
 *
 * Authority: CC-02 (Hub)
 * Version: 1.0.0
 */

import { Client } from 'pg';
import fs from 'fs';
import yaml from 'js-yaml';

// Connection string - use Doppler or fallback to env
const connectionString = process.env.NEON_DATABASE_URL ||
  "postgresql://neondb_owner:npg_QnoCfHbgJm32@ep-frosty-brook-ad6wval6-pooler.c-2.us-east-1.aws.neon.tech/clnt?sslmode=require&channel_binding=require";

const METRICS_FILE = 'erd/ERD_METRICS.yaml';

async function syncMetrics() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  ERD METRICS SYNC');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log();

  const client = new Client({ connectionString });

  try {
    console.log('🔌 Connecting to Neon database...');
    await client.connect();
    console.log('✅ Connected\n');

    // Load current metrics file
    console.log('📄 Loading ERD_METRICS.yaml...');
    const metricsContent = fs.readFileSync(METRICS_FILE, 'utf-8');
    const metrics = yaml.load(metricsContent);
    console.log('✅ Loaded\n');

    // Update table counts
    console.log('📊 Querying table counts...\n');

    // Ingress tables
    for (const table of metrics.tables.ingress) {
      try {
        const result = await client.query(table.query);
        table.count = parseInt(result.rows[0].count);
        console.log(`   ✅ ${table.table_name}: ${table.count}`);
      } catch (err) {
        console.log(`   ❌ ${table.table_name}: Error - ${err.message}`);
        table.count = null;
      }
    }

    // Middle tables
    for (const table of metrics.tables.middle) {
      try {
        const result = await client.query(table.query);
        table.count = parseInt(result.rows[0].count);
        console.log(`   ✅ ${table.table_name}: ${table.count}`);
      } catch (err) {
        console.log(`   ❌ ${table.table_name}: Error - ${err.message}`);
        table.count = null;
      }
    }

    // Egress tables
    for (const table of metrics.tables.egress) {
      try {
        const result = await client.query(table.query);
        table.count = parseInt(result.rows[0].count);
        console.log(`   ✅ ${table.table_name}: ${table.count}`);
      } catch (err) {
        console.log(`   ❌ ${table.table_name}: Error - ${err.message}`);
        table.count = null;
      }
    }

    console.log();

    // Update aggregates
    console.log('📈 Querying aggregates...\n');
    for (const agg of metrics.aggregates) {
      try {
        const result = await client.query(agg.query);
        agg.value = parseInt(result.rows[0].count);
        console.log(`   ✅ ${agg.name}: ${agg.value}`);
      } catch (err) {
        console.log(`   ❌ ${agg.name}: Error - ${err.message}`);
        agg.value = null;
      }
    }

    console.log();

    // Update sync metadata
    metrics.sync.last_updated = new Date().toISOString();
    metrics.sync.updated_by = 'claude-code';

    // Write updated metrics
    console.log('💾 Writing updated metrics...');
    const updatedYaml = yaml.dump(metrics, {
      lineWidth: 100,
      noRefs: true,
      sortKeys: false
    });
    fs.writeFileSync(METRICS_FILE, updatedYaml);
    console.log('✅ ERD_METRICS.yaml updated\n');

    // Summary
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  SYNC COMPLETE');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log();
    console.log(`   Last Updated: ${metrics.sync.last_updated}`);
    console.log(`   Updated By: ${metrics.sync.updated_by}`);
    console.log();

    // Calculate totals
    const ingressCount = metrics.tables.ingress.reduce((sum, t) => sum + (t.count || 0), 0);
    const middleCount = metrics.tables.middle.reduce((sum, t) => sum + (t.count || 0), 0);
    const egressCount = metrics.tables.egress.reduce((sum, t) => sum + (t.count || 0), 0);

    console.log('   Layer Summary:');
    console.log(`   ├── Ingress (I): ${ingressCount} records`);
    console.log(`   ├── Middle (M):  ${middleCount} records`);
    console.log(`   └── Egress (O):  ${egressCount} records`);
    console.log();

  } catch (error) {
    console.error('\n❌ Sync failed:');
    console.error(error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

syncMetrics();
