#!/usr/bin/env python3
"""
CTB Metadata
ctb_id: CTB-EA71E95C43C5
ctb_branch: sys
ctb_path: sys/global-factory/scripts/ctb_remediator.py
ctb_version: 1.0.0
created: 2025-10-23T16:37:00.766480
checksum: 79240cc0
"""

"""
CTB Remediator
Automatically fixes CTB compliance issues
Version: 1.0.0
"""

import os
import sys
import json
import re
import hashlib
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional

# Fix Windows console encoding for emojis
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')


class CTBRemediator:
    """Automatically fixes CTB compliance issues"""

    def __init__(self, root_path: Path, dry_run: bool = False):
        self.root_path = root_path
        self.dry_run = dry_run
        self.stats = {
            'files_processed': 0,
            'issues_fixed': 0,
            'metadata_added': 0,
            'metadata_updated': 0,
            'ids_regenerated': 0,
            'branches_corrected': 0,
            'paths_corrected': 0,
            'errors': 0
        }
        self.fixes = []

    def generate_file_id(self, file_path: Path) -> str:
        """Generate unique file ID based on path"""
        relative_path = file_path.relative_to(self.root_path)
        hash_input = str(relative_path).encode('utf-8')
        return f"CTB-{hashlib.sha256(hash_input).hexdigest()[:12].upper()}"

    def detect_branch(self, file_path: Path) -> str:
        """Detect CTB branch from path"""
        try:
            parts = file_path.relative_to(self.root_path).parts
            if len(parts) > 0 and parts[0] in ['sys', 'ai', 'data', 'docs', 'ui', 'meta']:
                return parts[0]
        except:
            pass
        return 'unknown'

    def extract_metadata(self, file_path: Path) -> Optional[Dict]:
        """Extract existing CTB metadata from file"""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read(1000)

            if 'CTB Metadata' not in content and 'ctb_id:' not in content:
                return None

            metadata = {}
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

        except:
            return None

    def update_metadata(self, file_path: Path, old_metadata: Optional[Dict]) -> bool:
        """Update or create metadata for file"""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            # Generate correct metadata
            file_id = self.generate_file_id(file_path)
            branch = self.detect_branch(file_path)
            relative_path = str(file_path.relative_to(self.root_path)).replace('\\', '/')

            new_metadata = {
                'ctb_id': file_id,
                'ctb_branch': branch,
                'ctb_path': relative_path,
                'ctb_version': '1.0.0',
                'created': datetime.now().isoformat(),
                'checksum': hashlib.md5(content.encode()).hexdigest()[:8]
            }

            # Determine comment style
            comment_start, comment_end = self.get_comment_style(file_path)

            if not comment_start:
                return False

            # Create new metadata block
            metadata_block = self.create_metadata_block(new_metadata, comment_start, comment_end)

            # Remove old metadata if exists
            if old_metadata:
                # Find and remove old metadata block
                metadata_pattern = r'(""".*?CTB Metadata.*?""")|(/\*.*?CTB Metadata.*?\*/)|(\<!--.*?CTB Metadata.*?-->)|(#.*?CTB Metadata.*?\n(?:#.*\n)*)'
                content = re.sub(metadata_pattern, '', content, flags=re.DOTALL)
                content = content.lstrip()

            # Handle shebang
            if content.startswith('#!'):
                lines = content.split('\n', 1)
                if len(lines) > 1:
                    new_content = lines[0] + '\n' + metadata_block + lines[1]
                else:
                    new_content = lines[0] + '\n' + metadata_block
            else:
                new_content = metadata_block + content

            if not self.dry_run:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)

            # Track what was fixed
            if old_metadata:
                self.stats['metadata_updated'] += 1
                fixes = []
                if old_metadata.get('ctb_id') != new_metadata['ctb_id']:
                    fixes.append('ID regenerated')
                    self.stats['ids_regenerated'] += 1
                if old_metadata.get('ctb_branch') != new_metadata['ctb_branch']:
                    fixes.append('Branch corrected')
                    self.stats['branches_corrected'] += 1
                if old_metadata.get('ctb_path') != new_metadata['ctb_path']:
                    fixes.append('Path corrected')
                    self.stats['paths_corrected'] += 1

                if fixes:
                    self.fixes.append({
                        'file': relative_path,
                        'action': 'updated',
                        'fixes': fixes
                    })
            else:
                self.stats['metadata_added'] += 1
                self.fixes.append({
                    'file': relative_path,
                    'action': 'added',
                    'metadata': new_metadata
                })

            self.stats['issues_fixed'] += 1
            return True

        except Exception as e:
            print(f"  ❌ Error processing {file_path}: {e}")
            self.stats['errors'] += 1
            return False

    def get_comment_style(self, file_path: Path):
        """Get comment style for file type"""
        ext = file_path.suffix.lower()

        if ext in ['.py']:
            return ('"""', '"""')
        elif ext in ['.js', '.ts', '.tsx', '.jsx', '.css', '.scss']:
            return ('/*', '*/')
        elif ext in ['.html', '.xml', '.svg']:
            return ('<!--', '-->')
        elif ext in ['.sh', '.bash', '.yaml', '.yml']:
            return ('#', '#')

        return None, None

    def create_metadata_block(self, metadata: Dict, comment_start: str, comment_end: str) -> str:
        """Create formatted metadata block"""
        if comment_start == '"""':
            block = f'{comment_start}\n'
            block += 'CTB Metadata\n'
            for key, value in metadata.items():
                block += f'{key}: {value}\n'
            block += f'{comment_end}\n\n'
        elif comment_start == '/*':
            block = f'{comment_start}\n'
            block += ' * CTB Metadata\n'
            for key, value in metadata.items():
                block += f' * {key}: {value}\n'
            block += f' {comment_end}\n\n'
        elif comment_start == '<!--':
            block = f'{comment_start}\n'
            block += 'CTB Metadata\n'
            for key, value in metadata.items():
                block += f'{key}: {value}\n'
            block += f'{comment_end}\n\n'
        elif comment_start == '#':
            block = '# CTB Metadata\n'
            for key, value in metadata.items():
                block += f'# {key}: {value}\n'
            block += '\n'

        return block

    def should_process(self, file_path: Path) -> bool:
        """Check if file should be processed"""
        skip_patterns = [
            '__pycache__',
            'node_modules',
            '.git',
            '.pyc',
            '.jpg', '.png', '.gif', '.ico',
            '.pdf', '.zip', '.tar', '.gz',
            'package-lock.json',
            '.min.js',
            '.min.css'
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

    def remediate_directory(self, directory: Path):
        """Recursively remediate directory"""
        print(f"🔧 Remediating: {directory.relative_to(self.root_path)}")

        for item in directory.iterdir():
            if item.is_dir():
                self.remediate_directory(item)
            elif item.is_file():
                if self.should_process(item):
                    self.stats['files_processed'] += 1

                    # Extract existing metadata
                    old_metadata = self.extract_metadata(item)

                    # Check if needs remediation
                    needs_fix = False

                    if not old_metadata:
                        needs_fix = True
                    else:
                        # Check for issues
                        file_id = self.generate_file_id(item)
                        branch = self.detect_branch(item)
                        relative_path = str(item.relative_to(self.root_path)).replace('\\', '/')

                        if old_metadata.get('ctb_id') != file_id:
                            needs_fix = True
                        if old_metadata.get('ctb_branch') != branch:
                            needs_fix = True
                        if old_metadata.get('ctb_path') != relative_path:
                            needs_fix = True

                    if needs_fix:
                        if self.update_metadata(item, old_metadata):
                            action = 'Updated' if old_metadata else 'Added'
                            print(f"  ✓ {action}: {item.name}")

    def generate_enforcement_rules(self):
        """Generate enforcement rules for CI/CD"""
        rules = {
            'version': '1.0.0',
            'generated': datetime.now().isoformat(),
            'enforcement': {
                'required_metadata': [
                    'ctb_id',
                    'ctb_branch',
                    'ctb_path',
                    'ctb_version'
                ],
                'id_format': r'^CTB-[A-F0-9]{12}$',
                'valid_branches': ['sys', 'ai', 'data', 'docs', 'ui', 'meta'],
                'min_compliance_score': 90
            },
            'auto_remediation': {
                'enabled': True,
                'on_commit': True,
                'on_pr': True,
                'block_on_fail': False
            }
        }

        enforcement_file = self.root_path.parent / 'ctb' / 'meta' / 'enforcement_rules.json'
        enforcement_file.parent.mkdir(parents=True, exist_ok=True)

        with open(enforcement_file, 'w', encoding='utf-8') as f:
            json.dump(rules, f, indent=2)

        print(f"\n📋 Enforcement rules saved to: {enforcement_file}")

    def generate_report(self, output_path: Path):
        """Generate remediation summary report"""
        report = f"""# CTB Remediation Summary

**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
**Root Path:** {self.root_path}
**Mode:** {'DRY RUN' if self.dry_run else 'LIVE'}

## Summary

- **Files Processed:** {self.stats['files_processed']}
- **Issues Fixed:** {self.stats['issues_fixed']}
- **Metadata Added:** {self.stats['metadata_added']}
- **Metadata Updated:** {self.stats['metadata_updated']}
- **IDs Regenerated:** {self.stats['ids_regenerated']}
- **Branches Corrected:** {self.stats['branches_corrected']}
- **Paths Corrected:** {self.stats['paths_corrected']}
- **Errors:** {self.stats['errors']}

## Fixes Applied

"""

        if self.fixes:
            for fix in self.fixes[:50]:  # Show first 50
                report += f"### {fix['file']}\n\n"
                report += f"**Action:** {fix['action']}\n\n"

                if 'fixes' in fix:
                    report += "**Corrections:**\n"
                    for correction in fix['fixes']:
                        report += f"- {correction}\n"
                    report += "\n"

                if 'metadata' in fix:
                    report += "**Metadata Added:**\n"
                    report += f"- CTB ID: `{fix['metadata']['ctb_id']}`\n"
                    report += f"- Branch: `{fix['metadata']['ctb_branch']}`\n"
                    report += f"- Path: `{fix['metadata']['ctb_path']}`\n"
                    report += "\n"

            if len(self.fixes) > 50:
                report += f"\n*...and {len(self.fixes) - 50} more fixes*\n\n"
        else:
            report += "*No fixes needed - structure is compliant!*\n\n"

        report += f"""

## Next Steps

1. **Verify fixes** by reviewing changed files
2. **Run audit** to confirm compliance:
   ```bash
   python ctb/sys/global-factory/scripts/ctb_audit_generator.py ctb/
   ```
3. **Commit changes** if running in live mode
4. **Enable CI/CD enforcement** via GitHub Actions

## Enforcement

Enforcement rules have been generated in `ctb/meta/enforcement_rules.json`.

### Rules:
- Required metadata fields: ctb_id, ctb_branch, ctb_path, ctb_version
- CTB ID format: `CTB-[A-F0-9]{{12}}`
- Valid branches: sys, ai, data, docs, ui, meta
- Minimum compliance score: 90/100

### CI/CD Integration

The enforcement workflow has been created:
- `.github/workflows/ctb_enforcement.yml`
- Runs on: push, pull_request, weekly schedule
- Auto-remediation: {'enabled' if not self.dry_run else 'disabled (dry run)'}

---

**CTB Remediator v1.0.0**
**Status:** {'✅ Remediation Complete' if self.stats['errors'] == 0 else '⚠️ Remediation Complete with Errors'}
"""

        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(report)

        print(f"📄 Report saved to: {output_path}")


def main():
    import argparse

    parser = argparse.ArgumentParser(description='CTB Remediator')
    parser.add_argument('path', help='Path to CTB directory')
    parser.add_argument('--dry-run', action='store_true', help='Dry run mode')
    parser.add_argument('--report', default='CTB_REMEDIATION_SUMMARY.md', help='Report output path')

    args = parser.parse_args()

    root_path = Path(args.path).resolve()

    if not root_path.exists():
        print(f"❌ Error: Path does not exist: {root_path}")
        sys.exit(1)

    print("╔════════════════════════════════════════════════════════╗")
    print("║           CTB Remediator v1.0.0                        ║")
    print("╚════════════════════════════════════════════════════════╝")

    if args.dry_run:
        print("\n⚠️  DRY RUN MODE - No files will be modified\n")

    remediator = CTBRemediator(root_path, dry_run=args.dry_run)
    remediator.remediate_directory(root_path)

    if not args.dry_run:
        remediator.generate_enforcement_rules()

    print("\n" + "━" * 60)
    print(f"✅ Remediation Complete!")
    print(f"   Files Processed: {remediator.stats['files_processed']}")
    print(f"   Issues Fixed: {remediator.stats['issues_fixed']}")
    print(f"   Metadata Added: {remediator.stats['metadata_added']}")
    print(f"   Metadata Updated: {remediator.stats['metadata_updated']}")
    print(f"   Errors: {remediator.stats['errors']}")
    print("━" * 60)

    # Generate report
    report_path = Path(args.report)
    remediator.generate_report(report_path)

    sys.exit(0 if remediator.stats['errors'] == 0 else 1)


if __name__ == '__main__':
    main()
