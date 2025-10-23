#!/usr/bin/env python3
"""
Subagent Delegator for Complex Repairs
Routes repair tasks to specialized subagents based on task complexity and category
"""

import json
import os
import sys
from pathlib import Path
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict
from enum import Enum

# Fix Windows console encoding for emojis
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')


class RepairCategory(Enum):
    """Categories of repair tasks"""
    COMPLIANCE = "compliance"
    SECURITY = "security"
    PERFORMANCE = "performance"
    DATABASE = "database"
    INFRASTRUCTURE = "infrastructure"
    DOCUMENTATION = "documentation"
    TESTING = "testing"


class RepairComplexity(Enum):
    """Complexity levels for repair tasks"""
    SIMPLE = 1      # Direct fixes, no dependencies
    MODERATE = 2    # Multiple files, some coordination
    COMPLEX = 3     # Cross-cutting changes, requires planning
    CRITICAL = 4    # High-risk, requires approval


@dataclass
class RepairTask:
    """Represents a repair task to be delegated"""
    id: str
    category: RepairCategory
    complexity: RepairComplexity
    description: str
    target_path: str
    context: Dict
    priority: int = 5  # 1-10, 10 being highest

    def to_dict(self):
        return {
            **asdict(self),
            'category': self.category.value,
            'complexity': self.complexity.value
        }


@dataclass
class Subagent:
    """Represents a specialized subagent"""
    id: str
    name: str
    categories: List[RepairCategory]
    max_complexity: RepairComplexity
    mcp_endpoint: Optional[str] = None
    available: bool = True

    def can_handle(self, task: RepairTask) -> bool:
        """Check if this subagent can handle the given task"""
        return (
            self.available and
            task.category in self.categories and
            task.complexity.value <= self.max_complexity.value
        )


class SubagentRegistry:
    """Registry of available subagents"""

    def __init__(self):
        self.subagents: List[Subagent] = self._load_subagents()

    def _load_subagents(self) -> List[Subagent]:
        """Load subagent registry from config"""
        registry_path = Path(__file__).parent.parent.parent / "garage-mcp" / "docs" / "subagents.registry.json"

        if registry_path.exists():
            with open(registry_path) as f:
                data = json.load(f)
                return [self._create_subagent_from_config(item) for item in data.get("subagents", [])]

        # Fallback to default subagents
        return self._get_default_subagents()

    def _create_subagent_from_config(self, config: Dict) -> Subagent:
        """Create subagent from configuration"""
        categories = [RepairCategory(cat) for cat in config.get("categories", [])]
        max_complexity = RepairComplexity(config.get("max_complexity", 2))

        return Subagent(
            id=config["id"],
            name=config["name"],
            categories=categories,
            max_complexity=max_complexity,
            mcp_endpoint=config.get("mcp_endpoint"),
            available=config.get("available", True)
        )

    def _get_default_subagents(self) -> List[Subagent]:
        """Default subagents if registry not available"""
        return [
            Subagent(
                id="compliance-specialist",
                name="Compliance Specialist",
                categories=[RepairCategory.COMPLIANCE, RepairCategory.DOCUMENTATION],
                max_complexity=RepairComplexity.COMPLEX
            ),
            Subagent(
                id="database-specialist",
                name="Database Specialist",
                categories=[RepairCategory.DATABASE],
                max_complexity=RepairComplexity.CRITICAL,
                mcp_endpoint=os.getenv("GARAGE_MCP_URL")
            ),
            Subagent(
                id="security-auditor",
                name="Security Auditor",
                categories=[RepairCategory.SECURITY],
                max_complexity=RepairComplexity.CRITICAL
            ),
            Subagent(
                id="devops-engineer",
                name="DevOps Engineer",
                categories=[RepairCategory.INFRASTRUCTURE, RepairCategory.PERFORMANCE],
                max_complexity=RepairComplexity.COMPLEX
            ),
            Subagent(
                id="test-engineer",
                name="Test Engineer",
                categories=[RepairCategory.TESTING],
                max_complexity=RepairComplexity.MODERATE
            )
        ]

    def find_subagent(self, task: RepairTask) -> Optional[Subagent]:
        """Find the best subagent for a given task"""
        candidates = [agent for agent in self.subagents if agent.can_handle(task)]

        if not candidates:
            return None

        # Sort by max complexity (prefer more specialized agents)
        candidates.sort(key=lambda a: a.max_complexity.value, reverse=True)
        return candidates[0]


class RepairDelegator:
    """Delegates repair tasks to appropriate subagents"""

    def __init__(self):
        self.registry = SubagentRegistry()
        self.task_queue: List[RepairTask] = []

    def analyze_repo(self, repo_path: Path) -> List[RepairTask]:
        """Analyze repository and identify repair tasks"""
        tasks = []

        # Check for missing files
        if not (repo_path / "README.md").exists():
            tasks.append(RepairTask(
                id="repair-readme",
                category=RepairCategory.DOCUMENTATION,
                complexity=RepairComplexity.SIMPLE,
                description="Add README.md file",
                target_path=str(repo_path),
                context={"file": "README.md"}
            ))

        if not (repo_path / "LICENSE").exists():
            tasks.append(RepairTask(
                id="repair-license",
                category=RepairCategory.COMPLIANCE,
                complexity=RepairComplexity.SIMPLE,
                description="Add LICENSE file",
                target_path=str(repo_path),
                context={"file": "LICENSE"}
            ))

        # Check for CI/CD
        ci_path = repo_path / ".github" / "workflows" / "ci.yml"
        if not ci_path.exists():
            tasks.append(RepairTask(
                id="repair-ci",
                category=RepairCategory.INFRASTRUCTURE,
                complexity=RepairComplexity.MODERATE,
                description="Add CI/CD pipeline",
                target_path=str(repo_path),
                context={"file": ".github/workflows/ci.yml"},
                priority=7
            ))

        # Check for security vulnerabilities (mock - would use actual scanner)
        if (repo_path / "package.json").exists():
            tasks.append(RepairTask(
                id="repair-security-audit",
                category=RepairCategory.SECURITY,
                complexity=RepairComplexity.MODERATE,
                description="Run security audit and fix vulnerabilities",
                target_path=str(repo_path),
                context={"scan_type": "npm"},
                priority=9
            ))

        # Check for test coverage
        if not (repo_path / "tests").exists() and not (repo_path / "test").exists():
            tasks.append(RepairTask(
                id="repair-tests",
                category=RepairCategory.TESTING,
                complexity=RepairComplexity.COMPLEX,
                description="Add test suite",
                target_path=str(repo_path),
                context={"test_framework": "jest"},
                priority=6
            ))

        return tasks

    def delegate_task(self, task: RepairTask) -> Optional[Dict]:
        """Delegate a task to appropriate subagent"""
        subagent = self.registry.find_subagent(task)

        if not subagent:
            print(f"⚠️  No subagent available for task: {task.description}")
            return None

        print(f"📋 Delegating '{task.description}' to {subagent.name}")

        # Build delegation payload
        delegation = {
            "task": task.to_dict(),
            "subagent": {
                "id": subagent.id,
                "name": subagent.name,
                "endpoint": subagent.mcp_endpoint
            },
            "timestamp": Path(__file__).stat().st_mtime
        }

        # If subagent has MCP endpoint, send to it
        if subagent.mcp_endpoint:
            print(f"  → MCP Endpoint: {subagent.mcp_endpoint}")
            # In real implementation, would POST to MCP endpoint
        else:
            print(f"  → Local execution")

        return delegation

    def execute_repairs(self, repo_path: Path, auto_approve: bool = False):
        """Execute all identified repairs"""
        print(f"\n🔧 Analyzing repository: {repo_path}")
        print("=" * 60)

        tasks = self.analyze_repo(repo_path)

        if not tasks:
            print("✅ No repairs needed!")
            return

        print(f"\n📋 Found {len(tasks)} repair tasks:")
        for i, task in enumerate(tasks, 1):
            print(f"  {i}. [{task.category.value}] {task.description} (Complexity: {task.complexity.name})")

        if not auto_approve:
            response = input(f"\nProceed with repairs? (y/n): ")
            if response.lower() != 'y':
                print("Repairs cancelled.")
                return

        print(f"\n🚀 Executing repairs...")
        print("=" * 60)

        delegations = []
        for task in sorted(tasks, key=lambda t: t.priority, reverse=True):
            delegation = self.delegate_task(task)
            if delegation:
                delegations.append(delegation)

        # Save delegation log
        log_path = repo_path / ".repair-delegations.json"
        with open(log_path, 'w') as f:
            json.dump(delegations, f, indent=2)

        print(f"\n✅ Repairs delegated! Log saved to: {log_path}")
        print(f"\n📊 Summary:")
        print(f"  Total tasks: {len(tasks)}")
        print(f"  Delegated: {len(delegations)}")
        print(f"  Failed: {len(tasks) - len(delegations)}")


def main():
    if len(sys.argv) < 2:
        print("Usage: python subagent-delegator.py <repo-path> [--auto-approve]")
        sys.exit(1)

    repo_path = Path(sys.argv[1])
    auto_approve = "--auto-approve" in sys.argv

    if not repo_path.exists():
        print(f"Error: Repository path does not exist: {repo_path}")
        sys.exit(1)

    delegator = RepairDelegator()
    delegator.execute_repairs(repo_path, auto_approve)


if __name__ == "__main__":
    main()
