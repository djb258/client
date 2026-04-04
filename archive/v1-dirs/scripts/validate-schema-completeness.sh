#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# VALIDATE SCHEMA COMPLETENESS — DBA Enforcement Gate (Wrapper)
# ═══════════════════════════════════════════════════════════════════════════════
# Authority: imo-creator (Constitutional)
# Purpose: Wrapper that delegates to this repo's TypeScript validator
# Usage: ./scripts/validate-schema-completeness.sh
# Exit: 0 = complete, 1 = violations found, 2 = error
#
# This repo uses a TypeScript-based validator (scripts/validate-schema.ts) instead
# of the generic shell-based template (which requires yq). This wrapper provides
# compatibility with the parent template's pre-commit hook (CHECK 12) and CI.
# ═══════════════════════════════════════════════════════════════════════════════

set -e

npx tsx scripts/validate-schema.ts
