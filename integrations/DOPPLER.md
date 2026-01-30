# Secrets Management Integration

## Conformance

| Field | Value |
|-------|-------|
| **Doctrine Version** | 1.0.0 |
| **CC Layer** | CC-03 (Spoke Interface) |

---

## Hub Identity (CC-02)

| Field | Value |
|-------|-------|
| **Sovereign ID** | imo-creator |
| **Hub Name** | Client Intake & Vendor Export System |
| **Hub ID** | client-subhive |
| **Secrets Project** | client-subhive |

---

## Overview

All hubs MUST use centralized secrets management.

**No exceptions. No local `.env` files in production.**

This template defines the interface for secrets management spokes (CC-03).

---

## Required Configuration

### doppler.yaml

Every hub MUST have a `doppler.yaml` at the root:

```yaml
setup:
  project: client-subhive
  config: dev
```

### Environment Configs

| Config | Purpose | Sync Target |
|--------|---------|-------------|
| `dev` | Local development | Local machine |
| `stg` | Staging environment | Staging server |
| `prd` | Production environment | Production server |

---

## Required Secrets (This Hub)

| Secret | Description | CC Layer | Required |
|--------|-------------|----------|----------|
| `HUB_ID` | Unique hub identifier (client-subhive) | CC-02 | Yes |
| `NEON_DATABASE_URL` | Neon PostgreSQL connection string | CC-02 | Yes |
| `COMPOSIO_API_KEY` | Composio MCP integration key | CC-03 | No |
| `IMO_MASTER_ERROR_ENDPOINT` | Error logging endpoint | CC-04 | No |
| `IMO_ERROR_API_KEY` | Error logging API key | CC-04 | No |
| `IMOCREATOR_SIDECAR_URL` | Sidecar telemetry URL | CC-04 | No |
| `IMOCREATOR_BEARER_TOKEN` | Sidecar authentication token | CC-04 | No |

---

## Setup Commands

```bash
# Install Doppler CLI
brew install dopplerhq/cli/doppler  # macOS
# or
curl -Ls https://cli.doppler.com/install.sh | sh  # Linux
# or (Windows PowerShell)
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
iex (iwr 'https://cli.doppler.com/install.ps1').Content

# Login
doppler login

# Setup project (run from repo root)
doppler setup

# Verify secrets
doppler secrets

# Run with secrets
doppler run -- <your-command>

# Example: Run Node.js app
doppler run -- npm start

# Example: Run Python app
doppler run -- python main.py

# Example: Run database migrations
doppler run -- npm run migrate
```

---

## Local Development

For local development, create a `.env` file from Doppler:

```bash
# Export secrets to .env (dev only)
doppler secrets download --no-file --format env > .env

# Or run directly with Doppler (preferred)
doppler run -- npm start
```

**Never commit `.env` files.** They are gitignored.

---

## CI/CD Integration

### GitHub Actions

```yaml
- name: Install Doppler CLI
  uses: dopplerhq/cli-action@v3

- name: Run with Doppler
  run: doppler run -- npm run build
  env:
    DOPPLER_TOKEN: ${{ secrets.DOPPLER_TOKEN }}
```

### Vercel

```bash
# Sync to Vercel
doppler secrets download --no-file --format env | vercel env add
```

### Render

```bash
# Sync to Render
doppler secrets download --no-file --format env-no-quotes > render.env
```

---

## Secret Rotation

| Secret Type | Rotation Frequency |
|-------------|-------------------|
| API Keys | 90 days |
| Tokens | 30 days |
| Passwords | 90 days |
| Database URLs | On breach only |

---

## Shell Completions

For improved CLI experience, install shell completions:

```bash
# Bash
source integrations/doppler/doppler.bash

# Zsh
source integrations/doppler/doppler.zsh

# Fish
source integrations/doppler/doppler.fish
```

Or add to your shell profile for persistence.

---

## Compliance Checklist

- [x] `doppler.yaml` exists at hub root
- [ ] Project created in Doppler dashboard
- [ ] dev/stg/prd configs created
- [ ] All secrets stored in Doppler
- [x] No secrets in code or `.env` committed
- [ ] CI/CD uses Doppler token
- [ ] Rotation schedule documented

---

## Forbidden Patterns

```
╔══════════════════════════════════════════════════════════════════════╗
║                         FORBIDDEN PATTERNS                            ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║   ❌ .env files committed to git                                     ║
║   ❌ Hardcoded secrets in source code                                ║
║   ❌ Secrets in configuration files                                  ║
║   ❌ Secrets in CI/CD logs                                           ║
║   ❌ Secrets shared via chat/email                                   ║
║   ❌ Environment variables not from Doppler                          ║
║                                                                       ║
║   If you see any of these patterns, HALT and report immediately.     ║
║                                                                       ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## Traceability

| Artifact | Reference |
|----------|-----------|
| Bootstrap Guide | CLAUDE.md |
| Canonical Doctrine | CANONICAL_ARCHITECTURE_DOCTRINE.md |
| Hub Doctrine | DOCTRINE.md |
| PRD | docs/prd/PRD.md |
| ADR | docs/adr/ADR-001-architecture.md |
| IMO_CONTROL | IMO_CONTROL.json (secrets.provider) |
| CONSTITUTION | CONSTITUTION.md (Secrets Policy) |
