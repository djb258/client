/**
 * verify-codegen.ts — Codegen Drift Detection Gate
 *
 * Regenerates all files from the column registry in-memory and compares
 * them against the actual files on disk. Exits non-zero if any file
 * is out of sync with the registry.
 *
 * Usage:
 *   npx tsx scripts/verify-codegen.ts        (CI / pre-commit)
 *   npm run codegen:verify                   (npm script alias)
 *
 * Exit codes:
 *   0 — All generated files match the registry
 *   1 — One or more files are out of sync (drift detected)
 *   2 — Registry load or generation error
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { loadRegistry, generateAll, ROOT } from './codegen-schema.js';

function main(): void {
  console.log('Verifying codegen output against column registry...\n');

  let registry;
  try {
    registry = loadRegistry();
  } catch (err) {
    console.error('ERROR: Failed to load column registry.');
    console.error(err);
    process.exit(2);
  }

  let expected: Map<string, string>;
  try {
    expected = generateAll(registry);
  } catch (err) {
    console.error('ERROR: Failed to generate expected output.');
    console.error(err);
    process.exit(2);
  }

  const drifted: string[] = [];
  const missing: string[] = [];

  for (const [relPath, expectedContent] of expected) {
    const absPath = path.join(ROOT, relPath);

    if (!fs.existsSync(absPath)) {
      missing.push(relPath);
      continue;
    }

    const actual = fs.readFileSync(absPath, 'utf8');
    if (actual !== expectedContent) {
      drifted.push(relPath);
    }
  }

  // Report results
  const total = expected.size;
  const ok = total - drifted.length - missing.length;

  if (drifted.length === 0 && missing.length === 0) {
    console.log(`PASS: All ${total} generated files match the registry (v${registry.version}).\n`);
    process.exit(0);
  }

  console.log('FAIL: Generated files are out of sync with the column registry.\n');

  if (missing.length > 0) {
    console.log(`Missing files (${missing.length}):`);
    for (const f of missing) {
      console.log(`  - ${f}  (file does not exist on disk)`);
    }
    console.log('');
  }

  if (drifted.length > 0) {
    console.log(`Drifted files (${drifted.length}):`);
    for (const f of drifted) {
      console.log(`  - ${f}  (content differs from registry)`);
    }
    console.log('');
  }

  console.log(`Summary: ${ok}/${total} OK, ${drifted.length} drifted, ${missing.length} missing`);
  console.log('\nTo fix: run `npx tsx scripts/codegen-schema.ts` to regenerate from the registry.');
  process.exit(1);
}

main();
