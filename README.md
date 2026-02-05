# CTB/META - Metadata & Configuration

**Branch:** `meta`
**Purpose:** Configuration files, IDE settings, dependency management, and workflow definitions

---

## 📁 Directory Structure

```
ctb/meta/
├── workflows/              # GitHub Actions workflows
│   └── .github/
│       └── workflows/
│           ├── ctb_enforcement.yml
│           └── migrate.yml
├── doctrine/               # Barton Doctrine configs
│   └── barton-doctrine/
│       └── config/
├── ops/                    # Operations configurations
│   └── barton-ops/
│       └── orbt/
├── config/                 # Application configurations
│   └── imo_registry.yaml
├── templates/              # Template files
│   └── imo-compliance-check.py
├── ctb_registry.json       # CTB file registry
├── enforcement_rules.json  # Compliance rules
├── DEPENDENCIES.md         # Inter-branch dependencies
└── README.md               # This file
```

## ⚙️ Configuration Files

### Global Configuration

**File:** `../../global-config.yaml` (at repo root)

Complete system-wide configuration including:
- CTB structure definitions
- Doctrine enforcement rules
- Compliance settings
- Sync configuration
- Composio integration
- HEIR altitude layers

**Key Sections:**
```yaml
doctrine_enforcement:
  enabled: true
  ctb_factory: "ctb/sys/global-factory/"
  auto_sync: true
  min_score: 90
  composio_scenario: "CTB_Compliance_Cycle"
```

### CTB Registry

**File:** `ctb_registry.json` (78 KB)

Complete registry of all CTB-compliant files with:
- File paths
- CTB metadata
- Compliance status
- Last modified timestamps

**Structure:**
```json
{
  "generated": "2025-10-23T...",
  "compliance_score": 95,
  "stats": {...},
  "files": {
    "sys/global-factory/scripts/ctb_tagger.py": {
      "branch": "sys",
      "metadata": {
        "ctb_id": "CTB-...",
        "ctb_branch": "sys",
        "ctb_path": "...",
        "ctb_version": "1.0.0"
      },
      "size": 12345,
      "modified": "2025-10-23T..."
    }
  }
}
```

### Enforcement Rules

**File:** `enforcement_rules.json` (526 bytes)

Compliance enforcement rules for CI/CD:

```json
{
  "version": "1.0.0",
  "enforcement": {
    "required_metadata": [
      "ctb_id",
      "ctb_branch",
      "ctb_path",
      "ctb_version"
    ],
    "id_format": "^CTB-[A-F0-9]{12}$",
    "valid_branches": ["sys", "ai", "data", "docs", "ui", "meta"],
    "min_compliance_score": 90
  },
  "auto_remediation": {
    "enabled": true,
    "on_commit": true,
    "on_pr": true,
    "block_on_fail": false
  }
}
```

## 🔄 Workflows

### GitHub Actions

**Location:** `workflows/.github/workflows/`

#### CTB Enforcement Workflow

**File:** `ctb_enforcement.yml`

**Triggers:**
- Push to main/develop
- Pull requests
- Weekly schedule (Sundays 2 AM UTC)
- Manual dispatch

**Jobs:**
1. **ctb-tagger** - Tag files with metadata
2. **ctb-audit** - Run compliance audit
3. **ctb-remediate** - Fix issues automatically
4. **ctb-summary** - Generate workflow summary
5. **notify** - Send notifications

**Usage:**
```bash
# Trigger workflow manually
gh workflow run ctb_enforcement.yml

# With specific mode
gh workflow run ctb_enforcement.yml -f mode=audit
gh workflow run ctb_enforcement.yml -f mode=remediate
```

## 🎯 Barton Doctrine

### Doctrine Configuration

**Location:** `doctrine/barton-doctrine/`

Barton Doctrine compliance configuration:
- ID generation rules
- Naming conventions
- Process standards
- Quality gates

### HEIR Configuration

**File:** `../../heir.doctrine.yaml` (at repo root)

HEIR (Hierarchical Error-handling, ID management, Reporting) configuration:

```yaml
doctrine:
  unique_id: "imo-${TIMESTAMP}-${RANDOM_HEX}"
  process_id: "imo-process-${SESSION_ID}"
  schema_version: "HEIR/1.0"

deliverables:
  services:
    - name: "mcp"
      port: 7001
    - name: "sidecar"
      port: 8000

contracts:
  acceptance:
    - "All HEIR checks pass in CI"
    - "Sidecar event emitted on app start"
```

## 🔧 Dependency Rules

### Dependency Management

**File:** [DEPENDENCIES.md](DEPENDENCIES.md)

Complete inter-branch dependency map showing:
- Direct dependencies
- Transitive dependencies
- Circular dependency prevention
- Update protocols

**Dependency Flow:**
```
meta → sys → ai → data → ui
  ↓     ↓     ↓     ↓
configuration → infrastructure → intelligence → storage → presentation
```

### Version Constraints

```yaml
# Example dependency constraints
dependencies:
  node: ">=18.0.0"
  python: ">=3.11"
  postgres: ">=14.0"

  packages:
    heir: "^1.0.0"
    sidecar: "^1.0.0"
```

## 🛠️ IDE Configuration

### VS Code Settings

**Location:** `../../.vscode/settings.json`

Recommended VS Code settings for the project:

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll": true
  },
  "files.associations": {
    "*.mmd": "mermaid"
  },
  "python.linting.enabled": true,
  "python.linting.pylintEnabled": true,
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

### Editor Config

**File:** `../../.editorconfig`

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true

[*.{js,ts,tsx,jsx}]
indent_style = space
indent_size = 2

[*.{py}]
indent_style = space
indent_size = 4
```

## 📋 Templates

### Available Templates

**Location:** `templates/`

| Template | Purpose |
|----------|---------|
| imo-compliance-check.py | Compliance checking script |
| .env.example | Environment variables template |
| component-template.tsx | React component template |
| service-template.py | Python service template |

### Using Templates

```bash
# Copy template
cp ctb/meta/templates/imo-compliance-check.py ./

# Customize for your needs
vim imo-compliance-check.py
```

## 🔐 Environment Configuration

### Environment Files

Multiple `.env.example` files across the repository:
- `ctb/sys/api/.env.example` - API configuration
- `ctb/data/.env.example` - Database configuration
- `ctb/ui/.env.example` - UI configuration

### Environment Variables Structure

```bash
# System
NODE_ENV=development
LOG_LEVEL=info

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/db

# Services
GARAGE_MCP_URL=http://localhost:7001
IMOCREATOR_SIDECAR_URL=http://localhost:8000

# API Keys
COMPOSIO_API_KEY=<key>
FIREBASE_API_KEY=<key>
```

## 📊 Registry Management

### Updating CTB Registry

```bash
# Regenerate registry
python ctb/sys/global-factory/scripts/ctb_audit_generator.py ctb/

# View registry
cat ctb/meta/ctb_registry.json | jq '.compliance_score'

# Query registry
cat ctb/meta/ctb_registry.json | jq '.files | keys | length'
```

### Registry Statistics

```bash
# Get file count by branch
cat ctb/meta/ctb_registry.json | \
  jq -r '.files | to_entries | .[].value.branch' | \
  sort | uniq -c

# Get compliance score
cat ctb/meta/ctb_registry.json | jq '.compliance_score'
```

## 🔄 Configuration Sync

### Sync Configuration

Configurations are synced according to `global-config.yaml`:

```yaml
sync:
  enabled: true
  schedule: "daily"
  sources:
    - type: "github"
      repo: "djb258/client"
      branch: "main"
      path: "ctb/sys/global-factory"
```

### Manual Sync

```bash
# Sync all configurations
git pull origin main -- ctb/meta/

# Sync specific config
git pull origin main -- global-config.yaml
```

## 🧪 Testing Configuration

### Config Validation

```bash
# Validate global-config.yaml
python -c "import yaml; yaml.safe_load(open('global-config.yaml'))"

# Validate heir.doctrine.yaml
python -c "import yaml; yaml.safe_load(open('heir.doctrine.yaml'))"

# Validate enforcement rules
python -c "import json; json.load(open('ctb/meta/enforcement_rules.json'))"
```

## 📚 Configuration Reference

### Global Config Sections

| Section | Purpose |
|---------|---------|
| `meta` | Repository metadata |
| `structure` | CTB directory structure |
| `doctrine_enforcement` | Compliance rules |
| `compliance` | Compliance checks |
| `sync` | Sync configuration |
| `integration` | Composio/HEIR integration |
| `hooks` | Git hooks |
| `telemetry` | Event tracking |
| `paths` | Directory paths |

### Enforcement Levels

```yaml
enforcement_level: "warn"  # Options: strict, warn, disabled
```

- **strict:** Block commits on violations
- **warn:** Warning messages only
- **disabled:** No enforcement

## 🔗 Quick Links

- **Global Config:** [../../global-config.yaml](../../global-config.yaml)
- **HEIR Doctrine:** [../../heir.doctrine.yaml](../../heir.doctrine.yaml)
- **CTB Registry:** [ctb_registry.json](ctb_registry.json)
- **Enforcement Rules:** [enforcement_rules.json](enforcement_rules.json)
- **Dependencies:** [DEPENDENCIES.md](DEPENDENCIES.md)
- **Workflows:** [workflows/.github/workflows/](workflows/.github/workflows/)

## 🐛 Troubleshooting

### Configuration Issues

```bash
# Validate all YAML files
find . -name "*.yaml" -o -name "*.yml" | \
  xargs -I {} sh -c 'python -c "import yaml; yaml.safe_load(open(\'{}\'))" || echo "Invalid: {}"'

# Validate all JSON files
find . -name "*.json" | \
  xargs -I {} sh -c 'python -c "import json; json.load(open(\'{}\'))" || echo "Invalid: {}"'
```

### Workflow Issues

```bash
# Check workflow syntax
gh workflow list

# View workflow runs
gh run list --workflow=ctb_enforcement.yml

# Debug workflow
gh run view <run-id> --log
```

---

**Last Updated:** 2025-10-23
**Maintained By:** CTB Meta System
**Version:** 1.0.0
