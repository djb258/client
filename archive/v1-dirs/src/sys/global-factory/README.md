# Global Factory

**Version:** 1.0.0
**Purpose:** Central repository for shared scripts and workflows across all CTB-compliant repositories

## Overview

The Global Factory contains scripts, workflows, and tools that are synchronized across all repositories following the Christmas Tree Backbone (CTB) structure. This ensures consistency, maintainability, and compliance across your entire project ecosystem.

## Contents

### Scripts

Utility scripts for common operations:

- `compliance-check.sh` - Verify CTB structure compliance
- `sync-check.sh` - Check for global factory updates
- `deploy.sh` - Deployment scripts
- `setup.sh` - Repository setup automation

### Workflows

GitHub Actions workflows:

- `.github/workflows/ctb-compliance.yml` - Automated compliance checks
- `.github/workflows/ctb-sync.yml` - Automated sync operations

### Tools

Development and maintenance tools:

- Compliance checkers
- Path validators
- Structure generators

## Usage

### Compliance Check

Run the compliance checker to verify your repository follows CTB standards:

```bash
./ctb/sys/global-factory/compliance-check.sh
```

This will:
- Verify CTB directory structure exists
- Check for required configuration files
- Generate a compliance report
- Return exit code 0 if passing (≥90 score)

### Sync Global Scripts

To update global scripts from the central repository:

```bash
# Manual sync
git pull origin main -- ctb/sys/global-factory/

# Or use the bootstrap script
./setup_ctb.sh . --force
```

### Bootstrap New Repository

To apply CTB structure to a new repository:

```bash
./setup_ctb.sh /path/to/new-repo
```

Options:
- `--force` - Overwrite existing CTB structure
- `--no-global` - Skip copying global scripts
- `--dry-run` - Preview changes without applying

## Synchronization

### Automatic Sync

When `auto_sync: true` is enabled in `global-config.yaml`, the global factory automatically syncs on:

- **Daily schedule**: 2 AM (configurable)
- **On commit**: Via Composio scenario `CTB_Compliance_Cycle`
- **On push**: Via Composio scenario `CTB_Structure_Validation`

### Manual Sync

You can manually trigger sync operations:

```bash
# Pull latest from central repo
git pull origin main -- ctb/sys/global-factory/

# Or use Composio scenario
composio trigger CTB_Sync_Global
```

## Compliance Requirements

### Minimum Score: 90/100

Scoring breakdown:
- **CTB Structure (35 points)**: All required directories exist
- **Global Config (20 points)**: `global-config.yaml` present and valid
- **CTB Index (20 points)**: `CTB_INDEX.md` present and up-to-date
- **Logs Directory (10 points)**: Logs structure in place
- **Global Factory (10 points)**: Global factory directory exists
- **Path References (5 points)**: Imports use CTB paths

### Auto-Fix

When `auto_fix: true` is enabled, the system will automatically:
- Create missing directories
- Generate missing configuration files
- Update CTB_INDEX.md
- Set up logs structure

## Files in Global Factory

### compliance-check.sh

Verifies repository compliance with CTB standards.

**Usage:**
```bash
./ctb/sys/global-factory/compliance-check.sh
```

**Exit Codes:**
- `0` - Compliance passed (≥90 score)
- `1` - Compliance failed (<90 score)

**Output:**
- Console summary
- JSON report in `logs/compliance/`

### sync-check.sh

Checks if global factory needs updating.

**Usage:**
```bash
./ctb/sys/global-factory/sync-check.sh
```

**Actions:**
- Compares local vs remote versions
- Reports available updates
- Can auto-apply updates if configured

## Integration

### Composio Scenarios

The global factory integrates with Composio for automated operations:

#### CTB_Compliance_Cycle
- **Trigger**: On commit
- **Actions**:
  - Run compliance check
  - Sync global scripts
  - Generate report

#### CTB_Sync_Global
- **Trigger**: Scheduled (2 AM daily)
- **Actions**:
  - Fetch global factory updates
  - Apply to local repository
  - Notify on changes

#### CTB_Structure_Validation
- **Trigger**: On push
- **Actions**:
  - Validate structure
  - Check path references
  - Update index

### HEIR Integration

The global factory follows HEIR altitude-based coordination:

- **Layer 30**: Policy enforcement
- **Layer 20**: Sync coordination
- **Layer 10**: File operations
- **Layer 5**: Structure verification

### Sidecar Telemetry

Events are logged to the sidecar for monitoring:

- `ctb.structure.created`
- `ctb.compliance.checked`
- `ctb.sync.completed`
- `ctb.violation.detected`

## Maintenance

### Adding New Scripts

To add a script to the global factory:

1. Create the script in `ctb/sys/global-factory/`
2. Make it executable: `chmod +x script.sh`
3. Document it in this README
4. Commit and push to central repository
5. Scripts sync automatically to all repositories

### Updating Scripts

To update an existing script:

1. Modify the script in the central repository
2. Commit with clear change description
3. Scripts sync automatically on next schedule
4. Or trigger manual sync: `composio trigger CTB_Sync_Global`

### Version Control

The global factory maintains version tracking:

- Version file: `ctb/.version`
- Changelog: `logs/ctb-changes.log`
- Git history for detailed changes

## Troubleshooting

### Compliance Check Fails

If compliance check fails:

1. Review the compliance report: `logs/compliance/[timestamp]-compliance.json`
2. Check which requirements are missing
3. Run with auto-fix: Set `auto_fix: true` in `global-config.yaml`
4. Manually create missing components
5. Re-run compliance check

### Sync Issues

If sync fails:

1. Check network connectivity
2. Verify GitHub token/credentials
3. Review sync logs: `logs/sync/sync.log`
4. Ensure no merge conflicts
5. Try manual pull: `git pull origin main -- ctb/sys/global-factory/`

### Path Resolution

If imports break after CTB migration:

1. Update import statements to use CTB paths
2. Use find/replace: `scripts/` → `ctb/sys/scripts/`
3. Check `CTB_INDEX.md` for path mappings
4. Run path reference check: `compliance-check.sh`

## Best Practices

1. **Never modify global factory files directly** in individual repos - make changes in the central repository
2. **Always run compliance check** before committing
3. **Keep global-config.yaml in sync** with central repository
4. **Document all custom scripts** in this README
5. **Use semantic versioning** for major changes
6. **Test scripts locally** before pushing to global factory

## Support

For issues or questions:

1. Check `CTB_INDEX.md` for path mappings
2. Review `global-config.yaml` for configuration
3. Consult central repository documentation
4. Check logs: `logs/compliance/` and `logs/sync/`

## Links

- **Central Repository**: https://github.com/djb258/client
- **CTB Documentation**: `ctb/docs/`
- **Global Config**: `global-config.yaml`
- **Path Index**: `CTB_INDEX.md`

---

**Last Updated:** 2025-10-23
**Maintained By:** IMO Creator System
**Sync Status**: Auto-sync enabled
