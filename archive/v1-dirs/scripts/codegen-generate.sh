#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# CODEGEN GENERATE — Registry-First Schema Generator (Wrapper)
# ═══════════════════════════════════════════════════════════════════════════════
# Authority: imo-creator (Constitutional)
# Purpose: Wrapper that delegates to this repo's TypeScript codegen
# Usage: ./scripts/codegen-generate.sh
#
# This repo uses a TypeScript-based codegen (scripts/codegen-schema.ts) instead
# of the generic shell-based template. This wrapper provides compatibility with
# the parent template's pre-commit hook and CI expectations.
# ═══════════════════════════════════════════════════════════════════════════════

set -e

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  CODEGEN GENERATE — Registry-First Schema Generator"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "  Delegating to: npx tsx scripts/codegen-schema.ts"
echo ""

npx tsx scripts/codegen-schema.ts
