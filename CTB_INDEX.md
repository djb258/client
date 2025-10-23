# Christmas Tree Backbone (CTB) Index

**Repository:** client-subhive
**Reorganization Date:** 2025-10-23
**CTB Version:** 1.0

## Overview

This document maps the old repository structure to the new Christmas Tree Backbone (CTB) organization. The CTB structure provides a standardized, hierarchical organization that makes navigation, maintenance, and scaling easier.

## CTB Structure

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

### CTB/SYS - System & Infrastructure

| Old Path | New Path | Description |
|----------|----------|-------------|
| `scripts/` | `ctb/sys/scripts/` | Utility scripts |
| `mechanic/` | `ctb/sys/mechanic/` | Repair and maintenance tools |
| `tools/` | `ctb/sys/tools/` | Development and build tools |
| `factory/` | `ctb/sys/factory/` | Factory scaffolding system |
| `mcp-servers/` | `ctb/sys/mcp-servers/` | MCP server implementations |
| `tests/` | `ctb/sys/tests/` | Test suites |
| N/A | `ctb/sys/global-factory/` | Global scripts & workflows (new) |

### CTB/AI - AI & Agent Configurations

| Old Path | New Path | Description |
|----------|----------|-------------|
| `claude-agents-library/` | `ctb/ai/agents/` | Claude agent definitions |
| `barton-modules/` | `ctb/ai/modules/` | Altitude-based Barton modules |
| `packages/heir/` | `ctb/ai/packages/heir/` | HEIR error handling package |
| `packages/sidecar/` | `ctb/ai/packages/sidecar/` | Sidecar telemetry package |
| `packages/` | `ctb/ai/packages/` | All AI-related packages |

### CTB/DATA - Data & Database

| Old Path | New Path | Description |
|----------|----------|-------------|
| `db/` | `ctb/data/db/` | Database schemas and migrations |
| `db/neon/` | `ctb/data/db/neon/` | Neon database configuration |
| `db/registry/` | `ctb/data/db/registry/` | Registry data |
| `db/vendor_blueprints/` | `ctb/data/db/vendor_blueprints/` | Vendor blueprint data |
| `firebase/` | `ctb/data/firebase/` | Firebase configuration and types |

### CTB/DOCS - Documentation

| Old Path | New Path | Description |
|----------|----------|-------------|
| `docs/` | `ctb/docs/docs/` | All project documentation |
| `docs/blueprints/` | `ctb/docs/docs/blueprints/` | Blueprint documentation |

### CTB/UI - User Interface

| Old Path | New Path | Description |
|----------|----------|-------------|
| `src/` | `ctb/ui/src/` | Main source code |
| `src/app/` | `ctb/ui/src/app/` | Next.js app directory |
| `src/components/` | `ctb/ui/src/components/` | React components |
| `src/server/` | `ctb/ui/src/server/` | Server-side code |
| `src/services/` | `ctb/ui/src/services/` | Service layer |
| `barton-components/` | `ctb/ui/components/barton-components/` | Barton UI components |
| `barton-pages/` | `ctb/ui/pages/barton-pages/` | Barton page templates |
| `barton-lib/` | `ctb/ui/barton-lib/` | Barton utility libraries |
| `repo-lens/` | `ctb/ui/repo-lens/` | Repo-Lens UI |
| `apps/` | `ctb/ui/apps/` | Application modules |
| `api/` | `ctb/ui/api/` | API endpoints |

### CTB/META - Metadata & Configuration

| Old Path | New Path | Description |
|----------|----------|-------------|
| `.github/` | `ctb/meta/workflows/.github/` | GitHub workflows and actions |
| `barton-doctrine/` | `ctb/meta/doctrine/barton-doctrine/` | Barton Doctrine configs |
| `barton-ops/` | `ctb/meta/ops/barton-ops/` | Operations and ORBT configs |
| `config/` | `ctb/meta/config/` | Application configuration |
| `templates/` | `ctb/meta/templates/` | Template files |

### Root Level

| Old Path | New Path | Description |
|----------|----------|-------------|
| N/A | `logs/` | Application and system logs |
| N/A | `global-config.yaml` | Global CTB configuration (new) |
| `heir.doctrine.yaml` | `heir.doctrine.yaml` | HEIR doctrine (preserved) |

## Special Directories

### Excluded from CTB

The following directories remain in their original location:

- `imo-creator/` - Integrated submodule, maintains own structure
- `garage-mcp/` - Independent MCP garage system
- `.git/` - Git repository data
- `.vscode/` - Editor configuration
- `.claude/` - Claude Code configuration
- `node_modules/` - Node dependencies (ignored)

## Usage Guidelines

### For Developers

1. **Navigation**: Use the CTB structure for all new development
2. **Imports**: Update import paths to reference CTB structure
3. **Documentation**: Document new features within appropriate CTB branch

### For Scripts

Scripts should reference the new CTB paths:

```bash
# Old
./scripts/deploy.sh

# New
./ctb/sys/scripts/deploy.sh
```

### For CI/CD

Update workflow files to use CTB paths:

```yaml
# Old
run: python tools/compliance-check.py

# New
run: python ctb/sys/tools/compliance-check.py
```

## Bootstrap Usage

To apply CTB structure to a new repository:

```bash
# Copy global factory scripts
./setup_ctb.sh /path/to/new-repo

# This will create the CTB structure and copy global scripts
```

## Compliance

The CTB structure enforces compliance through:

- **Doctrine Enforcement**: Automated checks via `global-config.yaml`
- **Minimum Score**: 90% compliance required
- **Auto-sync**: Global scripts synchronized across repos
- **Composio Scenario**: `CTB_Compliance_Cycle`

## Migration Notes

### Phase 1: Copy (Current)
Files have been copied to CTB structure. Original files remain for compatibility.

### Phase 2: Update References
Update all import statements, scripts, and workflows to use CTB paths.

### Phase 3: Remove Originals
Once references are updated and tested, remove original file locations.

### Phase 4: Enforcement
Enable strict CTB enforcement in `global-config.yaml`.

## Support

For issues or questions about the CTB structure:

1. Check this index for path mappings
2. Review `global-config.yaml` for configuration
3. Reference `ctb/docs/` for detailed documentation
4. Consult `setup_ctb.sh` for bootstrap procedures

---

**Last Updated:** 2025-10-23
**Maintained By:** IMO Creator System
**Version:** 1.0.0
