#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# CODEGEN VERIFY — Registry-First Drift Detection (Wrapper)
# ═══════════════════════════════════════════════════════════════════════════════
# Authority: imo-creator (Constitutional)
# Purpose: Wrapper that delegates to this repo's TypeScript verifier
# Usage: ./scripts/codegen-verify.sh
# Exit: 0 = in sync, 1 = drift detected
#
# This repo uses a TypeScript-based verifier (scripts/verify-codegen.ts) instead
# of the generic shell-based template. This wrapper provides compatibility with
# the parent template's pre-commit hook (CHECK 9) and CI expectations.
# ═══════════════════════════════════════════════════════════════════════════════

set -e

npx tsx scripts/verify-codegen.ts
