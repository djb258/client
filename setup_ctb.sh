#!/bin/bash
# Christmas Tree Backbone (CTB) Bootstrap Script
# Version: 1.0.0
# Purpose: Sets up CTB structure in any repository with global scripts and workflows

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CTB_VERSION="1.0.0"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_CTB="${SCRIPT_DIR}/ctb"

# Functions
print_header() {
  echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║   Christmas Tree Backbone (CTB) Bootstrap v${CTB_VERSION}    ║${NC}"
  echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
  echo ""
}

print_success() {
  echo -e "${GREEN}✓${NC} $1"
}

print_error() {
  echo -e "${RED}✗${NC} $1"
}

print_info() {
  echo -e "${BLUE}→${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

usage() {
  echo "Usage: $0 <target-repo-path> [options]"
  echo ""
  echo "Options:"
  echo "  --force           Overwrite existing CTB structure"
  echo "  --no-global       Skip copying global scripts"
  echo "  --dry-run         Show what would be done without making changes"
  echo "  --help            Show this help message"
  echo ""
  echo "Examples:"
  echo "  $0 /path/to/new-repo"
  echo "  $0 ../my-project --force"
  echo "  $0 . --dry-run"
  exit 1
}

create_ctb_structure() {
  local target="$1"
  local dry_run="$2"

  print_info "Creating CTB directory structure..."

  local dirs=(
    "ctb/sys/scripts"
    "ctb/sys/tools"
    "ctb/sys/factory"
    "ctb/sys/mechanic"
    "ctb/sys/mcp-servers"
    "ctb/sys/tests"
    "ctb/sys/global-factory"
    "ctb/ai/agents"
    "ctb/ai/modules"
    "ctb/ai/packages"
    "ctb/data/db"
    "ctb/data/firebase"
    "ctb/docs"
    "ctb/ui/src"
    "ctb/ui/components"
    "ctb/ui/pages"
    "ctb/ui/apps"
    "ctb/ui/api"
    "ctb/meta/workflows"
    "ctb/meta/doctrine"
    "ctb/meta/ops"
    "ctb/meta/config"
    "ctb/meta/templates"
    "logs"
  )

  for dir in "${dirs[@]}"; do
    if [ "$dry_run" = "true" ]; then
      print_info "Would create: ${target}/${dir}"
    else
      mkdir -p "${target}/${dir}"
      print_success "Created: ${dir}"
    fi
  done
}

copy_global_scripts() {
  local target="$1"
  local dry_run="$2"

  print_info "Copying global scripts and workflows..."

  local global_factory="${SOURCE_CTB}/sys/global-factory"

  if [ ! -d "$global_factory" ]; then
    print_warning "Global factory not found at: $global_factory"
    print_info "Creating global factory reference..."

    if [ "$dry_run" = "false" ]; then
      mkdir -p "$global_factory"

      # Create reference scripts
      cat > "$global_factory/README.md" << 'EOF'
# Global Factory

This directory contains global scripts and workflows that are synchronized across all CTB-compliant repositories.

## Contents

- `scripts/` - Shared utility scripts
- `workflows/` - GitHub Actions workflows
- `tools/` - Common development tools
- `compliance/` - Compliance checking tools

## Usage

Scripts in this directory are copied to new repositories via `setup_ctb.sh`.

## Maintenance

To update global scripts across all repos, use the auto-sync feature in `global-config.yaml`.
EOF
    fi
  fi

  # Copy global scripts if they exist
  if [ -d "${SOURCE_CTB}/sys/scripts" ] && [ "$dry_run" = "false" ]; then
    cp -r "${SOURCE_CTB}/sys/scripts/"* "${target}/ctb/sys/global-factory/" 2>/dev/null || true
    print_success "Global scripts copied"
  fi

  # Copy global workflows
  if [ -d "${SOURCE_CTB}/meta/workflows" ] && [ "$dry_run" = "false" ]; then
    cp -r "${SOURCE_CTB}/meta/workflows/"* "${target}/ctb/sys/global-factory/" 2>/dev/null || true
    print_success "Global workflows copied"
  fi
}

create_global_config() {
  local target="$1"
  local dry_run="$2"
  local config_file="${target}/global-config.yaml"

  print_info "Creating global-config.yaml..."

  if [ -f "$config_file" ]; then
    print_warning "global-config.yaml already exists"
    return
  fi

  if [ "$dry_run" = "true" ]; then
    print_info "Would create: global-config.yaml"
    return
  fi

  cat > "$config_file" << 'EOF'
# CTB Global Configuration
# Version: 1.0.0

meta:
  ctb_version: "1.0.0"
  repo_type: "standard"
  last_sync: null

structure:
  ctb:
    sys: "System & Infrastructure"
    ai: "AI & Agent Configurations"
    data: "Data & Database"
    docs: "Documentation"
    ui: "User Interface"
    meta: "Metadata & Configuration"
  logs: "Application Logs"

doctrine_enforcement:
  enabled: true
  ctb_factory: "ctb/sys/global-factory/"
  auto_sync: true
  min_score: 90
  composio_scenario: "CTB_Compliance_Cycle"

compliance:
  checks:
    - name: "ctb_structure"
      description: "Verify CTB directory structure exists"
      severity: "critical"
      auto_fix: true
    - name: "path_references"
      description: "Check all paths use CTB structure"
      severity: "high"
      auto_fix: false
    - name: "documentation"
      description: "Ensure CTB_INDEX.md is up to date"
      severity: "medium"
      auto_fix: true

  enforcement_level: "warn"  # Options: strict, warn, disabled

  reports:
    directory: "logs/compliance"
    format: "json"
    retention_days: 90

sync:
  enabled: true
  schedule: "daily"  # Options: hourly, daily, weekly, manual
  sources:
    - type: "github"
      repo: "djb258/client"
      branch: "main"
      path: "ctb/sys/global-factory"
  targets:
    - "ctb/sys/global-factory/"
    - ".github/workflows/"

  notifications:
    on_sync: true
    on_failure: true
    channels:
      - type: "log"
        path: "logs/sync.log"

integration:
  composio:
    enabled: true
    scenarios:
      - name: "CTB_Compliance_Cycle"
        trigger: "on_commit"
        actions:
          - "compliance_check"
          - "sync_global_scripts"
          - "generate_report"
      - name: "CTB_Sync_Global"
        trigger: "schedule"
        schedule: "0 2 * * *"  # 2 AM daily
        actions:
          - "fetch_global_factory"
          - "update_local_scripts"
          - "notify_on_changes"

  heir:
    enabled: true
    altitude_layers:
      - layer: 30
        description: "Strategic orchestration"
        compliance_role: "policy_enforcement"
      - layer: 20
        description: "Tactical processing"
        compliance_role: "sync_coordination"
      - layer: 10
        description: "Implementation"
        compliance_role: "file_operations"
      - layer: 5
        description: "Validation"
        compliance_role: "structure_verification"

hooks:
  pre_commit:
    - script: "ctb/sys/global-factory/compliance-check.sh"
      required: true
  post_merge:
    - script: "ctb/sys/global-factory/sync-check.sh"
      required: false

telemetry:
  enabled: true
  events:
    - "ctb.structure.created"
    - "ctb.compliance.checked"
    - "ctb.sync.completed"
    - "ctb.violation.detected"
  endpoint: "${IMOCREATOR_SIDECAR_URL}/telemetry"

paths:
  scripts: "ctb/sys/scripts"
  tools: "ctb/sys/tools"
  docs: "ctb/docs"
  logs: "logs"
  config: "ctb/meta/config"

maintenance:
  auto_cleanup: true
  archive_old_logs: true
  log_retention_days: 90
  temp_file_cleanup: true
EOF

  print_success "Created global-config.yaml"
}

create_ctb_index() {
  local target="$1"
  local dry_run="$2"
  local index_file="${target}/CTB_INDEX.md"

  print_info "Creating CTB_INDEX.md..."

  if [ "$dry_run" = "true" ]; then
    print_info "Would create: CTB_INDEX.md"
    return
  fi

  cat > "$index_file" << 'EOF'
# Christmas Tree Backbone (CTB) Index

**Repository:** [Repository Name]
**Created:** $(date +%Y-%m-%d)
**CTB Version:** 1.0

## Overview

This repository follows the Christmas Tree Backbone (CTB) structure for standardized organization.

## Structure

```
ctb/
├── sys/       System & Infrastructure
├── ai/        AI & Agent Configurations
├── data/      Data & Database
├── docs/      Documentation
├── ui/        User Interface
└── meta/      Metadata & Configuration
logs/          Application Logs
```

## Path Mappings

Document your path mappings here as you organize files into the CTB structure.

### CTB/SYS - System & Infrastructure

| Old Path | New Path | Description |
|----------|----------|-------------|
| TBD | `ctb/sys/` | Add mappings |

### CTB/AI - AI & Agent Configurations

| Old Path | New Path | Description |
|----------|----------|-------------|
| TBD | `ctb/ai/` | Add mappings |

### CTB/DATA - Data & Database

| Old Path | New Path | Description |
|----------|----------|-------------|
| TBD | `ctb/data/` | Add mappings |

### CTB/DOCS - Documentation

| Old Path | New Path | Description |
|----------|----------|-------------|
| TBD | `ctb/docs/` | Add mappings |

### CTB/UI - User Interface

| Old Path | New Path | Description |
|----------|----------|-------------|
| TBD | `ctb/ui/` | Add mappings |

### CTB/META - Metadata & Configuration

| Old Path | New Path | Description |
|----------|----------|-------------|
| TBD | `ctb/meta/` | Add mappings |

## Bootstrap

This repository was bootstrapped with CTB using:

```bash
setup_ctb.sh $(pwd)
```

## Compliance

- **Minimum Score:** 90%
- **Auto-sync:** Enabled
- **Enforcement:** See `global-config.yaml`

---

**Last Updated:** $(date +%Y-%m-%d)
EOF

  print_success "Created CTB_INDEX.md"
}

create_compliance_script() {
  local target="$1"
  local dry_run="$2"
  local script_file="${target}/ctb/sys/global-factory/compliance-check.sh"

  print_info "Creating compliance check script..."

  if [ "$dry_run" = "true" ]; then
    print_info "Would create: compliance-check.sh"
    return
  fi

  mkdir -p "$(dirname "$script_file")"

  cat > "$script_file" << 'EOF'
#!/bin/bash
# CTB Compliance Check Script
# Verifies repository follows CTB structure

set -e

SCORE=0
MAX_SCORE=100
REPORT_FILE="logs/compliance/$(date +%Y%m%d-%H%M%S)-compliance.json"

mkdir -p logs/compliance

echo "Running CTB compliance check..."

# Check CTB structure exists (40 points)
check_structure() {
  local points=0
  local required_dirs=("ctb/sys" "ctb/ai" "ctb/data" "ctb/docs" "ctb/ui" "ctb/meta" "logs")

  for dir in "${required_dirs[@]}"; do
    if [ -d "$dir" ]; then
      ((points+=5))
    fi
  done

  echo "Structure: $points/35"
  return $points
}

# Check global-config.yaml exists (20 points)
check_config() {
  if [ -f "global-config.yaml" ]; then
    echo "Config: 20/20"
    return 20
  else
    echo "Config: 0/20"
    return 0
  fi
}

# Check CTB_INDEX.md exists (20 points)
check_index() {
  if [ -f "CTB_INDEX.md" ]; then
    echo "Index: 20/20"
    return 20
  else
    echo "Index: 0/20"
    return 0
  fi
}

# Check logs directory (10 points)
check_logs() {
  if [ -d "logs" ]; then
    echo "Logs: 10/10"
    return 10
  else
    echo "Logs: 0/10"
    return 0
  fi
}

# Check global factory (10 points)
check_global_factory() {
  if [ -d "ctb/sys/global-factory" ]; then
    echo "Global Factory: 10/10"
    return 10
  else
    echo "Global Factory: 0/10"
    return 0
  fi
}

# Run checks
SCORE=0
SCORE=$((SCORE + $(check_structure || echo 0)))
SCORE=$((SCORE + $(check_config || echo 0)))
SCORE=$((SCORE + $(check_index || echo 0)))
SCORE=$((SCORE + $(check_logs || echo 0)))
SCORE=$((SCORE + $(check_global_factory || echo 0)))

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "CTB Compliance Score: $SCORE/$MAX_SCORE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Generate JSON report
cat > "$REPORT_FILE" << REPORT
{
  "timestamp": "$(date -Iseconds)",
  "score": $SCORE,
  "max_score": $MAX_SCORE,
  "percentage": $((SCORE * 100 / MAX_SCORE)),
  "status": "$( [ $SCORE -ge 90 ] && echo "pass" || echo "fail" )"
}
REPORT

if [ $SCORE -ge 90 ]; then
  echo "✓ Compliance check PASSED"
  exit 0
else
  echo "✗ Compliance check FAILED (minimum: 90)"
  exit 1
fi
EOF

  chmod +x "$script_file"
  print_success "Created compliance-check.sh"
}

# Main script
main() {
  local target_repo=""
  local force=false
  local no_global=false
  local dry_run=false

  # Parse arguments
  while [[ $# -gt 0 ]]; do
    case $1 in
      --force)
        force=true
        shift
        ;;
      --no-global)
        no_global=true
        shift
        ;;
      --dry-run)
        dry_run=true
        shift
        ;;
      --help)
        usage
        ;;
      *)
        if [ -z "$target_repo" ]; then
          target_repo="$1"
        else
          print_error "Unknown argument: $1"
          usage
        fi
        shift
        ;;
    esac
  done

  # Validate arguments
  if [ -z "$target_repo" ]; then
    print_error "Target repository path required"
    usage
  fi

  # Convert relative path to absolute
  target_repo="$(cd "$target_repo" 2>/dev/null && pwd || echo "$target_repo")"

  # Print header
  print_header

  if [ "$dry_run" = "true" ]; then
    print_warning "DRY RUN MODE - No changes will be made"
    echo ""
  fi

  # Check if target exists
  if [ ! -d "$target_repo" ]; then
    print_error "Target directory does not exist: $target_repo"
    exit 1
  fi

  # Check if CTB already exists
  if [ -d "${target_repo}/ctb" ] && [ "$force" = "false" ]; then
    print_error "CTB structure already exists. Use --force to overwrite."
    exit 1
  fi

  print_info "Target repository: $target_repo"
  echo ""

  # Execute setup
  create_ctb_structure "$target_repo" "$dry_run"
  echo ""

  if [ "$no_global" = "false" ]; then
    copy_global_scripts "$target_repo" "$dry_run"
    echo ""
  fi

  create_global_config "$target_repo" "$dry_run"
  echo ""

  create_ctb_index "$target_repo" "$dry_run"
  echo ""

  create_compliance_script "$target_repo" "$dry_run"
  echo ""

  # Summary
  echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║              CTB Bootstrap Complete!                   ║${NC}"
  echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
  echo ""

  if [ "$dry_run" = "false" ]; then
    print_success "CTB structure created in: $target_repo"
    print_success "Global configuration: global-config.yaml"
    print_success "Index document: CTB_INDEX.md"
    print_success "Compliance script: ctb/sys/global-factory/compliance-check.sh"
    echo ""
    print_info "Next steps:"
    echo "  1. Review and customize global-config.yaml"
    echo "  2. Update CTB_INDEX.md with your path mappings"
    echo "  3. Move existing files into CTB structure"
    echo "  4. Run compliance check: ./ctb/sys/global-factory/compliance-check.sh"
  else
    print_info "This was a dry run. No changes were made."
    print_info "Run without --dry-run to apply changes."
  fi

  echo ""
}

# Run main
main "$@"
