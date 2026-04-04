# CLAUDE.md — Client Intake & Vendor Export System

## Identity

This is a **blueprint repo** — schemas, doctrine, definitions. ZERO runtime code.
All executable processes live in **Barton-Processes** (factory/client/ 800-series).

**Hub ID**: client
**Hub Name**: Client Intake & Vendor Export System
**Domain**: SVG client service — intake, vendor export, portal
**Authority**: Inherited from imo-creator-v2 (Sovereign)

---

## Parent Authority — IMO-Creator v2

This repo conforms to imo-creator-v2. Parent defines, children conform. Never the reverse.

| Doctrine | Path in imo-creator-v2 | Status |
|----------|----------------------|--------|
| **Engine** | `law/doctrine/FOUNDATIONAL_BEDROCK.md` | LOCKED |
| **Application Layer** | `law/doctrine/DMJ.md` | LOCKED |
| **Applied Engine** | `law/doctrine/FCE.md` | LOCKED |
| **Structure** | `law/STRUCTURE_MANIFEST.yaml` | LOCKED |
| **Tools** | `law/SNAP_ON_TOOLBOX.yaml` | GATED |
| **Math** | `law/doctrine/TIER0_MATHEMATICAL_PRINCIPLE.md` | LOCKED |
| **UP (Universal Process)** | `factory/agents/up/up.py` | LOCKED |

---

## Blueprint, Not Muscle

This repo defines WHAT. Barton-Processes defines HOW.

| This Repo (Blueprint) | Barton-Processes (Muscle) |
|------------------------|--------------------------|
| Schema (column registry) | CF Workers (800-830) |
| OSAM (query routing) | D1 working tables |
| Vendor blueprints (field mappings) | Export generation |
| Doctrine, governance | Runtime execution |

**No executable code belongs here.** If it runs, it goes in Barton-Processes.

---

## Processes (in Barton-Processes)

| # | Name | What It Does |
|---|------|-------------|
| 800 | Client Mint | CL sovereign ID → mint client_id → D1 → vault to Neon |
| 810 | Client Data Intake | CSV/API → Zod validate → D1 staging → promote canonical → vault |
| 820 | Vendor Export | Cron → D1 canonical → vendor blueprint mapping → export files |
| 830 | Client Portal | 5 pages (renewal, CEO, HR, underwriting, agent) → SSR HTML |

---

## LBB Protocol

Query LBB before any work. Ingest learnings after.

- Subject: `svg-client` (client service knowledge)
- Subject: `svg-client-proc` (process-specific learnings)
- LBB Worker: `https://lbb.svg-outreach.workers.dev`

---

## Golden Rules

1. This repo conforms to imo-creator-v2. Parent defines, children conform.
2. Blueprint = brain. Barton-Processes = muscle. Never mix.
3. No executable code in this repo.
4. Determinism first. LLM as tail only.
5. LBB first, LBB last.

---

## Document Control

| Field | Value |
|-------|-------|
| Created | 2025-10-01 |
| Last Modified | 2026-04-03 |
| Version | 3.0.0 |
| Status | ACTIVE |
| Authority | imo-creator-v2 (Inherited) |
