#!/usr/bin/env python3
"""
Blueprint Documentation Auto-Generator
Generates comprehensive documentation from blueprint manifests
"""

import yaml
import json
import os
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional


class BlueprintDocGenerator:
    """Generates documentation from blueprint manifests"""

    def __init__(self, blueprint_path: Path):
        self.blueprint_path = blueprint_path
        self.manifest = self._load_manifest()

    def _load_manifest(self) -> Dict:
        """Load blueprint manifest"""
        manifest_file = self.blueprint_path / "manifest.yaml"

        if not manifest_file.exists():
            raise FileNotFoundError(f"Manifest not found: {manifest_file}")

        with open(manifest_file) as f:
            return yaml.safe_load(f)

    def generate_overview_doc(self) -> str:
        """Generate overview documentation"""
        process = self.manifest.get("process", "Blueprint")
        version = self.manifest.get("version", "1.0.0")
        mission = self.manifest.get("mission", {})
        buckets = self.manifest.get("buckets", {})

        doc = f"""# {process.title()} - Overview

**Version:** {version}
**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Mission

**North Star:** {mission.get('north_star', 'No mission defined.')}

"""

        if mission.get("success_metrics"):
            doc += "**Success Metrics:**\n"
            for metric in mission["success_metrics"]:
                doc += f"- {metric}\n"
            doc += "\n"

        if mission.get("constraints"):
            doc += "**Constraints:**\n"
            for constraint in mission["constraints"]:
                doc += f"- {constraint}\n"
            doc += "\n"

        doc += f"""
## Architecture

This blueprint follows the IMO (Input-Middle-Output) pattern with {len(buckets)} primary buckets:

"""

        for bucket_name, bucket_data in buckets.items():
            stages = bucket_data.get("stages", [])
            doc += f"### {bucket_name.title()} Bucket\n\n"
            doc += f"**Stages:** {len(stages)}\n\n"

            for stage in stages:
                stage_title = stage.get('title', stage.get('key', 'Unnamed'))
                stage_kind = stage.get('kind', 'unknown')
                doc += f"- **{stage_title}** ({stage_kind})\n"

            doc += "\n"

        return doc

    def generate_stage_docs(self) -> Dict[str, str]:
        """Generate detailed documentation for each stage"""
        docs = {}
        buckets = self.manifest.get("buckets", {})

        for bucket_name, bucket_data in buckets.items():
            doc = f"""# {bucket_name.title()} Bucket - Detailed Documentation

## Stages

"""
            stages = bucket_data.get("stages", [])

            for i, stage in enumerate(stages, 1):
                stage_key = stage.get('key', f'stage-{i}')
                stage_title = stage.get('title', 'Unnamed Stage')
                stage_kind = stage.get('kind', 'unknown')

                doc += f"""### {i}. {stage_title}

**Key:** `{stage_key}`
**Kind:** {stage_kind}

"""

                # Add fields if present
                if "fields" in stage:
                    doc += f"**Fields:**\n"
                    for field_name, field_value in stage["fields"].items():
                        doc += f"- **{field_name}:** {field_value}\n"
                    doc += "\n"

                # Add required fields if present
                if "required_fields" in stage:
                    doc += f"**Required Fields:**\n"
                    for field in stage["required_fields"]:
                        doc += f"- {field}\n"
                    doc += "\n"

                # Add patterns if present (for sources/targets)
                if "patterns" in stage:
                    doc += f"**Patterns:**\n"
                    for pattern in stage["patterns"]:
                        doc += f"- {pattern}\n"
                    doc += "\n"

                doc += "---\n\n"

            docs[bucket_name] = doc

        return docs

    def generate_api_doc(self) -> str:
        """Generate API documentation if endpoints are defined"""
        apis = self.manifest.get("apis", [])

        if not apis:
            return ""

        doc = """# API Documentation

## Endpoints

"""

        for api in apis:
            doc += f"""### {api.get('method', 'GET')} {api.get('path', '/')}

**Description:** {api.get('description', 'No description.')}

"""

            if "parameters" in api:
                doc += "**Parameters:**\n\n"
                doc += "| Name | Type | Required | Description |\n"
                doc += "|------|------|----------|-------------|\n"

                for param in api["parameters"]:
                    required = "Yes" if param.get("required", False) else "No"
                    doc += f"| {param['name']} | {param['type']} | {required} | {param.get('description', '')} |\n"

                doc += "\n"

            if "response" in api:
                doc += f"**Response:**\n\n```json\n{json.dumps(api['response'], indent=2)}\n```\n\n"

            doc += "---\n\n"

        return doc

    def generate_progress_doc(self) -> str:
        """Generate progress tracking documentation"""
        buckets = self.manifest.get("buckets", {})
        progress_file = self.blueprint_path / "progress.json"

        if not progress_file.exists():
            return ""

        with open(progress_file) as f:
            progress = json.load(f)

        doc = f"""# Progress Report

**Last Updated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Overall Progress

"""

        # Handle different progress.json formats
        if isinstance(progress, dict):
            for bucket_name, stats in progress.items():
                if isinstance(stats, str):
                    # Simple format: just a percentage string
                    doc += f"### {bucket_name.title()}\n\n"
                    doc += f"Progress: {stats}\n\n"
                elif isinstance(stats, dict):
                    # Detailed format with counts
                    total = stats.get("total", 0)
                    done = stats.get("done", 0)
                    wip = stats.get("wip", 0)
                    todo = stats.get("todo", 0)

                    percentage = (done / total * 100) if total > 0 else 0

                    doc += f"""### {bucket_name.title()}

- **Overall:** {percentage:.1f}% complete
- **Done:** {done}/{total}
- **In Progress:** {wip}/{total}
- **To Do:** {todo}/{total}

"""

                    # Progress bar
                    filled = int(percentage / 5)
                    bar = "[" + ("=" * filled) + (" " * (20 - filled)) + "]"
                    doc += f"{bar} {percentage:.1f}%\n\n"

        return doc

    def generate_development_guide(self) -> str:
        """Generate development guide"""
        meta = self.manifest.get("meta", {})

        doc = f"""# Development Guide

## Getting Started

### Prerequisites

- Node.js >= 18
- Python >= 3.11
- Git

### Installation

```bash
# Clone the repository
git clone {meta.get('repo_url', 'https://github.com/your-org/your-repo')}

# Install dependencies
npm install
pip install -r requirements.txt

# Set up environment
cp .env.example .env
# Edit .env with your configuration
```

### Running Locally

```bash
# Start development server
npm run dev

# Run tests
npm test

# Run compliance checks
npm run compliance:check
```

## Project Structure

```
.
├── src/           # Source code
├── docs/          # Documentation
├── tests/         # Test files
├── .heir-config.yaml  # HEIR configuration
└── manifest.yaml  # Blueprint manifest
```

## Development Workflow

1. **Check out a feature branch**
   ```bash
   git checkout -b feature/your-feature
   ```

2. **Make your changes**
   - Follow the coding standards
   - Add tests for new functionality
   - Update documentation

3. **Run checks**
   ```bash
   npm run lint
   npm test
   npm run compliance:check
   ```

4. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: your feature description"
   git push origin feature/your-feature
   ```

5. **Create pull request**
   - Describe your changes
   - Link related issues
   - Request review

## Compliance

This project uses HEIR (Hierarchical Error-handling, ID management, and Reporting) for compliance.

### Running Compliance Checks

```bash
python imo-compliance-check.py
```

### HEIR Validation

```bash
python -m packages.heir.checks
```

## Support

For issues and questions, please:
- Check existing documentation
- Search GitHub issues
- Create a new issue if needed
"""

        return doc

    def _get_status_emoji(self, status: str) -> str:
        """Get emoji for status"""
        emoji_map = {
            "done": "✅",
            "wip": "🔄",
            "todo": "📋",
            "blocked": "🚫"
        }
        return emoji_map.get(status.lower(), "❓")

    def generate_all(self, output_dir: Optional[Path] = None):
        """Generate all documentation"""
        if output_dir is None:
            output_dir = self.blueprint_path / "docs" / "generated"

        output_dir.mkdir(parents=True, exist_ok=True)

        print(f"[*] Generating blueprint documentation...")

        # Overview
        overview_doc = self.generate_overview_doc()
        overview_path = output_dir / "00-overview.md"
        with open(overview_path, 'w', encoding='utf-8') as f:
            f.write(overview_doc)
        print(f"  [OK] Generated: {overview_path}")

        # Stage docs
        stage_docs = self.generate_stage_docs()
        for bucket_name, doc in stage_docs.items():
            doc_path = output_dir / f"{bucket_name}-stage.md"
            with open(doc_path, 'w', encoding='utf-8') as f:
                f.write(doc)
            print(f"  [OK] Generated: {doc_path}")

        # API docs
        api_doc = self.generate_api_doc()
        if api_doc:
            api_path = output_dir / "api.md"
            with open(api_path, 'w', encoding='utf-8') as f:
                f.write(api_doc)
            print(f"  [OK] Generated: {api_path}")

        # Progress
        progress_doc = self.generate_progress_doc()
        if progress_doc:
            progress_path = output_dir / "progress.md"
            with open(progress_path, 'w', encoding='utf-8') as f:
                f.write(progress_doc)
            print(f"  [OK] Generated: {progress_path}")

        # Development guide
        dev_guide = self.generate_development_guide()
        dev_path = output_dir / "development-guide.md"
        with open(dev_path, 'w', encoding='utf-8') as f:
            f.write(dev_guide)
        print(f"  [OK] Generated: {dev_path}")

        # Create index
        self._generate_index(output_dir)

        print(f"\n[OK] Documentation generated in: {output_dir}")

    def _generate_index(self, output_dir: Path):
        """Generate index/README for generated docs"""
        meta = self.manifest.get("meta", {})

        index = f"""# {meta.get('app_name', 'Blueprint')} Documentation

**Auto-generated from blueprint manifest**
**Last updated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Documentation

- [Overview](00-overview.md) - Project overview and architecture
"""

        buckets = self.manifest.get("buckets", {})
        for bucket_name in buckets.keys():
            index += f"- [{bucket_name.title()} Stage]({bucket_name}-stage.md) - Detailed {bucket_name} documentation\n"

        if self.manifest.get("apis"):
            index += f"- [API Documentation](api.md) - API endpoints and usage\n"

        index += f"- [Progress Report](progress.md) - Current progress tracking\n"
        index += f"- [Development Guide](development-guide.md) - Setup and workflow\n"

        index += """
## Regenerating Documentation

To regenerate this documentation after updating the blueprint manifest:

```bash
python tools/blueprint_doc_generator.py docs/blueprints/<blueprint-name>
```
"""

        index_path = output_dir / "README.md"
        with open(index_path, 'w', encoding='utf-8') as f:
            f.write(index)
        print(f"  [OK] Generated: {index_path}")


def main():
    import sys

    if len(sys.argv) < 2:
        print("Usage: python blueprint_doc_generator.py <blueprint-path>")
        sys.exit(1)

    blueprint_path = Path(sys.argv[1])

    if not blueprint_path.exists():
        print(f"Error: Blueprint path does not exist: {blueprint_path}")
        sys.exit(1)

    generator = BlueprintDocGenerator(blueprint_path)
    generator.generate_all()


if __name__ == "__main__":
    main()
