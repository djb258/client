#!/usr/bin/env bash
# guard-generated.sh — Generated Folder Protection Gate
#
# Rejects commits that modify generated files without also modifying
# the column registry. Prevents manual edits that will be overwritten
# on the next codegen run.
#
# Usage:
#   bash scripts/guard-generated.sh          (manual check)
#   npm run codegen:guard                    (npm script alias)
#   .git/hooks/pre-commit → calls this      (pre-commit hook)
#
# Exit codes:
#   0 — No generated files touched, or registry also changed
#   1 — Generated files modified without registry change
#
# Generated file patterns (from codegen-schema.ts):
#   src/data/spokes/*/types.ts
#   src/data/spokes/*/schema.ts
#   src/data/spokes/index.ts
#   src/data/ERD.md

set -euo pipefail

REGISTRY="src/data/db/registry/clnt_column_registry.yml"

# Get staged files (cached = staged for commit)
STAGED=$(git diff --cached --name-only --diff-filter=ACMR 2>/dev/null || true)

if [ -z "$STAGED" ]; then
  # Nothing staged — nothing to guard
  exit 0
fi

# Check if any generated files are in the staged set
GENERATED_TOUCHED=()
while IFS= read -r file; do
  case "$file" in
    src/data/spokes/*/types.ts|\
    src/data/spokes/*/schema.ts|\
    src/data/spokes/index.ts|\
    src/data/ERD.md)
      GENERATED_TOUCHED+=("$file")
      ;;
  esac
done <<< "$STAGED"

if [ ${#GENERATED_TOUCHED[@]} -eq 0 ]; then
  # No generated files touched — all clear
  exit 0
fi

# Generated files are staged — check if registry is also staged
REGISTRY_CHANGED=false
while IFS= read -r file; do
  if [ "$file" = "$REGISTRY" ]; then
    REGISTRY_CHANGED=true
    break
  fi
done <<< "$STAGED"

if [ "$REGISTRY_CHANGED" = true ]; then
  # Registry is also changed — legitimate codegen update
  exit 0
fi

# FAIL: generated files edited without registry change
echo ""
echo "CODEGEN GUARD: Generated files modified without registry change."
echo ""
echo "The following files are generated from the column registry and"
echo "must not be hand-edited. Any manual changes will be overwritten"
echo "on the next codegen run."
echo ""
echo "Modified generated files:"
for f in "${GENERATED_TOUCHED[@]}"; do
  echo "  - $f"
done
echo ""
echo "To fix, choose one of:"
echo "  1. Edit the registry instead:  $REGISTRY"
echo "     Then regenerate:            npx tsx scripts/codegen-schema.ts"
echo "  2. If this is a legitimate codegen update, stage the registry too:"
echo "     git add $REGISTRY"
echo ""
exit 1
