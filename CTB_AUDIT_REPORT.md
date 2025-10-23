# CTB Audit Report

**Generated:** 2025-10-23 17:48:01
**Root Path:** C:\Users\CUSTOMER PC\Cursor Repo\client-subhive\ctb
**Compliance Score:** 79/100

## Executive Summary

❌ **FAIL** - CTB structure requires remediation

### Statistics

- **Total Files Audited:** 232
- **Tagged Files:** 184 (79.3%)
- **Untagged Files:** 48
- **Invalid Metadata:** 0
- **Duplicate IDs:** 0
- **Total Issues:** 48

### By Branch

| Branch | Files | Tagged | Issues |
|--------|-------|--------|--------|
| AI | 19 | 8 | 0 |
| DATA | 11 | 2 | 0 |
| DOCS | 14 | 9 | 0 |
| META | 10 | 2 | 0 |
| SYS | 53 | 47 | 0 |
| UI | 125 | 116 | 0 |


## Issues Breakdown

### Critical Issues (0)

*No critical issues found.*


### Errors (0)

*No errors found.*


### Warnings (48)

- **ai/agents/claude-agents-library/agents/database-specialist.md**: File missing CTB metadata
- **ai/agents/claude-agents-library/agents/devops-engineer.md**: File missing CTB metadata
- **ai/agents/claude-agents-library/agents/frontend-architect.md**: File missing CTB metadata
- **ai/agents/claude-agents-library/agents/security-auditor.md**: File missing CTB metadata
- **ai/agents/claude-agents-library/manifest.json**: File missing CTB metadata
- **ai/agents/claude-agents-library/mcp/requirements.txt**: File missing CTB metadata
- **ai/modules/barton-modules/altitude-05000/page-05000.md**: File missing CTB metadata
- **ai/modules/barton-modules/altitude-10000/page-10000.md**: File missing CTB metadata
- **ai/modules/barton-modules/altitude-20000/page-20000.md**: File missing CTB metadata
- **ai/modules/barton-modules/altitude-30000/page-30000.md**: File missing CTB metadata

*...and 38 more warnings*


## Recommendations


1. **Run CTB Metadata Tagger** to tag all untagged files:
   ```bash
   python ctb/sys/global-factory/scripts/ctb_metadata_tagger.py ctb/
   ```

2. **Run CTB Remediator** to fix metadata issues:
   ```bash
   python ctb/sys/global-factory/scripts/ctb_remediator.py ctb/
   ```

3. **Re-run audit** to verify fixes:
   ```bash
   python ctb/sys/global-factory/scripts/ctb_audit_generator.py ctb/
   ```


## File Registry

Total registered files: 184

<details>
<summary>Click to view file registry</summary>

| Path | Branch | CTB ID | Size |
|------|--------|--------|------|
| `ai/agents/claude-agents-library/install.sh` | ai | CTB-3C297DB43F60 | 10459 |
| `ai/agents/claude-agents-library/mcp/registry_endpoint.py` | ai | CTB-A096C3BA5A85 | 10893 |
| `ai/agents/claude-agents-library/mcp/scripts/install_agents.sh` | ai | CTB-AA78C588862B | 12601 |
| `ai/packages/__init__.py` | ai | CTB-5BC463553FA4 | 217 |
| `ai/packages/heir/__init__.py` | ai | CTB-BD1D1748E2F8 | 308 |
| `ai/packages/heir/checks.py` | ai | CTB-6E542713C6FF | 9263 |
| `ai/packages/sidecar/__init__.py` | ai | CTB-A71064E2E8FD | 387 |
| `ai/packages/sidecar/event_emitter.py` | ai | CTB-C6CE4DF68A42 | 4122 |
| `data/db/registry/clnt_column_registry.yml` | data | CTB-B707D8EB806A | 5493 |
| `data/firebase/types/firestore.ts` | data | CTB-026D4A91FCE6 | 3653 |
| `docs/docs/blueprints/example/manifest.yaml` | docs | CTB-43D6012DD52C | 6095 |
| `docs/docs/blueprints/imo/manifest.yaml` | docs | CTB-D48D4BBF4022 | 5806 |
| `docs/docs/blueprints/ui/app.js` | docs | CTB-85494C120B2D | 51968 |
| `docs/docs/blueprints/ui/input.html` | docs | CTB-7D64310902B0 | 4479 |
| `docs/docs/blueprints/ui/middle.html` | docs | CTB-6D5D424201D5 | 4468 |
| `docs/docs/blueprints/ui/output.html` | docs | CTB-F1F91C27778A | 4270 |
| `docs/docs/blueprints/ui/overview.html` | docs | CTB-833FE16C6B34 | 4684 |
| `docs/docs/blueprints/ui/style.css` | docs | CTB-A197961863D6 | 5954 |
| `docs/docs/ssot.sample.yaml` | docs | CTB-020A77E37A7B | 1562 |
| `meta/config/imo_registry.yaml` | meta | CTB-EE07A4D91AC0 | 4972 |
| `meta/templates/imo-compliance-check.py` | meta | CTB-BC299DCE9625 | 6077 |
| `sys/factory/ui/build.js` | sys | CTB-E49FC5032005 | 2069 |
| `sys/factory/ui/dev.js` | sys | CTB-618AAA48CA24 | 935 |
| `sys/factory/ui/init.sh` | sys | CTB-F484225A003B | 4002 |
| `sys/global-factory/compliance-check.sh` | sys | CTB-73CFC8EA0865 | 7177 |
| `sys/global-factory/scripts/ctb_audit_generator.py` | sys | CTB-812C324EF873 | 15318 |
| `sys/global-factory/scripts/ctb_metadata_tagger.py` | sys | CTB-5459B523369F | 11991 |
| `sys/global-factory/scripts/ctb_remediator.py` | sys | CTB-EA71E95C43C5 | 16785 |
| `sys/mcp-servers/github-composio-server.js` | sys | CTB-BFFBD3B19A76 | 11443 |
| `sys/mcp-servers/github-direct-server.js` | sys | CTB-9B585948960B | 12556 |
| `sys/mcp-servers/smartsheet-server.js` | sys | CTB-EBA0714ADB2E | 13030 |
| `sys/mechanic/recall/recall.sh` | sys | CTB-1D2E391F530C | 4038 |
| `sys/scripts/composio_neon_setup.py` | sys | CTB-C80FF5636BC3 | 7433 |
| `sys/scripts/create_neon_tables.py` | sys | CTB-65F56442EE96 | 5687 |
| `sys/scripts/install-pre-commit-hook.sh` | sys | CTB-CB52F7F87AF8 | 2643 |
| `sys/scripts/install-pre-push-hook.sh` | sys | CTB-ABA85332631F | 3453 |
| `sys/scripts/neon_setup_composio.py` | sys | CTB-8D3373717921 | 5077 |
| `sys/scripts/promote_to_neon.ts` | sys | CTB-5F0F0688C295 | 3021 |
| `sys/scripts/run_migrations_via_mcp.ts` | sys | CTB-47BAF1013741 | 1921 |
| `sys/scripts/run_vendor_export.ts` | sys | CTB-7AB9C98BEA4C | 4021 |
| `sys/scripts/setup_composio_integrations.py` | sys | CTB-8A5A9DC3F51A | 16662 |
| `sys/scripts/setup_neon_composio.py` | sys | CTB-11BD503BB2CA | 6573 |
| `sys/scripts/setup_neon_direct.py` | sys | CTB-B235B9A2DB75 | 6320 |
| `sys/scripts/sync-composio-config.js` | sys | CTB-17F36E8BF51B | 12126 |
| `sys/scripts/validate_registry.ts` | sys | CTB-78487212268A | 3212 |
| `sys/tests/blueprints/test_input_page.py` | sys | CTB-A269E1A9EF8B | 4959 |
| `sys/tests/blueprints/test_middle_page.py` | sys | CTB-FC50410BAE8B | 6958 |
| `sys/tests/blueprints/test_output_page.py` | sys | CTB-E1E139A73B40 | 8534 |
| `sys/tests/blueprints/test_overview_example.py` | sys | CTB-8BDFA9E6C3E2 | 4861 |
| `sys/tests/test_api_smoke.py` | sys | CTB-428D61E0B0A3 | 1112 |
| `sys/tests/test_blueprint_shell.py` | sys | CTB-59C2DC7270BF | 3700 |
| `sys/tests/test_doctrine_features.py` | sys | CTB-F779C782C380 | 4752 |
| `sys/tests/test_llm_endpoint.py` | sys | CTB-716A8604396D | 7490 |
| `sys/tools/blueprint_score.py` | sys | CTB-57CAB0D192C7 | 4888 |
| `sys/tools/blueprint_visual.py` | sys | CTB-4E9D995F13E8 | 5575 |
| `sys/tools/compliance_heartbeat.py` | sys | CTB-E5C75BC9F40D | 14901 |
| `sys/tools/composio_app_connector.py` | sys | CTB-ACB238547016 | 24353 |
| `sys/tools/deep_wiki_generator.sh` | sys | CTB-A5FD2147B26F | 16482 |
| `sys/tools/demo_client.py` | sys | CTB-052A54527D99 | 7263 |
| `sys/tools/demo_workflow.py` | sys | CTB-F818CEF4E0A0 | 6597 |
| `sys/tools/garage_bay_demo.py` | sys | CTB-FEF7CDBA00A1 | 4554 |
| `sys/tools/ids.py` | sys | CTB-9E72DD39D2A2 | 1586 |
| `sys/tools/imo_unified_registry.py` | sys | CTB-13A81433B2E0 | 24571 |
| `sys/tools/repo_audit.py` | sys | CTB-435BF8CA5F12 | 3821 |
| `sys/tools/repo_compliance_check.py` | sys | CTB-DB31F3E8DCC6 | 12618 |
| `sys/tools/repo_compliance_fixer.py` | sys | CTB-792C223532A6 | 15417 |
| `sys/tools/repo_mcp_orchestrator.py` | sys | CTB-07217AA70977 | 21929 |
| `sys/tools/wiki_generator.sh` | sys | CTB-8B9C700F2044 | 10627 |
| `ui/api/hello.js` | ui | CTB-5F9DA8B68024 | 376 |
| `ui/api/llm.js` | ui | CTB-8431F1359197 | 7979 |
| `ui/api/ssot/save.js` | ui | CTB-BAEB70655433 | 4181 |
| `ui/api/subagents.js` | ui | CTB-B76A08EB2017 | 2291 |
| `ui/api/test.js` | ui | CTB-6DF5A22CE337 | 371 |
| `ui/apps/my-app/docs/branches/_tree.yml` | ui | CTB-6D4198710635 | 308 |
| `ui/apps/my-app/docs/branches/example.yml` | ui | CTB-BB22210CCD8F | 988 |
| `ui/apps/my-app/docs/toolbox/profiles.yml` | ui | CTB-B1D994FD62E8 | 1268 |
| `ui/barton-lib/agents/database-agent.ts` | ui | CTB-90E221FBB95C | 16466 |
| `ui/barton-lib/agents/global-database-agent.ts` | ui | CTB-B48D599BDB07 | 23448 |
| `ui/barton-lib/agents/orchestrators/delivery-branch-orchestrator.ts` | ui | CTB-3AE4F5A14BBE | 28794 |
| `ui/barton-lib/agents/orchestrators/lead-branch-orchestrator.ts` | ui | CTB-452FA699B2E6 | 21355 |
| `ui/barton-lib/agents/orchestrators/master-orchestrator.ts` | ui | CTB-AC56704EDDE0 | 13816 |
| `ui/barton-lib/agents/orchestrators/messaging-branch-orchestrator.ts` | ui | CTB-A08011146BBC | 29635 |
| `ui/barton-lib/agents/orchestrators/overall-orchestrator.ts` | ui | CTB-EAFD753552C4 | 18497 |
| `ui/barton-lib/heir/agent-registry.ts` | ui | CTB-DF862B9D1C7F | 9084 |
| `ui/barton-lib/heir/orchestration-engine.ts` | ui | CTB-3F303FC8967D | 4804 |
| `ui/barton-lib/heir/types.ts` | ui | CTB-8E2ABFE3CE4D | 1634 |
| `ui/barton-lib/imo/heir-integration.ts` | ui | CTB-415ED1CBA016 | 5607 |
| `ui/barton-lib/imo/imo-service.ts` | ui | CTB-775B8F6D403F | 5009 |
| `ui/barton-lib/imo/types.ts` | ui | CTB-6EF90927014A | 1560 |
| `ui/barton-lib/template/application-config.ts` | ui | CTB-0AADF4D2B0CE | 9197 |
| `ui/barton-lib/utils.ts` | ui | CTB-0F5A31615D02 | 371 |
| `ui/components/barton-components/heir/AgentCard.tsx` | ui | CTB-E5369F7AF7DD | 3925 |
| `ui/components/barton-components/heir/HEIRContext.tsx` | ui | CTB-BEB11DB3E4F9 | 1699 |
| `ui/components/barton-components/heir/HEIRDashboard.tsx` | ui | CTB-A2ED15FC909A | 10460 |
| `ui/components/barton-components/heir/HEIRProvider.tsx` | ui | CTB-F86F280D2F90 | 325 |
| `ui/components/barton-components/heir/SystemMonitor.tsx` | ui | CTB-88CDF9E8F539 | 4896 |
| `ui/components/barton-components/heir/TaskList.tsx` | ui | CTB-8B685E974EDC | 3656 |
| `ui/components/barton-components/imo/IMOBucketEditor.tsx` | ui | CTB-A33A3DB07D3D | 7501 |
| `ui/components/barton-components/imo/IMOHEIRStatus.tsx` | ui | CTB-234AA9CFF43D | 8337 |
| `ui/components/barton-components/imo/IMOOverview.tsx` | ui | CTB-9F0D33C1C123 | 4361 |

*...and 84 more files*

</details>

---

**CTB Audit Generator v1.0.0**
**Next Steps:** Review issues and run remediator to fix problems.
