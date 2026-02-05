#!/usr/bin/env python3
"""
CTB Metadata
ctb_id: CTB-812C324EF873
ctb_branch: sys
ctb_path: sys/global-factory/scripts/ctb_audit_generator.py
ctb_version: 1.0.0
created: 2025-10-23T16:37:00.746589
checksum: f5990ead
"""

"""
CTB Audit Generator
Generates comprehensive compliance audit reports for CTB structure
Version: 1.0.0
"""

import os
import sys
import json
import re
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional
from collections import defaultdict

# Fix Windows console encoding for emojis
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')


class CTBAuditor:
    """Audits CTB structure for compliance"""

    def __init__(self, root_path: Path):
        self.root_path = root_path
        self.issues = []
        self.stats = {
            'total_files': 0,
            'tagged_files': 0,
            'untagged_files': 0,
            'orphaned_files': 0,
            'duplicate_ids': 0,
            'invalid_metadata': 0,
            'by_branch': defaultdict(lambda: {
                'files': 0,
                'tagged': 0,
                'issues': 0
            })
        }
        self.file_registry = {}
        self.id_registry = defaultdict(list)

    def extract_metadata(self, file_path: Path) -> Optional[Dict]:
        """Extract CTB metadata from file"""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read(1000)  # Read first 1000 chars

            if 'CTB Metadata' not in content and 'ctb_id:' not in content:
                return None

            metadata = {}

            # Extract metadata fields
            patterns = {
                'ctb_id': r'ctb_id:\s*([^\n]+)',
                'ctb_branch': r'ctb_branch:\s*([^\n]+)',
                'ctb_path': r'ctb_path:\s*([^\n]+)',
                'ctb_version': r'ctb_version:\s*([^\n]+)',
                'created': r'created:\s*([^\n]+)',
                'checksum': r'checksum:\s*([^\n]+)'
            }

            for key, pattern in patterns.items():
                match = re.search(pattern, content)
                if match:
                    metadata[key] = match.group(1).strip()

            return metadata if metadata else None

        except Exception as e:
            return None

    def detect_branch(self, file_path: Path) -> str:
        """Detect CTB branch from path"""
        try:
            parts = file_path.relative_to(self.root_path).parts
            if len(parts) > 0 and parts[0] in ['sys', 'ai', 'data', 'docs', 'ui', 'meta']:
                return parts[0]
        except:
            pass
        return 'unknown'

    def validate_metadata(self, file_path: Path, metadata: Dict) -> List[str]:
        """Validate metadata fields"""
        issues = []

        # Check required fields
        required = ['ctb_id', 'ctb_branch', 'ctb_path', 'ctb_version']
        for field in required:
            if field not in metadata:
                issues.append(f"Missing required field: {field}")

        # Validate CTB ID format
        if 'ctb_id' in metadata:
            if not re.match(r'^CTB-[A-F0-9]{12}$', metadata['ctb_id']):
                issues.append(f"Invalid CTB ID format: {metadata['ctb_id']}")
            else:
                # Check for duplicate IDs
                self.id_registry[metadata['ctb_id']].append(str(file_path))

        # Validate branch
        if 'ctb_branch' in metadata:
            actual_branch = self.detect_branch(file_path)
            if metadata['ctb_branch'] != actual_branch:
                issues.append(f"Branch mismatch: metadata says '{metadata['ctb_branch']}', actual is '{actual_branch}'")

        # Validate path
        if 'ctb_path' in metadata:
            relative_path = str(file_path.relative_to(self.root_path)).replace('\\', '/')
            if metadata['ctb_path'] != relative_path:
                issues.append(f"Path mismatch: metadata says '{metadata['ctb_path']}', actual is '{relative_path}'")

        return issues

    def audit_file(self, file_path: Path):
        """Audit a single file"""
        self.stats['total_files'] += 1

        branch = self.detect_branch(file_path)
        self.stats['by_branch'][branch]['files'] += 1

        # Extract metadata
        metadata = self.extract_metadata(file_path)

        if not metadata:
            self.stats['untagged_files'] += 1
            self.issues.append({
                'severity': 'warning',
                'type': 'missing_metadata',
                'file': str(file_path.relative_to(self.root_path)).replace('\\', '/'),
                'branch': branch,
                'message': 'File missing CTB metadata'
            })
            return

        self.stats['tagged_files'] += 1
        self.stats['by_branch'][branch]['tagged'] += 1

        # Validate metadata
        validation_issues = self.validate_metadata(file_path, metadata)

        if validation_issues:
            self.stats['invalid_metadata'] += 1
            self.stats['by_branch'][branch]['issues'] += 1

            for issue_msg in validation_issues:
                self.issues.append({
                    'severity': 'error',
                    'type': 'invalid_metadata',
                    'file': str(file_path.relative_to(self.root_path)).replace('\\', '/'),
                    'branch': branch,
                    'message': issue_msg,
                    'metadata': metadata
                })

        # Store in registry
        self.file_registry[str(file_path.relative_to(self.root_path)).replace('\\', '/')] = {
            'branch': branch,
            'metadata': metadata,
            'size': file_path.stat().st_size,
            'modified': datetime.fromtimestamp(file_path.stat().st_mtime).isoformat()
        }

    def should_audit(self, file_path: Path) -> bool:
        """Check if file should be audited"""
        skip_patterns = [
            '__pycache__',
            'node_modules',
            '.git',
            '.pyc',
            '.jpg', '.png', '.gif', '.ico',
            '.pdf', '.zip', '.tar', '.gz',
            'package-lock.json'
        ]

        path_str = str(file_path)
        for pattern in skip_patterns:
            if pattern in path_str:
                return False

        text_extensions = [
            '.py', '.js', '.ts', '.tsx', '.jsx',
            '.sh', '.bash',
            '.yaml', '.yml', '.json',
            '.md', '.txt',
            '.css', '.scss', '.sass',
            '.html', '.xml', '.svg'
        ]

        return file_path.suffix.lower() in text_extensions

    def scan_directory(self, directory: Path):
        """Recursively scan and audit directory"""
        print(f"🔍 Auditing: {directory.relative_to(self.root_path)}")

        for item in directory.iterdir():
            if item.is_dir():
                self.scan_directory(item)
            elif item.is_file() and self.should_audit(item):
                self.audit_file(item)

    def check_duplicates(self):
        """Check for duplicate CTB IDs"""
        for ctb_id, files in self.id_registry.items():
            if len(files) > 1:
                self.stats['duplicate_ids'] += 1
                self.issues.append({
                    'severity': 'critical',
                    'type': 'duplicate_id',
                    'message': f"Duplicate CTB ID: {ctb_id}",
                    'files': files
                })

    def calculate_compliance_score(self) -> int:
        """Calculate overall compliance score"""
        if self.stats['total_files'] == 0:
            return 0

        # Scoring factors
        tagged_ratio = self.stats['tagged_files'] / self.stats['total_files']
        error_penalty = min(len([i for i in self.issues if i['severity'] == 'error']), 20) * 2
        critical_penalty = len([i for i in self.issues if i['severity'] == 'critical']) * 10

        score = int((tagged_ratio * 100) - error_penalty - critical_penalty)
        return max(0, min(100, score))

    def generate_report(self, output_path: Path):
        """Generate comprehensive audit report"""
        compliance_score = self.calculate_compliance_score()

        report = f"""# CTB Audit Report

**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
**Root Path:** {self.root_path}
**Compliance Score:** {compliance_score}/100

## Executive Summary

{'✅ **PASS** - CTB structure is compliant' if compliance_score >= 90 else '❌ **FAIL** - CTB structure requires remediation'}

### Statistics

- **Total Files Audited:** {self.stats['total_files']}
- **Tagged Files:** {self.stats['tagged_files']} ({self.stats['tagged_files']/max(self.stats['total_files'],1)*100:.1f}%)
- **Untagged Files:** {self.stats['untagged_files']}
- **Invalid Metadata:** {self.stats['invalid_metadata']}
- **Duplicate IDs:** {self.stats['duplicate_ids']}
- **Total Issues:** {len(self.issues)}

### By Branch

| Branch | Files | Tagged | Issues |
|--------|-------|--------|--------|
"""

        for branch in sorted(self.stats['by_branch'].keys()):
            stats = self.stats['by_branch'][branch]
            report += f"| {branch.upper()} | {stats['files']} | {stats['tagged']} | {stats['issues']} |\n"

        # Issues breakdown
        report += f"""

## Issues Breakdown

### Critical Issues ({len([i for i in self.issues if i['severity'] == 'critical'])})

"""
        critical = [i for i in self.issues if i['severity'] == 'critical']
        if critical:
            for issue in critical:
                report += f"- **{issue['type']}**: {issue['message']}\n"
                if 'files' in issue:
                    for f in issue['files']:
                        report += f"  - `{f}`\n"
        else:
            report += "*No critical issues found.*\n"

        report += f"""

### Errors ({len([i for i in self.issues if i['severity'] == 'error'])})

"""
        errors = [i for i in self.issues if i['severity'] == 'error']
        if errors:
            for issue in errors[:20]:  # Limit to first 20
                report += f"- **{issue['file']}**: {issue['message']}\n"
            if len(errors) > 20:
                report += f"\n*...and {len(errors) - 20} more errors*\n"
        else:
            report += "*No errors found.*\n"

        report += f"""

### Warnings ({len([i for i in self.issues if i['severity'] == 'warning'])})

"""
        warnings = [i for i in self.issues if i['severity'] == 'warning']
        if warnings:
            for issue in warnings[:10]:  # Limit to first 10
                report += f"- **{issue['file']}**: {issue['message']}\n"
            if len(warnings) > 10:
                report += f"\n*...and {len(warnings) - 10} more warnings*\n"
        else:
            report += "*No warnings found.*\n"

        report += f"""

## Recommendations

"""
        if compliance_score < 90:
            report += f"""
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
"""
        else:
            report += """
✅ CTB structure is compliant. Maintain compliance by:

1. Running weekly audits via CI/CD
2. Tagging new files upon creation
3. Monitoring compliance dashboard
"""

        report += f"""

## File Registry

Total registered files: {len(self.file_registry)}

<details>
<summary>Click to view file registry</summary>

| Path | Branch | CTB ID | Size |
|------|--------|--------|------|
"""

        for path, info in sorted(self.file_registry.items())[:100]:
            ctb_id = info['metadata'].get('ctb_id', 'N/A') if info['metadata'] else 'N/A'
            report += f"| `{path}` | {info['branch']} | {ctb_id} | {info['size']} |\n"

        if len(self.file_registry) > 100:
            report += f"\n*...and {len(self.file_registry) - 100} more files*\n"

        report += """
</details>

---

**CTB Audit Generator v1.0.0**
**Next Steps:** Review issues and run remediator to fix problems.
"""

        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(report)

        print(f"\n📄 Report saved to: {output_path}")

        # Also save JSON registry
        registry_path = self.root_path.parent / 'ctb' / 'meta' / 'ctb_registry.json'
        registry_path.parent.mkdir(parents=True, exist_ok=True)

        registry_data = {
            'generated': datetime.now().isoformat(),
            'compliance_score': compliance_score,
            'stats': dict(self.stats),
            'files': self.file_registry,
            'issues_count': len(self.issues)
        }

        with open(registry_path, 'w', encoding='utf-8') as f:
            json.dump(registry_data, f, indent=2, default=str)

        print(f"📋 Registry saved to: {registry_path}")


def main():
    import argparse

    parser = argparse.ArgumentParser(description='CTB Audit Generator')
    parser.add_argument('path', help='Path to CTB directory')
    parser.add_argument('--report', default='CTB_AUDIT_REPORT.md', help='Report output path')

    args = parser.parse_args()

    root_path = Path(args.path).resolve()

    if not root_path.exists():
        print(f"❌ Error: Path does not exist: {root_path}")
        sys.exit(1)

    print("╔════════════════════════════════════════════════════════╗")
    print("║         CTB Audit Generator v1.0.0                     ║")
    print("╚════════════════════════════════════════════════════════╝\n")

    auditor = CTBAuditor(root_path)
    auditor.scan_directory(root_path)
    auditor.check_duplicates()

    compliance_score = auditor.calculate_compliance_score()

    print("\n" + "━" * 60)
    print(f"{'✅ AUDIT COMPLETE' if compliance_score >= 90 else '⚠️  AUDIT COMPLETE - ISSUES FOUND'}")
    print(f"   Compliance Score: {compliance_score}/100")
    print(f"   Total Files: {auditor.stats['total_files']}")
    print(f"   Tagged: {auditor.stats['tagged_files']}")
    print(f"   Untagged: {auditor.stats['untagged_files']}")
    print(f"   Issues: {len(auditor.issues)}")
    print("━" * 60)

    # Generate report
    report_path = Path(args.report)
    auditor.generate_report(report_path)

    sys.exit(0 if compliance_score >= 90 else 1)


if __name__ == '__main__':
    main()
