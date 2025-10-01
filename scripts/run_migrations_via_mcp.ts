#!/usr/bin/env tsx
// run_migrations_via_mcp.ts
// Run database migrations through Composio MCP

import { readFileSync } from 'fs';
import { resolve } from 'path';

const COMPOSIO_URL = process.env.COMPOSIO_SERVER_URL;
const COMPOSIO_API_KEY = process.env.COMPOSIO_API_KEY;

if (!COMPOSIO_URL || !COMPOSIO_API_KEY) {
  console.error('Missing required environment variables: COMPOSIO_SERVER_URL, COMPOSIO_API_KEY');
  process.exit(1);
}

async function runMigration(sqlFile: string): Promise<void> {
  const filePath = resolve(__dirname, '..', 'db', 'neon', sqlFile);
  const sql = readFileSync(filePath, 'utf-8');

  console.log(`Running migration: ${sqlFile}`);

  const response = await fetch(`${COMPOSIO_URL}/mcp/db/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${COMPOSIO_API_KEY}`
    },
    body: JSON.stringify({
      sql,
      schema: 'clnt',
      migration: true
    })
  });

  if (!response.ok) {
    throw new Error(`Migration failed: ${response.statusText}`);
  }

  const result = await response.json();
  console.log(`✓ ${sqlFile} completed`);
  console.log(`  Job ID: ${result.job_id}`);
}

async function main() {
  console.log('Starting migrations...\n');

  try {
    await runMigration('01_schema.sql');
    await runMigration('02_views.sql');

    // Skip seed in production
    if (process.env.NODE_ENV !== 'production') {
      await runMigration('03_seed.sql');
    }

    console.log('\n✓ All migrations completed successfully');
  } catch (error) {
    console.error('\n✗ Migration failed:', error);
    process.exit(1);
  }
}

main();