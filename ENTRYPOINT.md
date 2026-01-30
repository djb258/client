# 🚀 ENTRYPOINT - Start Here

**Repository:** client-subhive
**Structure:** Christmas Tree Backbone (CTB) v1.0
**Last Updated:** 2025-10-23

---

## 📍 You Are Here

This is the **main entry point** for the client-subhive repository. Whether you're a developer, AI agent, or new team member, this guide will help you navigate the codebase and get started quickly.

## 🎯 Quick Start Points

### For Developers

```bash
# 1. Clone and setup
git clone https://github.com/djb258/client.git
cd client-subhive
npm install && pip install -r requirements.txt

# 2. Configure environment
cp .env.example .env
# Edit .env with your settings

# 3. Start services
npm run dev           # Start UI
python main.py        # Start API (in separate terminal)

# 4. Run compliance check
bash ctb/sys/global-factory/compliance-check.sh
```

### For AI Agents

```bash
# 1. Read this ENTRYPOINT.md
# 2. Review CTB structure: CTB_INDEX.md
# 3. Check compliance: ctb/meta/ctb_registry.json
# 4. Consult branch READMEs: ctb/*/README.md
# 5. Execute tasks per global-config.yaml
```

### For Operations

```bash
# 1. Check system health
bash ctb/sys/global-factory/compliance-check.sh

# 2. View recent logs
tail -f logs/compliance/*.log

# 3. Run automated tasks
python ctb/sys/global-factory/scripts/ctb_auditor.py ctb/

# 4. Deploy
./ctb/sys/scripts/deploy.sh
```

## 📂 Repository Structure

```
client-subhive/
├── ENTRYPOINT.md           ← You are here
├── CTB_INDEX.md            ← Complete path mappings
├── global-config.yaml      ← System-wide configuration
├── heir.doctrine.yaml      ← HEIR configuration
├── setup_ctb.sh            ← CTB bootstrap script
│
├── ctb/                    ← Christmas Tree Backbone
│   ├── sys/               ← System & Infrastructure
│   ├── ai/                ← AI & Agent Configurations
│   ├── data/              ← Data & Database
│   ├── docs/              ← Documentation
│   ├── ui/                ← User Interface
│   └── meta/              ← Metadata & Configuration
│
├── logs/                   ← Application logs
│   ├── compliance/
│   ├── sync/
│   └── errors/
│
├── imo-creator/            ← IMO Creator subsystem
├── garage-mcp/             ← Garage MCP system
└── .github/                ← GitHub workflows
    └── workflows/
        └── ctb_enforcement.yml
```

## 🗺️ File Map

### Critical Files (Read These First)

| File | Purpose | When to Read |
|------|---------|--------------|
| **ENTRYPOINT.md** | Main entry point (this file) | First thing |
| **CTB_INDEX.md** | Complete path mappings | When navigating |
| **global-config.yaml** | System configuration | Before configuring |
| **heir.doctrine.yaml** | HEIR doctrine | When using HEIR |
| **ctb/meta/DEPENDENCIES.md** | Inter-branch dependencies | When understanding flow |
| **ctb/docs/architecture.mmd** | System architecture | When understanding design |

### Branch Entry Points

| Branch | README | Purpose |
|--------|--------|---------|
| **sys** | [ctb/sys/README.md](ctb/sys/README.md) | Infrastructure, scripts, tools |
| **ai** | [ctb/ai/README.md](ctb/ai/README.md) | AI agents, HEIR, orchestration |
| **data** | [ctb/data/README.md](ctb/data/README.md) | Database, schemas, migrations |
| **docs** | [ctb/docs/README.md](ctb/docs/README.md) | Documentation, diagrams |
| **ui** | [ctb/ui/README.md](ctb/ui/README.md) | UI components, pages |
| **meta** | [ctb/meta/README.md](ctb/meta/README.md) | Configuration, workflows |

## 🎯 Common Tasks

### 1. Run Compliance Check

```bash
# Check CTB structure compliance
bash ctb/sys/global-factory/compliance-check.sh

# Expected output:
# ✓ CTB Compliance: PASSED
# Score: 100/100 (100%)
```

### 2. Tag New Files

```bash
# Tag all untagged files with CTB metadata
python ctb/sys/global-factory/scripts/ctb_metadata_tagger.py ctb/

# Generates: CTB_TAGGING_REPORT.md
```

### 3. Audit Structure

```bash
# Run compliance audit
python ctb/sys/global-factory/scripts/ctb_audit_generator.py ctb/

# Generates:
# - CTB_AUDIT_REPORT.md
# - ctb/meta/ctb_registry.json
```

### 4. Fix Issues

```bash
# Auto-remediate compliance issues
python ctb/sys/global-factory/scripts/ctb_remediator.py ctb/

# Generates:
# - CTB_REMEDIATION_SUMMARY.md
# - ctb/meta/enforcement_rules.json
```

### 5. Start Development

```bash
# Frontend (Next.js)
cd ctb/ui/src
npm run dev

# Backend (FastAPI)
cd ctb/ui/src/server
python main.py

# MCP Server
cd ctb/sys/mcp-servers/composio-mcp
node server.js
```

### 6. Run Tests

```bash
# All tests
npm test

# System tests
cd ctb/sys/tests && python -m pytest

# Data tests
cd ctb/data/tests && python -m pytest

# UI tests
cd ctb/ui && npm test
```

### 7. Deploy

```bash
# Check deployment readiness
bash ctb/sys/global-factory/compliance-check.sh

# Run deployment
./ctb/sys/scripts/deploy.sh

# Or use CI/CD
git push origin main  # Triggers GitHub Actions
```

## 🛡️ CTB Enforcement Summary

### Automated Compliance System

The CTB Enforcement System provides **zero-manual-effort compliance** for every commit and PR.

#### Compliance Thresholds

| Score  | Grade         | Status  | Merge Policy           |
|--------|---------------|---------|------------------------|
| 90–100 | EXCELLENT 🌟  | PASS ✅  | Commit/merge allowed   |
| 70–89  | GOOD/FAIR ✅   | PASS ✅  | Commit/merge allowed   |
| 60–69  | NEEDS WORK ⚠️ | BLOCKED 🚫 | Must fix before commit |
| 0–59   | FAIL ❌        | BLOCKED 🚫 | Must fix before commit |

**Current Threshold:** `70/100` (minimum passing score)

#### 4-Layer Enforcement

1. **Pre-Commit Hook** → Tags & scores files locally before commit
2. **GitHub Actions** → Double-checks compliance on every PR
3. **Composio Weekly** → Full repository scan every Sunday 2 AM UTC
4. **Auto-Remediation** → Self-heals drifted files automatically

#### Quick Commands

```bash
# Install pre-commit hook
bash ctb/sys/global-factory/install-hooks.sh

# Check current compliance score
python ctb/sys/global-factory/scripts/ctb_audit_generator.py ctb/ --quiet

# Auto-fix compliance issues
python ctb/sys/global-factory/scripts/ctb_remediator.py ctb/

# View enforcement documentation
cat CTB_ENFORCEMENT.md
```

#### Key Features

- 🏷️ **Auto-Tagging:** Every file gets CTB metadata automatically
- 📊 **Real-Time Scoring:** Instant compliance feedback on every commit
- 🚫 **Merge Protection:** Non-compliant code cannot be merged
- 🔧 **Self-Healing:** Auto-remediation for drifted files
- 📈 **Trend Tracking:** Weekly compliance reports

**Full Documentation:** [CTB_ENFORCEMENT.md](CTB_ENFORCEMENT.md)
**Quick Reference:** [QUICKREF.md](QUICKREF.md)

## 📋 Workflows

### Development Workflow

```
1. Pull latest changes
   ↓
2. Create feature branch
   ↓
3. Make changes
   ↓
4. Tag new files (if any)
   ↓
5. Run compliance check
   ↓
6. Commit changes
   ↓
7. Push & create PR
   ↓
8. CI/CD runs audit
   ↓
9. Merge if passing
```

### Compliance Workflow (Automated)

```
Weekly (Sundays 2 AM):
1. Tag untagged files
   ↓
2. Run audit (get score)
   ↓
3. If score < 90: remediate
   ↓
4. Re-audit
   ↓
5. Generate reports
   ↓
6. Commit changes
   ↓
7. Send notifications
```

### Deployment Workflow

```
1. Push to main
   ↓
2. GitHub Actions triggered
   ↓
3. Run tests
   ↓
4. Run compliance check
   ↓
5. Build application
   ↓
6. Deploy to production
   ↓
7. Post-deploy verification
```

## 🔍 Navigation Guide

### Finding Code

```bash
# Search for files
find ctb/ -name "*keyword*"

# Search in code
grep -r "search term" ctb/

# Find by branch
ls ctb/sys/    # System files
ls ctb/ai/     # AI files
ls ctb/data/   # Data files
```

### Understanding Flow

1. **Start:** Read [ctb/docs/architecture.mmd](ctb/docs/architecture.mmd)
2. **Dependencies:** Read [ctb/meta/DEPENDENCIES.md](ctb/meta/DEPENDENCIES.md)
3. **Data Flow:** DATA → AI → UI
4. **Control Flow:** META → SYS → AI → execution

### Getting Help

1. **Check branch README:** `ctb/<branch>/README.md`
2. **Search docs:** `grep -r "topic" ctb/docs/`
3. **View diagrams:** `cat ctb/docs/architecture.mmd`
4. **Check config:** `cat global-config.yaml`
5. **View logs:** `tail -f logs/**/*.log`

## 🛠️ Tools & Scripts

### Available Scripts

| Script | Location | Purpose |
|--------|----------|---------|
| **compliance-check.sh** | ctb/sys/global-factory/ | Check compliance |
| **ctb_metadata_tagger.py** | ctb/sys/global-factory/scripts/ | Tag files |
| **ctb_audit_generator.py** | ctb/sys/global-factory/scripts/ | Audit structure |
| **ctb_remediator.py** | ctb/sys/global-factory/scripts/ | Fix issues |
| **setup_ctb.sh** | Root | Bootstrap CTB |
| **deploy.sh** | ctb/sys/scripts/ | Deploy app |

### Running Scripts

```bash
# With default options
python ctb/sys/global-factory/scripts/ctb_auditor.py ctb/

# With dry-run
python ctb/sys/global-factory/scripts/ctb_remediator.py ctb/ --dry-run

# With custom report path
python ctb/sys/global-factory/scripts/ctb_tagger.py ctb/ --report custom_report.md
```

## 📊 System Status

### Check Health

```bash
# Compliance score
cat ctb/meta/ctb_registry.json | jq '.compliance_score'

# File count
cat ctb/meta/ctb_registry.json | jq '.stats.total_files'

# Recent errors
tail -20 logs/errors/*.log

# Service status
curl http://localhost:8000/health  # Sidecar
curl http://localhost:7001/health  # MCP
```

### View Metrics

```bash
# Tagged files
cat CTB_TAGGING_REPORT.md

# Audit results
cat CTB_AUDIT_REPORT.md

# Remediation summary
cat CTB_REMEDIATION_SUMMARY.md
```

## 🔐 Environment Setup

### Required Environment Variables

```bash
# Copy example files
cp .env.example .env
cp ctb/sys/api/.env.example ctb/sys/api/.env
cp ctb/data/.env.example ctb/data/.env

# Edit with your values
vim .env
```

### Key Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/db

# Services
GARAGE_MCP_URL=http://localhost:7001
IMOCREATOR_SIDECAR_URL=http://localhost:8000

# API Keys
COMPOSIO_API_KEY=<key>
FIREBASE_API_KEY=<key>
```

## 📚 Documentation Index

### By Topic

- **Getting Started:** This file (ENTRYPOINT.md)
- **Quick Reference:** [QUICKREF.md](QUICKREF.md)
- **Structure:** [CTB_INDEX.md](CTB_INDEX.md)
- **Configuration:** [global-config.yaml](global-config.yaml)
- **Architecture:** [ctb/docs/architecture.mmd](ctb/docs/architecture.mmd)
- **Dependencies:** [ctb/meta/DEPENDENCIES.md](ctb/meta/DEPENDENCIES.md)
- **Enforcement:** [CTB_ENFORCEMENT.md](CTB_ENFORCEMENT.md)
- **Compliance:** [CTB_COMPLIANCE_SCRIPTS_SUMMARY.md](CTB_COMPLIANCE_SCRIPTS_SUMMARY.md)
- **API Catalog:** [ctb/sys/api/API_CATALOG.md](ctb/sys/api/API_CATALOG.md)
- **Database Schema:** [ctb/data/SCHEMA_REFERENCE.md](ctb/data/SCHEMA_REFERENCE.md)

### By Branch

- **System:** [ctb/sys/README.md](ctb/sys/README.md)
- **AI:** [ctb/ai/README.md](ctb/ai/README.md)
- **Data:** [ctb/data/README.md](ctb/data/README.md)
- **Docs:** [ctb/docs/README.md](ctb/docs/README.md)
- **UI:** [ctb/ui/README.md](ctb/ui/README.md)
- **Meta:** [ctb/meta/README.md](ctb/meta/README.md)

## 🚨 Troubleshooting

### Common Issues

**1. Compliance Check Fails**
```bash
# View detailed report
cat logs/compliance/latest-compliance.json

# Auto-fix
python ctb/sys/global-factory/scripts/ctb_remediator.py ctb/
```

**2. Services Won't Start**
```bash
# Check ports
lsof -i :8000  # Sidecar
lsof -i :7001  # MCP
lsof -i :3000  # UI

# Check environment
cat .env
```

**3. Tests Failing**
```bash
# Update dependencies
npm install
pip install -r requirements.txt

# Clear cache
npm run clean
rm -rf __pycache__
```

## 🔗 Quick Links

- **GitHub Repo:** https://github.com/djb258/client
- **CI/CD:** [.github/workflows/ctb_enforcement.yml](.github/workflows/ctb_enforcement.yml)
- **Global Config:** [global-config.yaml](global-config.yaml)
- **CTB Index:** [CTB_INDEX.md](CTB_INDEX.md)

## 📞 Support

**For help:**
1. Read this ENTRYPOINT.md
2. Check branch READMEs
3. Search documentation
4. View architecture diagram
5. Check CTB_INDEX.md for paths

---

**Welcome to client-subhive!** 🎉

Start with the Quick Start section above, then explore the CTB structure using the branch READMEs. Everything is organized for clarity and ease of navigation.

**Happy coding!** 🚀

---

**Version:** 1.0.0
**Last Updated:** 2025-10-23
**Maintained By:** CTB System
