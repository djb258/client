# CTB Tagging Report

**Generated:** 2025-10-23 18:13:41
**Root Path:** C:\Users\CUSTOMER PC\Cursor Repo\client-subhive\ctb
**Mode:** LIVE

## Summary

- **Files Scanned:** 255
- **Files Tagged:** 2
- **Files Skipped:** 253
- **Errors:** 0

## By Branch

### AI

- Tagged: 0
- Skipped: 19

### DATA

- Tagged: 1
- Skipped: 10

### DOCS

- Tagged: 0
- Skipped: 14

### META

- Tagged: 0
- Skipped: 10

### SYS

- Tagged: 1
- Skipped: 52

### UI

- Tagged: 0
- Skipped: 125

## Tagged Files

| Path | CTB ID | Branch | Size |
|------|--------|--------|------|
| `data/tests/test_schemas.py` | CTB-CFD698D4BADF | data | 2785 bytes |
| `sys/tests/test_compliance.py` | CTB-854AEFB7923A | sys | 4950 bytes |


## Metadata Format

All tagged files include a standardized metadata block with:

- `ctb_id`: Unique identifier (CTB-XXXXXXXXXXXX)
- `ctb_branch`: Branch classification (sys/ai/data/docs/ui/meta)
- `ctb_path`: Relative path within CTB structure
- `ctb_version`: CTB version (1.0.0)
- `created`: Timestamp of tagging
- `checksum`: MD5 checksum (first 8 chars)

## Next Steps

1. Review tagged files
2. Run `ctb_audit_generator.py` to audit compliance
3. Run `ctb_remediator.py` to fix issues

---

**CTB Metadata Tagger v1.0.0**
