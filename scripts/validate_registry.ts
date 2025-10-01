#!/usr/bin/env tsx
// validate_registry.ts
// Validate column registry against actual Neon schema

import { readFileSync } from 'fs';
import { resolve } from 'path';
import YAML from 'yaml';

const COMPOSIO_URL = process.env.COMPOSIO_SERVER_URL;
const COMPOSIO_API_KEY = process.env.COMPOSIO_API_KEY;

if (!COMPOSIO_URL || !COMPOSIO_API_KEY) {
  console.error('Missing required environment variables: COMPOSIO_SERVER_URL, COMPOSIO_API_KEY');
  process.exit(1);
}

interface ColumnRegistry {
  version: string;
  schema: string;
  tables: {
    [table: string]: {
      columns: Array<{
        name: string;
        type: string;
        required: boolean;
        description: string;
      }>;
    };
  };
}

async function loadRegistry(): Promise<ColumnRegistry> {
  const filePath = resolve(__dirname, '..', 'db', 'registry', 'clnt_column_registry.yml');
  const content = readFileSync(filePath, 'utf-8');
  return YAML.parse(content);
}

async function getSchemaFromNeon(): Promise<any> {
  const response = await fetch(`${COMPOSIO_URL}/mcp/db/schema`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${COMPOSIO_API_KEY}`
    },
    body: JSON.stringify({
      schema: 'clnt'
    })
  });

  if (!response.ok) {
    throw new Error(`Schema fetch failed: ${response.statusText}`);
  }

  return await response.json();
}

async function validateRegistry() {
  console.log('Validating column registry...\n');

  const registry = await loadRegistry();
  const neonSchema = await getSchemaFromNeon();

  let errors = 0;
  let warnings = 0;

  for (const [tableName, tableInfo] of Object.entries(registry.tables)) {
    console.log(`Checking table: ${tableName}`);

    const neonTable = neonSchema.tables[tableName];
    if (!neonTable) {
      console.error(`  ✗ Table not found in Neon schema`);
      errors++;
      continue;
    }

    for (const column of tableInfo.columns) {
      const neonColumn = neonTable.columns[column.name];

      if (!neonColumn) {
        console.error(`  ✗ Column ${column.name} not found in Neon`);
        errors++;
        continue;
      }

      if (neonColumn.type !== column.type) {
        console.warn(`  ⚠ Column ${column.name} type mismatch: registry=${column.type}, neon=${neonColumn.type}`);
        warnings++;
      }

      console.log(`  ✓ ${column.name}`);
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Validation complete:`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Warnings: ${warnings}`);

  if (errors > 0) {
    console.error('\n✗ Validation failed');
    process.exit(1);
  } else if (warnings > 0) {
    console.warn('\n⚠ Validation passed with warnings');
  } else {
    console.log('\n✓ Validation passed');
  }
}

validateRegistry().catch(error => {
  console.error('Validation error:', error);
  process.exit(1);
});