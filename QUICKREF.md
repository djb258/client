# CTB Quick Reference

**Version:** 1.0.0
**Last Updated:** 2025-10-23

---

## ⚡ Most Common Commands

```bash
# Check compliance score
python ctb/sys/global-factory/scripts/ctb_audit_generator.py ctb/ --quiet

# Auto-fix issues
python ctb/sys/global-factory/scripts/ctb_remediator.py ctb/

# Tag new files
python ctb/sys/global-factory/scripts/ctb_metadata_tagger.py ctb/

# Install pre-commit hook
bash ctb/sys/global-factory/install-hooks.sh
```

---

## 📊 Enforcement Commands

### Compliance Check

```bash
# Full compliance check with report
bash ctb/sys/global-factory/compliance-check.sh

# Quick score check (quiet mode)
python ctb/sys/global-factory/scripts/ctb_audit_generator.py ctb/ --quiet

# Verbose audit with details
python ctb/sys/global-factory/scripts/ctb_audit_generator.py ctb/ --verbose

# Generate JSON report
python ctb/sys/global-factory/scripts/ctb_audit_generator.py ctb/ --report logs/compliance/audit.json
```

### Auto-Tagging

```bash
# Tag entire ctb directory
python ctb/sys/global-factory/scripts/ctb_metadata_tagger.py ctb/

# Tag specific file
python ctb/sys/global-factory/scripts/ctb_metadata_tagger.py path/to/file.py

# Tag specific branch
python ctb/sys/global-factory/scripts/ctb_metadata_tagger.py ctb/sys/

# Dry run (preview only)
python ctb/sys/global-factory/scripts/ctb_metadata_tagger.py ctb/ --dry-run

# Tag with custom version
python ctb/sys/global-factory/scripts/ctb_metadata_tagger.py ctb/ --version 2.0.0

# Verbose output
python ctb/sys/global-factory/scripts/ctb_metadata_tagger.py ctb/ --verbose
```

### Auto-Remediation

```bash
# Remediate entire repository
python ctb/sys/global-factory/scripts/ctb_remediator.py ctb/

# Remediate specific branch
python ctb/sys/global-factory/scripts/ctb_remediator.py ctb/data/

# Dry run (see what would be fixed)
python ctb/sys/global-factory/scripts/ctb_remediator.py ctb/ --dry-run

# Generate remediation report
python ctb/sys/global-factory/scripts/ctb_remediator.py ctb/ --report logs/compliance/remediation.json

# Auto-commit fixes
python ctb/sys/global-factory/scripts/ctb_remediator.py ctb/ --auto-commit
```

### Hook Management

```bash
# Install pre-commit hook
bash ctb/sys/global-factory/install-hooks.sh

# Test pre-commit hook
bash .git/hooks/pre-commit

# Uninstall pre-commit hook
rm .git/hooks/pre-commit

# View hook contents
cat .git/hooks/pre-commit
```

---

## 🏷️ Compliance Thresholds

| Score  | Grade         | Status  | Merge Policy           |
|--------|---------------|---------|------------------------|
| 90–100 | EXCELLENT 🌟  | PASS ✅  | Commit/merge allowed   |
| 70–89  | GOOD/FAIR ✅   | PASS ✅  | Commit/merge allowed   |
| 60–69  | NEEDS WORK ⚠️ | BLOCKED 🚫 | Must fix before commit |
| 0–59   | FAIL ❌        | BLOCKED 🚫 | Must fix before commit |

**Current Minimum:** `70/100`

---

## 🚀 Development Commands

### Setup

```bash
# Clone repository
git clone https://github.com/your-org/client-subhive.git
cd client-subhive

# Install dependencies
npm install && pip install -r requirements.txt

# Setup environment
cp .env.example .env
cp ctb/sys/api/.env.example ctb/sys/api/.env
cp ctb/data/.env.example ctb/data/.env

# Install enforcement
bash ctb/sys/global-factory/install-hooks.sh
```

### Running Services

```bash
# Frontend (Next.js)
npm run dev                    # Port 3000

# Backend API
cd ctb/ui/src/server && python main.py    # Port 8000

# MCP Server
cd ctb/sys/mcp-servers/composio-mcp && node server.js    # Port 7001
```

### Testing

```bash
# All tests
npm test

# System tests
cd ctb/sys/tests && python -m pytest

# Data tests
cd ctb/data/tests && python -m pytest

# UI tests
cd ctb/ui && npm test

# Specific test file
python -m pytest ctb/sys/tests/test_compliance.py -v
```

---

## 📁 File Navigation

### Critical Files

```bash
# Entry point
cat ENTRYPOINT.md

# Enforcement documentation
cat CTB_ENFORCEMENT.md

# Quick reference (this file)
cat QUICKREF.md

# Path mappings
cat CTB_INDEX.md

# System configuration
cat global-config.yaml

# Architecture diagram
cat ctb/docs/architecture.mmd
```

### Branch READMEs

```bash
# System infrastructure
cat ctb/sys/README.md

# AI & agents
cat ctb/ai/README.md

# Data & database
cat ctb/data/README.md

# Documentation
cat ctb/docs/README.md

# User interface
cat ctb/ui/README.md

# Configuration
cat ctb/meta/README.md
```

### API & Database

```bash
# API catalog
cat ctb/sys/api/API_CATALOG.md

# Database schema
cat ctb/data/SCHEMA_REFERENCE.md

# Column registry
cat ctb/data/db/registry/clnt_column_registry.yml
```

---

## 🔍 Search & Find

### Find Files

```bash
# By name pattern
find ctb/ -name "*keyword*"

# By type
find ctb/ -name "*.py"
find ctb/ -name "*.js"

# By branch
ls ctb/sys/
ls ctb/ai/
ls ctb/data/
```

### Search Code

```bash
# Search all files
grep -r "search term" ctb/

# Search specific type
grep -r "search term" ctb/ --include="*.py"

# Search with context
grep -r -A 3 -B 3 "search term" ctb/

# Case insensitive
grep -ri "search term" ctb/
```

### Find by CTB ID

```bash
# Find file by CTB ID
grep -r "CTB-XXXXXXXXXXXX" ctb/

# List all CTB IDs
grep -rh "ctb_id:" ctb/ | sort | uniq
```

---

## 📊 Status & Reports

### View Compliance Status

```bash
# Current score
cat ctb/meta/ctb_registry.json | jq '.compliance_score'

# File statistics
cat ctb/meta/ctb_registry.json | jq '.stats'

# Recent audit report
cat logs/compliance/audit-report-$(date +%Y-%m-%d).json

# Compliance trend
cat logs/compliance/compliance-trend.csv
```

### View Logs

```bash
# Compliance logs
tail -f logs/compliance/*.log

# Error logs
tail -f logs/errors/*.log

# Sync logs
tail -f logs/sync/*.log

# All logs
tail -f logs/**/*.log
```

### Service Health

```bash
# Check services
curl http://localhost:3000/api/hello    # UI API
curl http://localhost:8000/health       # Backend API
curl http://localhost:7001/health       # MCP Server

# Check database
psql $DATABASE_URL -c "SELECT 1;"
```

---

## 🐛 Troubleshooting

### Compliance Issues

```bash
# Check what's wrong
bash ctb/sys/global-factory/compliance-check.sh

# View detailed issues
python ctb/sys/global-factory/scripts/ctb_audit_generator.py ctb/ --verbose

# Auto-fix
python ctb/sys/global-factory/scripts/ctb_remediator.py ctb/

# Verify fix
python ctb/sys/global-factory/scripts/ctb_audit_generator.py ctb/ --quiet
```

### Hook Issues

```bash
# Verify hook installed
ls -la .git/hooks/pre-commit

# Make executable
chmod +x .git/hooks/pre-commit

# Reinstall
bash ctb/sys/global-factory/install-hooks.sh

# Test manually
bash .git/hooks/pre-commit
```

### Service Issues

```bash
# Check ports in use
lsof -i :3000    # UI
lsof -i :8000    # API
lsof -i :7001    # MCP

# Restart services
npm run dev      # UI
python main.py   # API
node server.js   # MCP

# Check environment
cat .env
```

---

## 🎯 Git Workflow

### Standard Workflow

```bash
# 1. Pull latest
git pull origin main

# 2. Create branch
git checkout -b feature/my-feature

# 3. Make changes
# ... edit files ...

# 4. Check compliance
python ctb/sys/global-factory/scripts/ctb_audit_generator.py ctb/ --quiet

# 5. Fix if needed
python ctb/sys/global-factory/scripts/ctb_remediator.py ctb/

# 6. Stage changes
git add .

# 7. Commit (pre-commit hook runs automatically)
git commit -m "Add new feature"

# 8. Push
git push origin feature/my-feature

# 9. Create PR on GitHub
```

### Emergency Bypass

```bash
# Skip pre-commit hook (NOT RECOMMENDED)
git commit --no-verify -m "Emergency fix"

# Better: Fix compliance first
python ctb/sys/global-factory/scripts/ctb_remediator.py ctb/
git add .
git commit -m "Fix compliance issues"
```

---

## 🔧 Configuration

### Update Threshold

```bash
# Edit pre-commit hook
vim .git/hooks/pre-commit
# Change: MIN_SCORE=70 to desired value

# Edit GitHub Actions
vim .github/workflows/ctb_enforcement.yml
# Change threshold in workflow
```

### Customize Enforcement

```bash
# Edit global config
vim global-config.yaml

# Update enforcement rules
vim ctb/meta/enforcement_rules.json

# Modify scripts
vim ctb/sys/global-factory/scripts/ctb_metadata_tagger.py
vim ctb/sys/global-factory/scripts/ctb_audit_generator.py
vim ctb/sys/global-factory/scripts/ctb_remediator.py
```

---

## 📚 Documentation Links

| Document | Purpose |
|----------|---------|
| [ENTRYPOINT.md](ENTRYPOINT.md) | Main entry point, start here |
| [CTB_ENFORCEMENT.md](CTB_ENFORCEMENT.md) | Full enforcement documentation |
| [QUICKREF.md](QUICKREF.md) | This quick reference |
| [CTB_INDEX.md](CTB_INDEX.md) | Complete path mappings |
| [global-config.yaml](global-config.yaml) | System configuration |
| [ctb/sys/api/API_CATALOG.md](ctb/sys/api/API_CATALOG.md) | API endpoint catalog |
| [ctb/data/SCHEMA_REFERENCE.md](ctb/data/SCHEMA_REFERENCE.md) | Database schema reference |
| [ctb/meta/DEPENDENCIES.md](ctb/meta/DEPENDENCIES.md) | Inter-branch dependencies |
| [ctb/docs/architecture.mmd](ctb/docs/architecture.mmd) | System architecture diagram |

---

## 🆘 Getting Help

```bash
# Read documentation
cat ENTRYPOINT.md
cat CTB_ENFORCEMENT.md

# Check specific branch
cat ctb/<branch>/README.md

# Search docs
grep -r "topic" ctb/docs/

# View architecture
cat ctb/docs/architecture.mmd

# Check configuration
cat global-config.yaml

# View recent logs
tail -f logs/**/*.log
```

---

## ⚙️ Environment Variables

### Required Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/db

# Firebase
FIREBASE_PROJECT_ID=client-subhive
FIREBASE_PRIVATE_KEY=...
FIREBASE_CLIENT_EMAIL=...

# API Keys
ANTHROPIC_API_KEY=...
OPENAI_API_KEY=...
COMPOSIO_API_KEY=...

# Services
GARAGE_MCP_URL=http://localhost:7001
IMOCREATOR_SIDECAR_URL=http://localhost:8000
```

### Setup Environment

```bash
# Copy templates
cp .env.example .env
cp ctb/sys/api/.env.example ctb/sys/api/.env
cp ctb/data/.env.example ctb/data/.env

# Edit with your values
vim .env
vim ctb/sys/api/.env
vim ctb/data/.env
```

---

## 🎨 Useful Aliases (Optional)

Add to your `~/.bashrc` or `~/.zshrc`:

```bash
# CTB aliases
alias ctb-check='python ctb/sys/global-factory/scripts/ctb_audit_generator.py ctb/ --quiet'
alias ctb-fix='python ctb/sys/global-factory/scripts/ctb_remediator.py ctb/'
alias ctb-tag='python ctb/sys/global-factory/scripts/ctb_metadata_tagger.py ctb/'
alias ctb-compliance='bash ctb/sys/global-factory/compliance-check.sh'
alias ctb-score='cat ctb/meta/ctb_registry.json | jq ".compliance_score"'

# Development aliases
alias dev-ui='npm run dev'
alias dev-api='cd ctb/ui/src/server && python main.py'
alias dev-mcp='cd ctb/sys/mcp-servers/composio-mcp && node server.js'

# Log aliases
alias logs-compliance='tail -f logs/compliance/*.log'
alias logs-errors='tail -f logs/errors/*.log'
alias logs-all='tail -f logs/**/*.log'
```

Then reload: `source ~/.bashrc` or `source ~/.zshrc`

---

**Quick Reference Version:** 1.0.0
**For Full Documentation:** [CTB_ENFORCEMENT.md](CTB_ENFORCEMENT.md)
**Main Entry Point:** [ENTRYPOINT.md](ENTRYPOINT.md)
