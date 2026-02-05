# CTB/SYS - System & Infrastructure

**Branch:** `sys`
**Purpose:** System infrastructure, scripts, tools, and operational components

---

## 📁 Directory Structure

```
ctb/sys/
├── scripts/           # Utility and automation scripts
├── tools/             # Development and build tools
├── factory/           # Repository scaffolding system
├── mechanic/          # Repair and maintenance tools
├── mcp-servers/       # Model Context Protocol servers
├── tests/             # System-level tests
└── global-factory/    # Global scripts synced across repos
    ├── scripts/       # Core compliance scripts
    │   ├── ctb_metadata_tagger.py
    │   ├── ctb_audit_generator.py
    │   └── ctb_remediator.py
    ├── compliance-check.sh
    └── README.md
```

## 🚀 Quick Start

### Local Development

```bash
# Navigate to system directory
cd ctb/sys

# Run compliance check
bash global-factory/compliance-check.sh

# Run CTB tagging
python global-factory/scripts/ctb_metadata_tagger.py ../

# Run CTB audit
python global-factory/scripts/ctb_audit_generator.py ../
```

### Common Commands

```bash
# System-level operations
./scripts/setup.sh                    # Setup development environment
./scripts/deploy.sh                   # Deploy application
./mechanic/recall/recall.sh <repo>    # Run mechanic recall on repo

# Factory operations
./factory/ui/init.sh <app-name>       # Initialize new app

# MCP server operations
cd mcp-servers/composio-mcp && node server.js  # Start Composio MCP
```

## 🔧 Components

### Global Factory (`global-factory/`)

**Purpose:** Central repository for scripts and workflows synced across all CTB-compliant repositories.

**Key Scripts:**
- **compliance-check.sh** - Verifies CTB structure compliance (min score: 90/100)
- **ctb_metadata_tagger.py** - Injects metadata blocks into files
- **ctb_audit_generator.py** - Generates compliance audit reports
- **ctb_remediator.py** - Automatically fixes compliance issues

**Auto-Sync:** Scripts sync daily from central repository at 2 AM.

### Scripts (`scripts/`)

**Purpose:** Utility scripts for common operations.

**Common Scripts:**
- Deployment automation
- Database migrations
- Environment setup
- CI/CD helpers

### Tools (`tools/`)

**Purpose:** Development and build tools.

**Includes:**
- Build scripts
- Code generators
- Documentation generators
- Blueprint tools

### Factory (`factory/`)

**Purpose:** Scaffolding system for creating new applications.

**Usage:**
```bash
cd factory/ui
./init.sh my-new-app

# Creates new app with:
# - .env.example
# - Logging configuration
# - Compliance checks
# - HEIR validation
# - Garage-MCP integration
```

### Mechanic (`mechanic/`)

**Purpose:** Repair and maintenance tools for existing repositories.

**Usage:**
```bash
cd mechanic/recall
./recall.sh /path/to/existing-repo

# Injects into existing repo:
# - .env.example
# - Compliance checks
# - HEIR error handling
# - Subagent delegation
```

**Subagent Delegator:**
```bash
python mechanic/recall/subagent-delegator.py /path/to/repo

# Analyzes and delegates repairs:
# - Compliance issues
# - Security vulnerabilities
# - Documentation gaps
# - Test coverage
```

### MCP Servers (`mcp-servers/`)

**Purpose:** Model Context Protocol server implementations.

**Available Servers:**
- Composio MCP (port 3001)
- Garage MCP integration
- Custom tool servers

## 🧪 Testing

### Run System Tests

```bash
cd ctb/sys/tests

# Run all system tests
python -m pytest

# Run specific test suite
python -m pytest test_factory.py
python -m pytest test_compliance.py
```

### Test Coverage

```bash
# Generate coverage report
pytest --cov=ctb/sys --cov-report=html
```

## 📊 Infrastructure Overview

### System Architecture

```
┌─────────────────────────────────────────┐
│         CTB/SYS Infrastructure          │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────┐  ┌──────────┐  ┌───────┐│
│  │ Global   │  │ Factory  │  │ Tools ││
│  │ Factory  │  │ System   │  │       ││
│  └────┬─────┘  └────┬─────┘  └───┬───┘│
│       │             │             │    │
│       ├─────────────┼─────────────┤    │
│       │   Script Execution Layer   │   │
│       └────────────┬────────────────┘   │
│                    │                    │
│       ┌────────────▼────────────┐       │
│       │   MCP Servers (3001)    │       │
│       └─────────────────────────┘       │
└─────────────────────────────────────────┘
```

### Dependency Flow

```
Global Factory
    ↓
Scripts & Tools
    ↓
Factory/Mechanic
    ↓
Application Repos
```

## 🔐 Environment Variables

**Required:**
```bash
# MCP Configuration
GARAGE_MCP_URL=http://localhost:7001
COMPOSIO_API_URL=http://localhost:3001
COMPOSIO_API_KEY=<your-api-key>

# Sidecar Configuration
IMOCREATOR_SIDECAR_URL=http://localhost:8000
IMOCREATOR_BEARER_TOKEN=<token>

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/db
```

See `.env.example` files in subdirectories for complete configuration.

## 📝 Logging

### Log Locations

```
logs/
├── compliance/    # Compliance check logs
├── sync/          # Sync operation logs
└── errors/        # Error logs
```

### View Recent Logs

```bash
# View compliance logs
tail -f logs/compliance/*.log

# View sync logs
tail -f logs/sync/sync.log

# View errors
tail -f logs/errors/*.log
```

## 🔄 Sync & Updates

### Auto-Sync Schedule

- **Daily:** 2 AM UTC - Global factory sync
- **Weekly:** Sundays 2 AM UTC - Full compliance cycle

### Manual Sync

```bash
# Sync global factory scripts
git pull origin main -- ctb/sys/global-factory/

# Or use bootstrap
./setup_ctb.sh . --force
```

## 🛠️ Maintenance

### Compliance Checks

```bash
# Run compliance check
bash ctb/sys/global-factory/compliance-check.sh

# Expected output:
# ✓ CTB Compliance: PASSED
# Score: 100/100 (100%)
```

### Update System Components

```bash
# Update all scripts
cd ctb/sys
git pull origin main

# Update dependencies
npm install  # If using Node.js
pip install -r requirements.txt  # If using Python
```

## 📚 Related Documentation

- [Global Factory README](global-factory/README.md) - Detailed global factory documentation
- [CTB Index](../../CTB_INDEX.md) - Complete path mappings
- [Global Config](../../global-config.yaml) - System-wide configuration
- [Dependencies](../meta/DEPENDENCIES.md) - Inter-branch dependencies

## 🐛 Troubleshooting

### Compliance Check Fails

```bash
# View detailed report
cat logs/compliance/latest-compliance.json

# Run with verbose output
bash ctb/sys/global-factory/compliance-check.sh -v

# Auto-fix issues
python ctb/sys/global-factory/scripts/ctb_remediator.py ctb/
```

### MCP Server Not Starting

```bash
# Check port availability
lsof -i :3001
lsof -i :7001

# Restart MCP servers
cd mcp-servers/composio-mcp
node server.js
```

### Script Execution Errors

```bash
# Make scripts executable
chmod +x ctb/sys/scripts/*.sh
chmod +x ctb/sys/global-factory/*.sh

# Check Python version (requires 3.11+)
python --version

# Install dependencies
pip install -r ctb/sys/global-factory/requirements.txt
```

## 🔗 Quick Links

- **Global Factory:** [README](global-factory/README.md)
- **Compliance Scripts:** [scripts/](global-factory/scripts/)
- **Factory System:** [factory/ui/init.sh](factory/ui/init.sh)
- **Mechanic Recall:** [mechanic/recall/recall.sh](mechanic/recall/recall.sh)
- **Tests:** [tests/](tests/)

## 📞 Support

For issues with system infrastructure:

1. Check logs in `logs/`
2. Review compliance reports
3. Consult global-config.yaml
4. Check CTB_INDEX.md for path mappings

---

**Last Updated:** 2025-10-23
**Maintained By:** CTB System
**Version:** 1.0.0
