# Migration Guide

## Running Migrations

All migrations are run through Composio MCP to ensure audit trail and validation.

### Manual Migration
```bash
npm run migrate
```

This will:
1. Connect to Neon via Composio MCP
2. Run migrations in order: 01_schema.sql → 02_views.sql → 03_seed.sql
3. Log results to audit trail

### Migration Order
- `01_schema.sql` - Creates tables, indexes, triggers
- `02_views.sql` - Creates convenience views
- `03_seed.sql` - Seeds sample data (dev/test only)

### Production Notes
- Skip `03_seed.sql` in production
- Always backup before migration
- Verify Composio MCP endpoint is available
- Check audit logs after migration