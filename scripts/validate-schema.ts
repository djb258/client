/**
 * validate-schema.ts — Schema Completeness Validator
 *
 * Validates that every table and column in clnt_column_registry.yml has
 * complete metadata — no placeholders, no missing fields.
 *
 * Implements DBA Enforcement Gate B from DBA_ENFORCEMENT_DOCTRINE.md.
 *
 * Usage: npx tsx scripts/validate-schema.ts
 * Exit: 0 = complete, 1 = violations found, 2 = error
 *
 * This is the TypeScript implementation called by the validate-schema-completeness.sh wrapper.
 */

import { loadRegistry } from './codegen-schema.js';
import type { Registry, Table, Column } from './codegen-schema.js';

// ── Validation Constants ────────────────────────────────────────────────────

const VALID_LEAF_TYPES = ['CANONICAL', 'ERROR', 'SUPPORT', 'STAGING', 'AUDIT'];
const VALID_DB_TYPES = [
  'UUID', 'TEXT', 'VARCHAR', 'CHAR', 'INTEGER', 'INT', 'BIGINT', 'SMALLINT',
  'SERIAL', 'BIGSERIAL', 'BOOLEAN', 'BOOL', 'TIMESTAMP', 'TIMESTAMPTZ',
  'DATE', 'TIME', 'TIMETZ', 'NUMERIC', 'DECIMAL', 'FLOAT', 'REAL',
  'JSON', 'JSONB', 'BYTEA', 'ARRAY', 'INTERVAL', 'MONEY', 'INET',
];

// ── Helpers ─────────────────────────────────────────────────────────────────

let violations = 0;
let warnings = 0;
let tablesChecked = 0;
let columnsChecked = 0;

function violation(msg: string): void {
  console.error(`  \x1b[31m[VIOLATION]\x1b[0m ${msg}`);
  violations++;
}

function warning(msg: string): void {
  console.warn(`  \x1b[33m[WARNING]\x1b[0m ${msg}`);
  warnings++;
}

function isPlaceholder(val: unknown): boolean {
  if (val === undefined || val === null || val === '') return true;
  if (typeof val === 'string' && /^\[.*\]$/.test(val)) return true;
  return false;
}

function normalizedIncludes(list: string[], item: string): boolean {
  const upper = item.replace(/\(.*\)/, '').trim().toUpperCase();
  return list.some(v => v.toUpperCase() === upper);
}

// ── Column Validation ───────────────────────────────────────────────────────

function validateColumn(tableName: string, col: Column): void {
  columnsChecked++;
  const prefix = `Table '${tableName}', Column '${col.name ?? '???'}'`;

  // name
  if (isPlaceholder(col.name)) {
    violation(`${prefix}: 'name' is missing or placeholder`);
  }

  // description (min 10 chars)
  if (isPlaceholder(col.description)) {
    violation(`${prefix}: 'description' is missing or placeholder`);
  } else if (col.description.length < 10) {
    violation(`${prefix}: 'description' too short (${col.description.length} chars, min 10)`);
  }

  // type (recognized database type)
  if (isPlaceholder(col.type)) {
    violation(`${prefix}: 'type' is missing or placeholder`);
  } else if (!normalizedIncludes(VALID_DB_TYPES, col.type)) {
    warning(`${prefix}: 'type' = '${col.type}' not in standard list (may be valid)`);
  }

  // required (explicit boolean)
  if (col.required === undefined || col.required === null) {
    violation(`${prefix}: 'required' must be explicitly true or false`);
  }
}

// ── Table Validation ────────────────────────────────────────────────────────

function validateTable(tableName: string, table: Table): void {
  tablesChecked++;
  const prefix = `Table '${tableName}'`;

  // description (min 10 chars)
  if (isPlaceholder(table.description)) {
    violation(`${prefix}: 'description' is missing or placeholder`);
  } else if (table.description.length < 10) {
    violation(`${prefix}: 'description' too short (${table.description.length} chars, min 10)`);
  }

  // leaf_type
  if (isPlaceholder(table.leaf_type)) {
    violation(`${prefix}: 'leaf_type' is missing or placeholder`);
  } else if (!normalizedIncludes(VALID_LEAF_TYPES, table.leaf_type)) {
    warning(`${prefix}: 'leaf_type' = '${table.leaf_type}' not in standard list`);
  }

  // pk
  if (isPlaceholder(table.pk)) {
    violation(`${prefix}: 'pk' (primary key) is missing or placeholder`);
  }

  // spoke
  if (isPlaceholder(table.spoke)) {
    violation(`${prefix}: 'spoke' assignment is missing or placeholder`);
  }

  // write_rules
  if (!table.write_rules) {
    violation(`${prefix}: 'write_rules' is missing`);
  } else {
    if (table.write_rules.insert === undefined) {
      violation(`${prefix}: 'write_rules.insert' must be explicitly true or false`);
    }
    if (table.write_rules.update === undefined) {
      violation(`${prefix}: 'write_rules.update' must be explicitly true or false`);
    }
  }

  // columns
  if (!table.columns || table.columns.length === 0) {
    violation(`${prefix}: No columns declared`);
  } else {
    for (const col of table.columns) {
      validateColumn(tableName, col);
    }
  }
}

// ── Main ────────────────────────────────────────────────────────────────────

function main(): void {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  SCHEMA COMPLETENESS VALIDATION (TypeScript)');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');

  let registry: Registry;
  try {
    registry = loadRegistry();
  } catch (err) {
    console.error(`\x1b[31m[ERROR]\x1b[0m Failed to load registry: ${err}`);
    process.exit(2);
  }

  console.log(`  Registry version: ${registry.version}`);
  console.log(`  Schema: ${registry.schema}`);
  console.log(`  Declared tables: ${registry.total_tables}`);
  console.log('');

  // Validate all tables
  const tableNames = Object.keys(registry.tables);
  for (const tableName of tableNames) {
    validateTable(tableName, registry.tables[tableName]);
    if (violations === 0) {
      console.log(`  \x1b[32m[CHECKED]\x1b[0m ${tableName} (${registry.tables[tableName].columns.length} columns)`);
    }
  }

  // Cross-check: actual table count vs declared
  if (tableNames.length !== registry.total_tables) {
    warning(`Declared total_tables (${registry.total_tables}) != actual tables found (${tableNames.length})`);
  }

  // Cross-check: every spoke's tables[] exist in tables
  for (const [spokeId, spoke] of Object.entries(registry.spokes)) {
    for (const tbl of spoke.tables) {
      if (!registry.tables[tbl]) {
        violation(`Spoke '${spokeId}' references table '${tbl}' which is not defined in tables`);
      }
    }
  }

  // Summary
  console.log('');
  console.log('───────────────────────────────────────────────────────────────');
  console.log(`  Tables checked:  ${tablesChecked}`);
  console.log(`  Columns checked: ${columnsChecked}`);
  console.log('');

  if (violations > 0) {
    console.error(`\x1b[31mFAILED\x1b[0m: ${violations} violation(s), ${warnings} warning(s)`);
    console.log('');
    process.exit(1);
  } else if (warnings > 0) {
    console.log(`\x1b[33mPASSED WITH WARNINGS\x1b[0m: ${warnings} warning(s)`);
    console.log('');
    process.exit(0);
  } else {
    console.log(`\x1b[32mPASSED\x1b[0m: Schema metadata complete`);
    console.log('');
    process.exit(0);
  }
}

main();
