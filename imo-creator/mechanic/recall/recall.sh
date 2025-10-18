#!/usr/bin/env bash
set -euo pipefail

TARGET="${1:-}"
if [ -z "$TARGET" ]; then
  echo "Usage: npm run recall -- ../path/to/existing-repo"
  exit 1
fi

echo "[Recall] Analyzing $TARGET ..."

# Run compliance check first
COMPLIANCE_SCORE=0
if [ -f "tools/repo_compliance_check.py" ]; then
  echo "[Recall] Running compliance check..."
  python "tools/repo_compliance_check.py" "$TARGET" || true
fi

# Ensure .env.example exists with required keys (no real values)
if [ ! -f "$TARGET/.env.example" ]; then
  echo "[Recall] Creating .env.example from schema..."
  cat > "$TARGET/.env.example" << 'ENV'
APP_NAME=
IMO_MASTER_ERROR_ENDPOINT=
IMO_ERROR_API_KEY=
NEON_DATABASE_URL=
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Optional:
# OPENAI_API_KEY=
# ANTHROPIC_API_KEY=
# SUPABASE_URL=
# SUPABASE_ANON_KEY=
# VERCEL_URL=
# VERCEL_ENV=
# PORT=
ENV
  echo "[Recall] ✅ Created .env.example"
fi

# Add logging shim if not present
if [ ! -f "$TARGET/src/imo-logger.ts" ] && [ ! -f "$TARGET/src/imo-logger.js" ]; then
  mkdir -p "$TARGET/src"
  cp "src/imo-logger.ts" "$TARGET/src/imo-logger.ts"
  echo "[Recall] ✅ Added logging shim (write-only)"
fi

# Add compliance monitoring if not present
if [ ! -f "$TARGET/.imo-compliance.json" ]; then
  cat > "$TARGET/.imo-compliance.json" << JSON
{
  "version": "1.0.0",
  "imo_creator_version": "1.0.0",
  "last_check": "$(date -Iseconds 2>/dev/null || date)",
  "last_update": "$(date -Iseconds 2>/dev/null || date)",
  "check_interval_hours": 24,
  "auto_update": false,
  "compliance_level": "standard",
  "repo_metadata": {
    "processed_by_imo": true,
    "processing_date": "$(date -Iseconds 2>/dev/null || date)",
    "initial_compliance_score": 50,
    "current_compliance_score": 50,
    "repo_name": "$(basename "$TARGET")",
    "processed_by": "mechanic_recall"
  }
}
JSON
  echo "[Recall] ✅ Added compliance configuration"
fi

# Add compliance check script if not present
if [ ! -f "$TARGET/imo-compliance-check.py" ]; then
  if [ -f "templates/imo-compliance-check.py" ]; then
    cp "templates/imo-compliance-check.py" "$TARGET/imo-compliance-check.py"
    chmod +x "$TARGET/imo-compliance-check.py"
    echo "[Recall] ✅ Added compliance check script"
  fi
fi

# Add HEIR error handling configuration
echo "[Recall] Integrating HEIR error handling..."
if [ ! -f "$TARGET/.heir-config.yaml" ]; then
  cat > "$TARGET/.heir-config.yaml" << 'HEIR'
doctrine:
  version: "HEIR/1.0"
  app_name: "${APP_NAME}"
  db: "shq"
  subhive: "03"
  altitude_layers:
    - layer: 30
      description: "Strategic orchestration"
    - layer: 20
      description: "Tactical processing"
    - layer: 10
      description: "Implementation"
    - layer: 5
      description: "Validation"

validation:
  enabled: true
  strict_mode: false
  auto_fix: true

error_handling:
  capture_all: true
  log_to_master: true
  retry_strategy: "exponential_backoff"
  max_retries: 3
  error_categories:
    - name: "database"
      severity: "high"
      retry: true
    - name: "network"
      severity: "medium"
      retry: true
    - name: "validation"
      severity: "low"
      retry: false

monitoring:
  enabled: true
  error_log_path: "./logs/errors.ndjson"
  master_error_endpoint: "${IMO_MASTER_ERROR_ENDPOINT}"
  sidecar_url: "${IMOCREATOR_SIDECAR_URL}"
HEIR
  echo "[Recall] ✅ Added HEIR error handling configuration"
fi

# Add error handler utility if not present
if [ ! -f "$TARGET/src/heir-error-handler.js" ] && [ ! -f "$TARGET/src/heir-error-handler.ts" ]; then
  mkdir -p "$TARGET/src"
  cat > "$TARGET/src/heir-error-handler.js" << 'ERRORJS'
/**
 * HEIR Error Handler
 * Provides hierarchical error handling with altitude-based retry logic
 */

import { logError, logInfo } from "./imo-logger.ts";
import fs from "fs/promises";
import path from "path";

const ERROR_LOG_PATH = process.env.ERROR_LOG_PATH || "./logs/errors.ndjson";
const MAX_RETRIES = parseInt(process.env.HEIR_MAX_RETRIES || "3");

export class HEIRError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = "HEIRError";
    this.category = options.category || "general";
    this.severity = options.severity || "medium";
    this.altitude = options.altitude || 10;
    this.retryable = options.retryable !== false;
    this.context = options.context || {};
    this.timestamp = new Date().toISOString();
  }
}

export async function handleError(error, context = {}) {
  const heirError = error instanceof HEIRError ? error : new HEIRError(error.message, {
    category: context.category,
    severity: context.severity,
    altitude: context.altitude,
    retryable: context.retryable,
    context: { ...context, originalError: error.stack }
  });

  // Log to file
  await logErrorToFile(heirError);

  // Log to master endpoint
  await logError(error, {
    heir_category: heirError.category,
    heir_severity: heirError.severity,
    heir_altitude: heirError.altitude,
    ...context
  });

  return heirError;
}

async function logErrorToFile(error) {
  try {
    const logDir = path.dirname(ERROR_LOG_PATH);
    await fs.mkdir(logDir, { recursive: true });

    const logEntry = JSON.stringify({
      timestamp: error.timestamp,
      name: error.name,
      message: error.message,
      category: error.category,
      severity: error.severity,
      altitude: error.altitude,
      retryable: error.retryable,
      context: error.context
    }) + "\n";

    await fs.appendFile(ERROR_LOG_PATH, logEntry);
  } catch (err) {
    console.error("Failed to log error to file:", err);
  }
}

export async function withRetry(fn, options = {}) {
  const maxRetries = options.maxRetries || MAX_RETRIES;
  const retryDelay = options.retryDelay || 1000;
  const backoffMultiplier = options.backoffMultiplier || 2;

  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        const delay = retryDelay * Math.pow(backoffMultiplier, attempt);
        await logInfo(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`, {
          error: error.message,
          altitude: options.altitude
        });
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw await handleError(lastError, {
    category: "retry_exhausted",
    severity: "high",
    context: { maxRetries, attempts: maxRetries + 1 }
  });
}

export function categorizeError(error) {
  const message = error.message.toLowerCase();

  if (message.includes("database") || message.includes("sql") || message.includes("connection")) {
    return { category: "database", severity: "high", retryable: true };
  }
  if (message.includes("network") || message.includes("fetch") || message.includes("timeout")) {
    return { category: "network", severity: "medium", retryable: true };
  }
  if (message.includes("validation") || message.includes("invalid")) {
    return { category: "validation", severity: "low", retryable: false };
  }

  return { category: "general", severity: "medium", retryable: false };
}
ERRORJS
  echo "[Recall] ✅ Added HEIR error handler utility"
fi

# Check for missing standard files and offer to add them
MISSING_FILES=""
[ ! -f "$TARGET/README.md" ] && MISSING_FILES="$MISSING_FILES README.md"
[ ! -f "$TARGET/LICENSE" ] && MISSING_FILES="$MISSING_FILES LICENSE"
[ ! -f "$TARGET/CONTRIBUTING.md" ] && MISSING_FILES="$MISSING_FILES CONTRIBUTING.md"
[ ! -f "$TARGET/.github/workflows/ci.yml" ] && [ ! -f "$TARGET/.github/workflows/ci.yaml" ] && MISSING_FILES="$MISSING_FILES .github/workflows/ci.yml"

if [ -n "$MISSING_FILES" ]; then
  echo "[Recall] Missing standard files:$MISSING_FILES"
  echo "[Recall] Run compliance fixer to add them: python tools/repo_compliance_fixer.py $TARGET"
fi

# Run HEIR validation check
echo "[Recall] Running HEIR validation..."
if [ -f "packages/heir/checks.py" ]; then
  python -c "from packages.heir.checks import validate_heir_config; import yaml; config = yaml.safe_load(open('$TARGET/.heir-config.yaml')); print('HEIR validation:', validate_heir_config({'doctrine': config.get('doctrine', {})}))" 2>/dev/null || echo "[Recall] ⚠️  HEIR validation not available"
fi

# Generate deep wiki with branch specifications if not present
if [ ! -d "$TARGET/docs/wiki" ]; then
  echo "[Recall] Generating deep wiki with branch specifications..."
  bash tools/deep_wiki_generator.sh "$TARGET" "$(basename "$TARGET")"
  echo "[Recall] ✅ Added deep wiki system with branch architecture"
elif [ ! -f "$TARGET/docs/branches/schema.json" ]; then
  echo "[Recall] Upgrading existing wiki to branch specification system..."
  bash tools/deep_wiki_generator.sh "$TARGET" "$(basename "$TARGET")"
  echo "[Recall] ✅ Upgraded to branch-driven wiki system"
else
  echo "[Recall] Branch-driven wiki already exists - preserving existing content"
fi

# Run subagent delegation for complex repairs
echo "[Recall] Checking for complex repair tasks..."
if [ -f "mechanic/recall/subagent-delegator.py" ]; then
  python "mechanic/recall/subagent-delegator.py" "$TARGET" --auto-approve || echo "[Recall] ⚠️  Some repairs could not be delegated"
fi

echo "[Recall] ✅ Recall complete"
echo ""
echo "[Recall] Features Added:"
echo "  ✅ HEIR error handling configured"
echo "  ✅ Compliance monitoring enabled"
echo "  ✅ Error handler utility installed"
echo "  ✅ Subagent delegation available"
echo ""
echo "[Recall] Next steps:"
echo "  1. Review changes in $TARGET"
echo "  2. Run HEIR validation: python packages/heir/checks.py"
echo "  3. Review repair delegations: cat $TARGET/.repair-delegations.json"
echo "  4. Commit when ready"
echo "  5. Set environment variables in deployment platform"