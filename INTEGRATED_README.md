# Client SubHive Integrated System

This repository integrates three major components:

## 1. Client SubHive
- **Purpose**: Complete client data management and tracking system
- **Database**: Neon PostgreSQL schema for comprehensive client data
- **Schema**: `client_subhive_schema.sql` - includes tables for clients, team members, projects, and more

## 2. IMO Creator Blueprint App
- **Purpose**: 4-page planning app with SSOT manifest, flex ladder stages, and visual progress tracking
- **Key Features**:
  - YAML-based configuration with flexible stages per bucket
  - Automatic progress calculation (done/wip/todo)
  - Mermaid diagrams for overview and per-bucket ladders
  - FastAPI for manifest GET/PUT operations
  - Factory/Mechanic architecture for UI and repair systems

## 3. Barton Outreach Core
- **Purpose**: Marketing > Outreach Doctrine with HEIR Agent System
- **Integration Points**:
  - Apollo, Apify, MillionVerifier, Instantly, and HeyReach APIs
  - 12 specialized agents (orchestrators, managers, specialists)
  - Real-time task management and system monitoring
  - Modular, altitude-based pages for Doctrine Tracker

## Project Structure

```
client-subhive/
├── api/                    # API endpoints from IMO Creator
├── apps/                   # Application modules
├── barton-components/      # Barton Outreach React components
├── barton-doctrine/        # Barton Doctrine configuration
├── barton-lib/            # Barton library utilities
├── barton-modules/        # Barton modular components
├── barton-ops/            # Barton operations
├── barton-pages/          # Barton page components
├── claude-agents-library/ # Claude agents for orchestration
├── docs/                  # Documentation
├── factory/               # Factory UI system
├── garage-mcp/            # Garage MCP system
├── mechanic/              # Mechanic repair system
├── packages/              # Shared packages
├── repo-lens/             # Repository analysis tools
├── scripts/               # Utility scripts
├── src/                   # Source code
├── templates/             # Template files
├── tests/                 # Test suites
├── tools/                 # Development tools
└── client_subhive_schema.sql  # Database schema
```

## Quick Start

1. **Install Dependencies**:
```bash
npm install
pip install -r requirements.txt
```

2. **Environment Setup**:
```bash
cp .env.example .env
# Add your API keys:
# - ANTHROPIC_API_KEY
# - OPENAI_API_KEY
# - Neon database credentials
# - Integration API keys (Apollo, Apify, etc.)
```

3. **Run Development Servers**:
```bash
# IMO Creator UI
npm run factory:dev

# Barton Outreach UI
npm run dev

# API Server
uvicorn src.server.main:app --port 7002 --reload
```

4. **Database Setup**:
```bash
# Apply the client_subhive_schema.sql to your Neon database
```

## Key Commands

- `npm run dev` - Start Vite development server
- `npm run factory:dev` - Start Factory UI development
- `npm run audit` - Run garage bay audit
- `npm run compliance:check` - Check repository compliance
- `npm run orchestrate` - Run MCP orchestrator
- `npm run env:check` - Verify environment setup

## Integration Notes

### Composio Integration
The Barton Outreach Core includes configuration for Composio integration with credentials stored in the doctrine configuration. These are used for:
- API orchestration
- Agent communication
- External service integration

### Database Integration
Both IMO Creator and Barton Outreach systems integrate with the Client SubHive database schema for:
- Marketing company intake
- People management
- Outreach message registry
- Campaign run logs

### HEIR Agent System
The integrated HEIR (Hierarchical Execution Intelligence & Repair) system provides:
- CEO Orchestrator for master coordination
- Backend Manager for Neon schema management
- Integration Manager for API contracts
- Deployment Manager for system deployment

## Development Workflow

1. Use the Factory UI for blueprint planning and progress tracking
2. Use the Barton Outreach pages for marketing campaign management
3. Use the garage-mcp system for compliance and repair operations
4. Monitor all systems through the integrated dashboard

## Support

For issues or questions:
- IMO Creator: Check `/docs` directory
- Barton Outreach: See `/barton-doctrine/config`
- Client SubHive: Review `client_subhive_schema.sql`