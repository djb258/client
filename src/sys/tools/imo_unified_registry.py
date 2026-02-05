#!/usr/bin/env python3
"""
CTB Metadata
ctb_id: CTB-13A81433B2E0
ctb_branch: sys
ctb_path: sys/tools/imo_unified_registry.py
ctb_version: 1.0.0
created: 2025-10-23T16:37:01.161899
checksum: ef3c4a14
"""

"""
IMO Creator Unified Tool Registry
Central registry for all IMO Creator tools with Composio MCP as the default app connector.

This registry provides a single entry point for all IMO Creator functionality:
- Code analysis and compliance checking
- Repository orchestration via MCP
- App integrations via Composio (GitHub, Slack, etc.)
- HEIR doctrine-based error handling and altitude coordination
- Automated workflow execution
"""

import os
import sys
import json
import asyncio
import logging
from pathlib import Path
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, asdict
from datetime import datetime
from enum import Enum

# Core imports
try:
    import yaml
    YAML_AVAILABLE = True
except ImportError:
    yaml = None
    YAML_AVAILABLE = False

try:
    from pydantic import BaseModel, Field
    PYDANTIC_AVAILABLE = True
except ImportError:
    BaseModel = None
    Field = None
    PYDANTIC_AVAILABLE = False

try:
    from composio import Composio, App
    from composio_langchain import ComposioToolset
    COMPOSIO_AVAILABLE = True
except ImportError:
    Composio = None
    App = None
    ComposioToolset = None
    COMPOSIO_AVAILABLE = False

# MCP imports (optional)
try:
    from mcp import ClientSession, StdioServerParameters
    from mcp.client.stdio import stdio_client
    MCP_AVAILABLE = True
except ImportError:
    ClientSession = None
    StdioServerParameters = None
    stdio_client = None
    MCP_AVAILABLE = False

# IMO Creator imports (optional)
sys.path.append(str(Path(__file__).parent.parent))
try:
    from tools.repo_mcp_orchestrator import RepoMCPOrchestrator
except ImportError:
    RepoMCPOrchestrator = None

try:
    from tools.repo_compliance_check import ComplianceChecker
except ImportError:
    ComplianceChecker = None

try:
    from tools.repo_compliance_fixer import ComplianceFixer  
except ImportError:
    ComplianceFixer = None

try:
    from garage_bay import GarageBay
except ImportError:
    GarageBay = None

try:
    from barton_lib.imo.heir_integration import HeIRProcessor
except ImportError:
    HeIRProcessor = None

class ToolCategory(str, Enum):
    """Tool categories for organized access"""
    ANALYSIS = "analysis"
    COMPLIANCE = "compliance"
    ORCHESTRATION = "orchestration"
    INTEGRATION = "integration"
    AUTOMATION = "automation"
    MONITORING = "monitoring"

class AppIntegrationType(str, Enum):
    """Supported app integration types via Composio"""
    GITHUB = "github"
    SLACK = "slack"
    NOTION = "notion"
    DISCORD = "discord"
    EMAIL = "email"
    CALENDAR = "calendar"
    DATABASE = "database"
    CI_CD = "ci_cd"

@dataclass
class ToolDefinition:
    """Definition of an IMO Creator tool"""
    name: str
    category: ToolCategory
    description: str
    file_path: str
    entry_function: str
    altitude: int
    dependencies: List[str]
    composio_apps: List[AppIntegrationType]
    mcp_enabled: bool = True
    heir_compatible: bool = True

class IMOUnifiedRegistry:
    """
    Unified registry for all IMO Creator tools with Composio MCP integration
    """
    
    def __init__(self, config_path: Optional[str] = None):
        # Logging setup first
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
        
        self.config_path = config_path or Path(__file__).parent.parent / "config" / "imo_registry.yaml"
        self.root_path = Path(__file__).parent.parent
        
        # Initialize Composio as default app connector
        self.composio_client = None
        self.composio_toolset = None
        self._init_composio()
        
        # Initialize MCP client session
        self.mcp_session = None
        
        # Tool registry
        self.tools = {}
        self.app_integrations = {}
        self._register_all_tools()
        
    def _init_composio(self):
        """Initialize Composio as the default app connector"""
        if not COMPOSIO_AVAILABLE:
            self.logger.warning("Composio not available. Install composio-core to enable app integrations")
            return
            
        try:
            api_key = os.getenv("COMPOSIO_API_KEY")
            if api_key:
                self.composio_client = Composio(api_key=api_key)
                self.composio_toolset = ComposioToolset()
                self.logger.info("Composio initialized successfully as default app connector")
            else:
                self.logger.warning("COMPOSIO_API_KEY not found. Set it to enable app integrations")
                # Initialize without API key for basic functionality
                self.composio_client = Composio()
                self.composio_toolset = ComposioToolset()
        except Exception as e:
            self.logger.error(f"Failed to initialize Composio: {e}")
            
    def _register_all_tools(self):
        """Register all available IMO Creator tools"""
        
        # Analysis Tools
        self.tools["repo_audit"] = ToolDefinition(
            name="Repository Audit",
            category=ToolCategory.ANALYSIS,
            description="Complete repository analysis and scoring",
            file_path="tools/repo_audit.py",
            entry_function="audit_repository",
            altitude=20000,
            dependencies=["garage_bay"],
            composio_apps=[AppIntegrationType.GITHUB],
            mcp_enabled=True
        )
        
        self.tools["code_analyzer"] = ToolDefinition(
            name="Code Quality Analyzer",
            category=ToolCategory.ANALYSIS,
            description="AST parsing, complexity analysis, pattern detection",
            file_path="tools/blueprint_score.py",
            entry_function="analyze_code_quality",
            altitude=20000,
            dependencies=["ast", "complexity_analyzer"],
            composio_apps=[AppIntegrationType.GITHUB, AppIntegrationType.SLACK],
            mcp_enabled=True
        )
        
        # Compliance Tools
        self.tools["compliance_checker"] = ToolDefinition(
            name="Compliance Checker",
            category=ToolCategory.COMPLIANCE,
            description="IMO Creator standards validation",
            file_path="tools/repo_compliance_check.py",
            entry_function="check_compliance",
            altitude=20000,
            dependencies=[],
            composio_apps=[AppIntegrationType.GITHUB, AppIntegrationType.SLACK],
            mcp_enabled=True
        )
        
        self.tools["compliance_fixer"] = ToolDefinition(
            name="Compliance Fixer",
            category=ToolCategory.COMPLIANCE,
            description="Automated compliance issue resolution",
            file_path="tools/repo_compliance_fixer.py",
            entry_function="fix_compliance_issues",
            altitude=10000,
            dependencies=["compliance_checker"],
            composio_apps=[AppIntegrationType.GITHUB],
            mcp_enabled=True
        )
        
        self.tools["compliance_heartbeat"] = ToolDefinition(
            name="Compliance Heartbeat",
            category=ToolCategory.MONITORING,
            description="Continuous compliance monitoring",
            file_path="tools/compliance_heartbeat.py",
            entry_function="monitor_compliance",
            altitude=15000,
            dependencies=["compliance_checker"],
            composio_apps=[AppIntegrationType.SLACK, AppIntegrationType.EMAIL],
            mcp_enabled=True
        )
        
        # Orchestration Tools
        self.tools["mcp_orchestrator"] = ToolDefinition(
            name="MCP Orchestrator",
            category=ToolCategory.ORCHESTRATION,
            description="Repository improvement via MCP and subagents",
            file_path="tools/repo_mcp_orchestrator.py",
            entry_function="orchestrate_repository_improvement",
            altitude=30000,
            dependencies=["garage_mcp", "heir_integration"],
            composio_apps=[AppIntegrationType.GITHUB, AppIntegrationType.SLACK, AppIntegrationType.NOTION],
            mcp_enabled=True
        )
        
        # Integration and Automation Tools
        self.tools["garage_bay"] = ToolDefinition(
            name="Garage Bay",
            category=ToolCategory.INTEGRATION,
            description="MCP garage bay operations and demo workflows",
            file_path="garage_bay.py",
            entry_function="run_garage_bay",
            altitude=15000,
            dependencies=["mcp"],
            composio_apps=[AppIntegrationType.GITHUB, AppIntegrationType.DISCORD],
            mcp_enabled=True
        )
        
        self.tools["demo_workflow"] = ToolDefinition(
            name="Demo Workflow",
            category=ToolCategory.AUTOMATION,
            description="Demonstration workflows and examples",
            file_path="tools/demo_workflow.py",
            entry_function="run_demo_workflow",
            altitude=10000,
            dependencies=[],
            composio_apps=[AppIntegrationType.SLACK, AppIntegrationType.NOTION],
            mcp_enabled=True
        )
        
        # Specialized Tools
        self.tools["blueprint_visual"] = ToolDefinition(
            name="Blueprint Visualizer",
            category=ToolCategory.ANALYSIS,
            description="Visual blueprint generation and scoring",
            file_path="tools/blueprint_visual.py",
            entry_function="generate_visual_blueprint",
            altitude=15000,
            dependencies=["matplotlib", "graphviz"],
            composio_apps=[AppIntegrationType.NOTION, AppIntegrationType.SLACK],
            mcp_enabled=True
        )
        
        self.tools["heir_integration"] = ToolDefinition(
            name="HEIR Integration",
            category=ToolCategory.ORCHESTRATION,
            description="HEIR doctrine-based coordination and error handling",
            file_path="barton-lib/imo/heir_integration.ts",
            entry_function="process_heir_workflow",
            altitude=30000,
            dependencies=["heir_doctrine"],
            composio_apps=[AppIntegrationType.SLACK, AppIntegrationType.EMAIL],
            mcp_enabled=True
        )
        
    async def setup_app_integrations(self, apps: List[AppIntegrationType]) -> Dict[str, Any]:
        """Set up Composio app integrations"""
        if not self.composio_client:
            raise RuntimeError("Composio not initialized. Set COMPOSIO_API_KEY.")
            
        results = {}
        
        for app_type in apps:
            try:
                if app_type == AppIntegrationType.GITHUB:
                    # Set up GitHub integration
                    github_tools = self.composio_toolset.get_tools(apps=[App.GITHUB])
                    results["github"] = {
                        "status": "configured",
                        "tools": [tool.name for tool in github_tools],
                        "actions": ["create_issue", "create_pr", "get_repo_info", "list_commits"]
                    }
                    
                elif app_type == AppIntegrationType.SLACK:
                    # Set up Slack integration
                    slack_tools = self.composio_toolset.get_tools(apps=[App.SLACK])
                    results["slack"] = {
                        "status": "configured", 
                        "tools": [tool.name for tool in slack_tools],
                        "actions": ["send_message", "create_channel", "upload_file"]
                    }
                    
                elif app_type == AppIntegrationType.NOTION:
                    # Set up Notion integration
                    notion_tools = self.composio_toolset.get_tools(apps=[App.NOTION])
                    results["notion"] = {
                        "status": "configured",
                        "tools": [tool.name for tool in notion_tools], 
                        "actions": ["create_page", "update_page", "create_database"]
                    }
                    
                elif app_type == AppIntegrationType.DISCORD:
                    # Set up Discord integration
                    discord_tools = self.composio_toolset.get_tools(apps=[App.DISCORD])
                    results["discord"] = {
                        "status": "configured",
                        "tools": [tool.name for tool in discord_tools],
                        "actions": ["send_message", "create_channel"]
                    }
                    
                elif app_type == AppIntegrationType.EMAIL:
                    # Set up Email integration
                    email_tools = self.composio_toolset.get_tools(apps=[App.GMAIL])
                    results["email"] = {
                        "status": "configured",
                        "tools": [tool.name for tool in email_tools],
                        "actions": ["send_email", "read_emails", "create_draft"]
                    }
                    
                self.logger.info(f"Configured {app_type.value} integration")
                
            except Exception as e:
                results[app_type.value] = {
                    "status": "failed",
                    "error": str(e)
                }
                self.logger.error(f"Failed to configure {app_type.value}: {e}")
                
        return results
        
    async def execute_tool(self, tool_name: str, **kwargs) -> Dict[str, Any]:
        """Execute an IMO Creator tool with MCP coordination"""
        if tool_name not in self.tools:
            raise ValueError(f"Tool '{tool_name}' not found in registry")
            
        tool_def = self.tools[tool_name]
        
        try:
            # Set up app integrations if needed
            if tool_def.composio_apps:
                integrations = await self.setup_app_integrations(tool_def.composio_apps)
                kwargs["app_integrations"] = integrations
            
            # Import and execute the tool
            tool_module_path = str(self.root_path / tool_def.file_path)
            spec = __import__(tool_module_path.replace('.py', '').replace('/', '.').replace('\\', '.'))
            
            if hasattr(spec, tool_def.entry_function):
                func = getattr(spec, tool_def.entry_function)
                
                if asyncio.iscoroutinefunction(func):
                    result = await func(**kwargs)
                else:
                    result = func(**kwargs)
                    
                return {
                    "tool": tool_name,
                    "status": "success", 
                    "result": result,
                    "altitude": tool_def.altitude,
                    "category": tool_def.category.value
                }
            else:
                raise AttributeError(f"Function '{tool_def.entry_function}' not found in {tool_def.file_path}")
                
        except Exception as e:
            self.logger.error(f"Tool execution failed for {tool_name}: {e}")
            return {
                "tool": tool_name,
                "status": "error",
                "error": str(e),
                "altitude": tool_def.altitude,
                "category": tool_def.category.value
            }
            
    async def orchestrate_full_workflow(self, repo_path: str, workflow_type: str = "complete") -> Dict[str, Any]:
        """Execute a complete IMO Creator workflow"""
        
        workflow_results = {
            "session_id": f"imo_workflow_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "repo_path": repo_path,
            "workflow_type": workflow_type,
            "start_time": datetime.now().isoformat(),
            "tools_executed": [],
            "app_integrations_used": [],
            "final_score": 0
        }
        
        try:
            # Phase 1: Analysis (Altitude 20k)
            self.logger.info("Phase 1: Repository Analysis")
            
            audit_result = await self.execute_tool("repo_audit", repo_path=repo_path)
            workflow_results["tools_executed"].append(audit_result)
            
            compliance_result = await self.execute_tool("compliance_checker", repo_path=repo_path)
            workflow_results["tools_executed"].append(compliance_result)
            
            # Phase 2: Orchestration (Altitude 30k)
            self.logger.info("Phase 2: MCP Orchestration")
            
            orchestration_result = await self.execute_tool("mcp_orchestrator", repo_path=repo_path)
            workflow_results["tools_executed"].append(orchestration_result)
            
            # Phase 3: Compliance Fixing (Altitude 10k)
            self.logger.info("Phase 3: Compliance Resolution")
            
            fix_result = await self.execute_tool("compliance_fixer", repo_path=repo_path)
            workflow_results["tools_executed"].append(fix_result)
            
            # Phase 4: Documentation and Visualization (Altitude 15k)
            self.logger.info("Phase 4: Documentation and Visualization")
            
            visual_result = await self.execute_tool("blueprint_visual", repo_path=repo_path)
            workflow_results["tools_executed"].append(visual_result)
            
            # Phase 5: Monitoring Setup (Altitude 15k)
            self.logger.info("Phase 5: Monitoring Setup")
            
            heartbeat_result = await self.execute_tool("compliance_heartbeat", 
                                                    repo_path=repo_path,
                                                    setup_monitoring=True)
            workflow_results["tools_executed"].append(heartbeat_result)
            
            # Calculate final improvement score
            successful_tools = len([r for r in workflow_results["tools_executed"] if r["status"] == "success"])
            total_tools = len(workflow_results["tools_executed"])
            workflow_results["final_score"] = round((successful_tools / total_tools) * 100, 1)
            
            workflow_results["status"] = "completed"
            workflow_results["end_time"] = datetime.now().isoformat()
            
            # Create summary report via Composio integrations
            await self._create_workflow_report(workflow_results)
            
            return workflow_results
            
        except Exception as e:
            workflow_results["status"] = "failed"
            workflow_results["error"] = str(e)
            workflow_results["end_time"] = datetime.now().isoformat()
            self.logger.error(f"Workflow execution failed: {e}")
            return workflow_results
            
    async def _create_workflow_report(self, workflow_results: Dict[str, Any]):
        """Create workflow report using Composio integrations"""
        if not self.composio_client:
            return
            
        try:
            # Create GitHub issue with results
            github_tools = self.composio_toolset.get_tools(apps=[App.GITHUB])
            if github_tools:
                issue_body = f"""
# IMO Creator Workflow Results

**Session ID:** {workflow_results['session_id']}
**Repository:** {workflow_results['repo_path']}
**Final Score:** {workflow_results['final_score']}%
**Status:** {workflow_results['status']}

## Tools Executed
"""
                for tool_result in workflow_results["tools_executed"]:
                    status_emoji = "✅" if tool_result["status"] == "success" else "❌"
                    issue_body += f"- {status_emoji} **{tool_result['tool']}** (Altitude: {tool_result['altitude']})\n"
                
                # Execute GitHub action to create issue
                # Note: Actual implementation would use the Composio action execution
                
            # Send Slack notification
            slack_tools = self.composio_toolset.get_tools(apps=[App.SLACK])
            if slack_tools:
                message = f"🚀 IMO Creator workflow completed for {workflow_results['repo_path']} with {workflow_results['final_score']}% success rate"
                # Execute Slack action to send message
                
        except Exception as e:
            self.logger.error(f"Failed to create workflow report: {e}")
            
    def get_tool_registry(self) -> Dict[str, Dict[str, Any]]:
        """Get the complete tool registry"""
        return {name: asdict(tool_def) for name, tool_def in self.tools.items()}
        
    def get_tools_by_category(self, category: ToolCategory) -> Dict[str, ToolDefinition]:
        """Get tools filtered by category"""
        return {name: tool_def for name, tool_def in self.tools.items() 
                if tool_def.category == category}
                
    def get_composio_integrations(self) -> Dict[str, List[str]]:
        """Get available Composio app integrations"""
        integrations = {}
        for tool_name, tool_def in self.tools.items():
            if tool_def.composio_apps:
                integrations[tool_name] = [app.value for app in tool_def.composio_apps]
        return integrations

# Global registry instance
_registry = None

def get_imo_registry() -> IMOUnifiedRegistry:
    """Get the global IMO Creator registry instance"""
    global _registry
    if _registry is None:
        _registry = IMOUnifiedRegistry()
    return _registry

# CLI interface
async def main():
    """CLI interface for the IMO Creator Unified Registry"""
    import argparse
    
    parser = argparse.ArgumentParser(description="IMO Creator Unified Tool Registry")
    parser.add_argument("command", choices=["list-tools", "list-integrations", "execute", "workflow"])
    parser.add_argument("--tool", help="Tool name to execute")
    parser.add_argument("--repo-path", help="Repository path for analysis")
    parser.add_argument("--workflow-type", default="complete", help="Workflow type to execute")
    parser.add_argument("--category", help="Filter tools by category")
    
    args = parser.parse_args()
    
    registry = get_imo_registry()
    
    if args.command == "list-tools":
        if args.category:
            tools = registry.get_tools_by_category(ToolCategory(args.category))
        else:
            tools = registry.tools
            
        print("\nIMO Creator Tools Registry")
        print("=" * 50)
        for name, tool_def in tools.items():
            print(f"\n[TOOL] {tool_def.name}")
            print(f"   Category: {tool_def.category.value}")
            print(f"   Description: {tool_def.description}")
            print(f"   Altitude: {tool_def.altitude}")
            print(f"   Apps: {[app.value for app in tool_def.composio_apps]}")
            
    elif args.command == "list-integrations":
        integrations = registry.get_composio_integrations()
        print("\nComposio App Integrations")
        print("=" * 50)
        for tool_name, apps in integrations.items():
            print(f"{tool_name}: {', '.join(apps)}")
            
    elif args.command == "execute":
        if not args.tool:
            print("Error: --tool required for execute command")
            return
            
        if not args.repo_path:
            print("Error: --repo-path required for execute command")
            return
            
        result = await registry.execute_tool(args.tool, repo_path=args.repo_path)
        print(json.dumps(result, indent=2, default=str))
        
    elif args.command == "workflow":
        if not args.repo_path:
            print("Error: --repo-path required for workflow command")
            return
            
        result = await registry.orchestrate_full_workflow(args.repo_path, args.workflow_type)
        print(json.dumps(result, indent=2, default=str))

if __name__ == "__main__":
    asyncio.run(main())