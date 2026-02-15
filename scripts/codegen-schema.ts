/**
 * codegen-schema.ts — Schema Code Generator
 *
 * Reads clnt_column_registry.yml (single source of truth) and generates:
 *   - src/data/spokes/{spoke}/types.ts    (TypeScript interfaces)
 *   - src/data/spokes/{spoke}/schema.ts   (Zod write schemas)
 *   - src/data/spokes/index.ts            (barrel re-exports)
 *   - src/data/ERD.md                     (Mermaid ER diagram)
 *
 * Usage: npx ts-node scripts/codegen-schema.ts
 *    or: node -e "require('js-yaml')" && node scripts/codegen-schema.js
 *
 * Exported functions are used by scripts/verify-codegen.ts for drift detection.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as yaml from 'js-yaml';

// ── Paths ──────────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const ROOT = path.resolve(__dirname, '..');
export const REGISTRY_PATH = path.join(ROOT, 'src/data/db/registry/clnt_column_registry.yml');
export const SPOKES_DIR = path.join(ROOT, 'src/data/spokes');
export const HUB_DIR = path.join(ROOT, 'src/data/hub');
export const ERD_PATH = path.join(ROOT, 'src/data/ERD.md');

// ── Types ──────────────────────────────────────────────────────────────────

export interface Column {
  name: string;
  type: string;
  required: boolean;
  default?: string;
  auto_managed?: boolean;
  description: string;
  check?: string;
  ts_override?: string;
  zod_override?: string;
}

export interface Table {
  spoke: string;
  leaf_type: string;
  description: string;
  pk: string;
  fk: string[];
  write_rules: { insert: boolean; update: boolean };
  updatable_columns?: string[];
  columns: Column[];
}

export interface Spoke {
  name: string;
  purpose: string;
  canonical: string;
  error: string;
  tables: string[];
}

export interface Registry {
  version: string;
  schema: string;
  total_tables: number;
  universal_join_key: string;
  spine_table: string;
  codegen_output: string;
  hub_output: string;
  spokes: Record<string, Spoke>;
  type_map: Record<string, { ts: string; zod: string }>;
  check_constraints: Record<string, string[]>;
  tables: Record<string, Table>;
}

// ── Load Registry ──────────────────────────────────────────────────────────

export function loadRegistry(): Registry {
  const raw = fs.readFileSync(REGISTRY_PATH, 'utf8');
  return yaml.load(raw) as Registry;
}

// ── Type Mapping ───────────────────────────────────────────────────────────

export function sqlToTs(col: Column, _typeMap: Record<string, { ts: string; zod: string }>, schema: string, table: string): string {
  if (col.ts_override) return col.ts_override;

  // Strip precision from NUMERIC(x,y) → NUMERIC
  const baseType = col.type.replace(/\(.*\)/, '');
  const mapping = _typeMap[baseType];
  if (!mapping) throw new Error(`No type mapping for ${col.type} on ${schema}.${table}.${col.name}`);

  const tsType = mapping.ts;
  if (!col.required) return `${tsType} | null`;
  return tsType;
}

export function sqlToZod(col: Column, _typeMap: Record<string, { ts: string; zod: string }>): string {
  if (col.zod_override) return col.zod_override;

  const baseType = col.type.replace(/\(.*\)/, '');
  const mapping = _typeMap[baseType];
  if (!mapping) throw new Error(`No type mapping for ${col.type} on column ${col.name}`);

  let zodType = mapping.zod;
  if (!col.required) zodType += '.nullable()';
  return zodType;
}

// ── Name Helpers ───────────────────────────────────────────────────────────

export function toPascalCase(s: string): string {
  return s
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
}

// ── Generate types.ts ──────────────────────────────────────────────────────

export function generateTypesTs(
  spokeName: string,
  spoke: Spoke,
  tables: Record<string, Table>,
  registry: Registry
): string {
  const lines: string[] = [];
  const schema = registry.schema;

  lines.push(`// ${spokeName.toUpperCase()}: ${spoke.name} — ${spoke.purpose}`);
  lines.push(`// Schema: ${schema} | Spoke: ${spokeName}`);
  lines.push(`// Tables: ${spoke.tables.join(', ')}`);
  lines.push(`// GENERATED FROM: src/data/db/registry/clnt_column_registry.yml`);
  lines.push(`// DO NOT HAND-EDIT. Run: npx ts-node scripts/codegen-schema.ts`);
  lines.push('');

  for (const tableName of spoke.tables) {
    const table = tables[tableName];
    if (!table) throw new Error(`Table ${tableName} not found in registry`);

    const interfaceName = toPascalCase(tableName);

    lines.push(`/**`);
    lines.push(` * ${schema}.${tableName} — ${table.description}`);
    lines.push(` * Leaf Type: ${table.leaf_type}`);
    lines.push(` * PK: ${table.pk}`);
    if (table.fk.length > 0) {
      lines.push(` * FK: ${table.fk.join(', ')}`);
    }
    lines.push(` */`);
    lines.push(`export interface ${interfaceName} {`);

    for (const col of table.columns) {
      const tsType = sqlToTs(col, registry.type_map, schema, tableName);
      lines.push(`  /** @column ${schema}.${tableName}.${col.name} — ${col.description} */`);
      lines.push(`  ${col.name}: ${tsType};`);
      lines.push('');
    }

    lines.push(`}`);
    lines.push('');
  }

  return lines.join('\n');
}

// ── Generate schema.ts ─────────────────────────────────────────────────────

export function generateSchemaTs(
  spokeName: string,
  spoke: Spoke,
  tables: Record<string, Table>,
  registry: Registry
): string {
  const lines: string[] = [];
  const schema = registry.schema;

  lines.push(`// ${spokeName.toUpperCase()}: ${spoke.name} — ${spoke.purpose}`);
  lines.push(`// Zod write schemas generated from column registry`);
  lines.push(`// GENERATED FROM: src/data/db/registry/clnt_column_registry.yml`);
  lines.push(`// DO NOT HAND-EDIT. Run: npx ts-node scripts/codegen-schema.ts`);
  lines.push('');
  lines.push(`import { z } from 'zod';`);
  lines.push('');

  for (const tableName of spoke.tables) {
    const table = tables[tableName];
    if (!table) continue;

    const pascalName = toPascalCase(tableName);

    // ── Insert Schema ──
    if (table.write_rules.insert) {
      lines.push(`/** Insert schema for ${schema}.${tableName} (${table.leaf_type}) */`);
      lines.push(`export const ${pascalName}Insert = z.object({`);

      for (const col of table.columns) {
        if (col.auto_managed) continue; // Skip PK with default, created_at, updated_at

        const zodType = sqlToZod(col, registry.type_map);
        const desc = `${schema}.${tableName}.${col.name} — ${col.description}`;

        // If column has a default, make it optional in insert
        if (col.default) {
          lines.push(`  /** @column ${desc} */`);
          lines.push(`  ${col.name}: ${zodType}.optional().describe('${schema}.${tableName}.${col.name}'),`);
        } else {
          lines.push(`  /** @column ${desc} */`);
          lines.push(`  ${col.name}: ${zodType}.describe('${schema}.${tableName}.${col.name}'),`);
        }
      }

      lines.push(`});`);
      lines.push(`export type ${pascalName}InsertInput = z.infer<typeof ${pascalName}Insert>;`);
      lines.push('');
    }

    // ── Update Schema ──
    if (table.write_rules.update) {
      const updatableCols = table.updatable_columns;

      lines.push(`/** Update schema for ${schema}.${tableName} (${table.leaf_type}) */`);
      lines.push(`export const ${pascalName}Update = z.object({`);

      for (const col of table.columns) {
        if (col.auto_managed) continue;
        if (col.name === table.pk) continue; // Can't update PK
        if (col.name === 'client_id') continue; // Can't change sovereign FK

        // For SUPPORT/STAGING with updatable_columns, only allow declared columns
        if (updatableCols && !updatableCols.includes(col.name)) continue;

        const zodType = sqlToZod(col, registry.type_map);
        lines.push(`  /** @column ${schema}.${tableName}.${col.name} — ${col.description} */`);
        lines.push(`  ${col.name}: ${zodType}.optional().describe('${schema}.${tableName}.${col.name}'),`);
      }

      lines.push(`});`);
      lines.push(`export type ${pascalName}UpdateInput = z.infer<typeof ${pascalName}Update>;`);
      lines.push('');
    }
  }

  return lines.join('\n');
}

// ── Generate barrel index.ts ───────────────────────────────────────────────

export function generateBarrelIndex(spokes: Record<string, Spoke>): string {
  const lines: string[] = [];

  lines.push(`// Barrel index — single entry point for all spoke types and schemas`);
  lines.push(`// GENERATED FROM: src/data/db/registry/clnt_column_registry.yml`);
  lines.push(`// DO NOT HAND-EDIT. Run: npx ts-node scripts/codegen-schema.ts`);
  lines.push('');

  for (const spokeName of Object.keys(spokes).sort()) {
    lines.push(`// ${spokeName}`);
    lines.push(`export * from './${spokeName}/types';`);
    lines.push(`export * from './${spokeName}/schema';`);
    lines.push('');
  }

  return lines.join('\n');
}

// ── Generate ERD.md ────────────────────────────────────────────────────────

export function generateErd(registry: Registry): string {
  const lines: string[] = [];
  const schema = registry.schema;

  lines.push(`# ERD — ${schema} Schema`);
  lines.push('');
  lines.push('> GENERATED FROM: `src/data/db/registry/clnt_column_registry.yml`');
  lines.push('> DO NOT HAND-EDIT. Run: `npx ts-node scripts/codegen-schema.ts`');
  lines.push('');
  lines.push(`**Version**: ${registry.version}`);
  lines.push(`**Tables**: ${registry.total_tables}`);
  lines.push(`**Spine**: ${registry.spine_table}`);
  lines.push(`**Universal Join Key**: ${registry.universal_join_key}`);
  lines.push('');

  // ── Summary Table ──
  lines.push('## Table Summary');
  lines.push('');
  lines.push('| Table | Spoke | Leaf Type | PK | FK |');
  lines.push('|-------|-------|-----------|----|----|');

  for (const [tableName, table] of Object.entries(registry.tables)) {
    const fkStr = table.fk.length > 0 ? table.fk.join(', ') : '—';
    lines.push(`| ${tableName} | ${table.spoke} | ${table.leaf_type} | ${table.pk} | ${fkStr} |`);
  }

  lines.push('');

  // ── Mermaid ERD ──
  lines.push('## Entity Relationship Diagram');
  lines.push('');
  lines.push('```mermaid');
  lines.push('erDiagram');

  // Emit table columns
  for (const [tableName, table] of Object.entries(registry.tables)) {
    lines.push(`    ${tableName} {`);
    for (const col of table.columns) {
      const baseType = col.type.replace(/\(.*\)/, '');
      const pkFlag = col.name === table.pk ? 'PK' : '';
      const fkFlag = !pkFlag && table.fk.some(f => f.endsWith(`.${col.name}`)) ? 'FK' : '';
      const flag = pkFlag || fkFlag;
      lines.push(`        ${baseType} ${col.name}${flag ? ` ${flag}` : ''}`);
    }
    lines.push(`    }`);
  }

  lines.push('');

  // Emit relationships from FK declarations
  for (const [tableName, table] of Object.entries(registry.tables)) {
    for (const fk of table.fk) {
      const [refTable] = fk.split('.');
      // Determine cardinality: spine→spoke is 1:N, unless 1:1 (same PK)
      const isOneToOne = table.pk === registry.universal_join_key && refTable === registry.spine_table;
      const card = isOneToOne ? '||--||' : '||--o{';
      lines.push(`    ${refTable} ${card} ${tableName} : ""`);
    }
  }

  lines.push('```');
  lines.push('');

  // ── Column ID Index ──
  lines.push('## Column ID Index');
  lines.push('');
  lines.push('| Column ID | Type | Required | Description |');
  lines.push('|-----------|------|----------|-------------|');

  for (const [tableName, table] of Object.entries(registry.tables)) {
    for (const col of table.columns) {
      const colId = `${schema}.${tableName}.${col.name}`;
      const req = col.required ? 'YES' : 'NO';
      lines.push(`| ${colId} | ${col.type} | ${req} | ${col.description} |`);
    }
  }

  lines.push('');

  return lines.join('\n');
}

// ── Main ───────────────────────────────────────────────────────────────────

/**
 * Returns a map of relative file paths to their expected generated content.
 * Used by verify-codegen.ts for drift detection.
 */
export function generateAll(registry: Registry): Map<string, string> {
  const files = new Map<string, string>();

  for (const [spokeName, spoke] of Object.entries(registry.spokes)) {
    files.set(
      `src/data/spokes/${spokeName}/types.ts`,
      generateTypesTs(spokeName, spoke, registry.tables, registry)
    );
    files.set(
      `src/data/spokes/${spokeName}/schema.ts`,
      generateSchemaTs(spokeName, spoke, registry.tables, registry)
    );
  }

  files.set('src/data/spokes/index.ts', generateBarrelIndex(registry.spokes));
  files.set('src/data/ERD.md', generateErd(registry));

  return files;
}

function main() {
  console.log('Loading registry...');
  const registry = loadRegistry();

  console.log(`Registry v${registry.version}: ${registry.total_tables} tables, ${Object.keys(registry.spokes).length} spokes`);

  // Ensure directories exist
  for (const spokeName of Object.keys(registry.spokes)) {
    const dir = path.join(SPOKES_DIR, spokeName);
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.mkdirSync(HUB_DIR, { recursive: true });

  // Generate per-spoke files
  for (const [spokeName, spoke] of Object.entries(registry.spokes)) {
    const spokeDir = path.join(SPOKES_DIR, spokeName);

    // types.ts
    const typesContent = generateTypesTs(spokeName, spoke, registry.tables, registry);
    fs.writeFileSync(path.join(spokeDir, 'types.ts'), typesContent, 'utf8');
    console.log(`  Generated ${spokeName}/types.ts`);

    // schema.ts
    const schemaContent = generateSchemaTs(spokeName, spoke, registry.tables, registry);
    fs.writeFileSync(path.join(spokeDir, 'schema.ts'), schemaContent, 'utf8');
    console.log(`  Generated ${spokeName}/schema.ts`);
  }

  // Barrel index
  const indexContent = generateBarrelIndex(registry.spokes);
  fs.writeFileSync(path.join(SPOKES_DIR, 'index.ts'), indexContent, 'utf8');
  console.log(`  Generated spokes/index.ts`);

  // ERD
  const erdContent = generateErd(registry);
  fs.writeFileSync(ERD_PATH, erdContent, 'utf8');
  console.log(`  Generated ERD.md`);

  console.log(`\nDone. Generated ${Object.keys(registry.spokes).length * 2 + 2} files from registry v${registry.version}.`);
}

// Only run main() when executed directly (not imported)
const isDirectRun = process.argv[1] &&
  path.resolve(process.argv[1]).replace(/\.(ts|js|mjs)$/, '') ===
  path.resolve(__filename).replace(/\.(ts|js|mjs)$/, '');

if (isDirectRun) {
  main();
}
