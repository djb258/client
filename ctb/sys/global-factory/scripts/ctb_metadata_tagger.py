#!/usr/bin/env python3
"""
CTB Metadata
ctb_id: CTB-5459B523369F
ctb_branch: sys
ctb_path: sys/global-factory/scripts/ctb_metadata_tagger.py
ctb_version: 1.0.0
created: 2025-10-23T16:37:59.892444
checksum: f4dfc69c
"""

"""
CTB Metadata Tagger
Injects standardized metadata blocks into CTB-compliant files
Version: 1.0.0
"""

import os
import sys
import json
import hashlib
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Tuple

# Fix Windows console encoding for emojis
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')


class CTBMetadataTagger:
    """Injects CTB metadata blocks into files"""

    def __init__(self, root_path: Path, dry_run: bool = False):
        self.root_path = root_path
        self.dry_run = dry_run
        self.stats = {
            'files_scanned': 0,
            'files_tagged': 0,
            'files_skipped': 0,
            'errors': 0,
            'branches': {}
        }
        self.tagged_files = []

    def generate_file_id(self, file_path: Path) -> str:
        """Generate unique file ID based on path"""
        relative_path = file_path.relative_to(self.root_path)
        hash_input = str(relative_path).encode('utf-8')
        return f"CTB-{hashlib.sha256(hash_input).hexdigest()[:12].upper()}"

    def detect_branch(self, file_path: Path) -> str:
        """Detect which CTB branch the file belongs to"""
        parts = file_path.relative_to(self.root_path).parts

        if len(parts) > 0:
            branch = parts[0]
            if branch in ['sys', 'ai', 'data', 'docs', 'ui', 'meta']:
                return branch

        return 'unknown'

    def get_comment_style(self, file_path: Path) -> Tuple[str, str]:
        """Get comment style for file type"""
        ext = file_path.suffix.lower()

        # Block comment styles
        if ext in ['.py']:
            return ('"""', '"""')
        elif ext in ['.js', '.ts', '.tsx', '.jsx', '.css', '.scss']:
            return ('/*', '*/')
        elif ext in ['.html', '.xml', '.svg']:
            return ('<!--', '-->')
        elif ext in ['.sh', '.bash', '.yaml', '.yml']:
            return ('#', '#')

        return None, None

    def create_metadata_block(self, file_path: Path, file_id: str, branch: str) -> str:
        """Create metadata block for file"""
        relative_path = file_path.relative_to(self.root_path)

        metadata = {
            'ctb_id': file_id,
            'ctb_branch': branch,
            'ctb_path': str(relative_path).replace('\\', '/'),
            'ctb_version': '1.0.0',
            'created': datetime.now().isoformat(),
            'checksum': self._calculate_checksum(file_path)
        }

        comment_start, comment_end = self.get_comment_style(file_path)

        if not comment_start:
            return None

        # Format metadata block
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

    def _calculate_checksum(self, file_path: Path) -> str:
        """Calculate file checksum"""
        try:
            with open(file_path, 'rb') as f:
                return hashlib.md5(f.read()).hexdigest()[:8]
        except:
            return 'unknown'

    def has_metadata(self, file_path: Path) -> bool:
        """Check if file already has CTB metadata"""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                first_lines = f.read(500)
                return 'CTB Metadata' in first_lines or 'ctb_id:' in first_lines
        except:
            return False

    def inject_metadata(self, file_path: Path) -> bool:
        """Inject metadata block into file"""
        if self.has_metadata(file_path):
            return False

        file_id = self.generate_file_id(file_path)
        branch = self.detect_branch(file_path)

        metadata_block = self.create_metadata_block(file_path, file_id, branch)

        if not metadata_block:
            return False

        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                original_content = f.read()

            # Handle shebang lines
            if original_content.startswith('#!'):
                lines = original_content.split('\n', 1)
                if len(lines) > 1:
                    new_content = lines[0] + '\n' + metadata_block + lines[1]
                else:
                    new_content = lines[0] + '\n' + metadata_block
            else:
                new_content = metadata_block + original_content

            if not self.dry_run:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)

            self.tagged_files.append({
                'path': str(file_path.relative_to(self.root_path)).replace('\\', '/'),
                'id': file_id,
                'branch': branch,
                'size': file_path.stat().st_size
            })

            return True

        except Exception as e:
            print(f"  ⚠️  Error processing {file_path}: {e}")
            self.stats['errors'] += 1
            return False

    def should_process(self, file_path: Path) -> bool:
        """Check if file should be processed"""
        # Skip certain files
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

        # Only process text files
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
        """Recursively scan directory and tag files"""
        print(f"\n🔍 Scanning: {directory.relative_to(self.root_path)}")

        for item in directory.iterdir():
            if item.is_dir():
                self.scan_directory(item)
            elif item.is_file():
                self.stats['files_scanned'] += 1

                if self.should_process(item):
                    branch = self.detect_branch(item)

                    if branch not in self.stats['branches']:
                        self.stats['branches'][branch] = {'tagged': 0, 'skipped': 0}

                    if self.inject_metadata(item):
                        self.stats['files_tagged'] += 1
                        self.stats['branches'][branch]['tagged'] += 1
                        print(f"  ✓ Tagged: {item.name} ({branch})")
                    else:
                        self.stats['files_skipped'] += 1
                        self.stats['branches'][branch]['skipped'] += 1
                else:
                    self.stats['files_skipped'] += 1

    def generate_report(self, output_path: Path):
        """Generate tagging report"""
        report = f"""# CTB Tagging Report

**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
**Root Path:** {self.root_path}
**Mode:** {'DRY RUN' if self.dry_run else 'LIVE'}

## Summary

- **Files Scanned:** {self.stats['files_scanned']}
- **Files Tagged:** {self.stats['files_tagged']}
- **Files Skipped:** {self.stats['files_skipped']}
- **Errors:** {self.stats['errors']}

## By Branch

"""

        for branch, stats in sorted(self.stats['branches'].items()):
            report += f"### {branch.upper()}\n\n"
            report += f"- Tagged: {stats['tagged']}\n"
            report += f"- Skipped: {stats['skipped']}\n"
            report += f"\n"

        report += f"""## Tagged Files

| Path | CTB ID | Branch | Size |
|------|--------|--------|------|
"""

        for file_info in sorted(self.tagged_files, key=lambda x: x['path']):
            report += f"| `{file_info['path']}` | {file_info['id']} | {file_info['branch']} | {file_info['size']} bytes |\n"

        report += f"""

## Metadata Format

All tagged files include a standardized metadata block with:

- `ctb_id`: Unique identifier (CTB-XXXXXXXXXXXX)
- `ctb_branch`: Branch classification (sys/ai/data/docs/ui/meta)
- `ctb_path`: Relative path within CTB structure
- `ctb_version`: CTB version (1.0.0)
- `created`: Timestamp of tagging
- `checksum`: MD5 checksum (first 8 chars)

## Next Steps

1. Review tagged files
2. Run `ctb_audit_generator.py` to audit compliance
3. Run `ctb_remediator.py` to fix issues

---

**CTB Metadata Tagger v1.0.0**
"""

        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(report)

        print(f"\n📄 Report saved to: {output_path}")


def main():
    import argparse

    parser = argparse.ArgumentParser(description='CTB Metadata Tagger')
    parser.add_argument('path', help='Path to CTB directory')
    parser.add_argument('--dry-run', action='store_true', help='Dry run mode')
    parser.add_argument('--report', default='CTB_TAGGING_REPORT.md', help='Report output path')

    args = parser.parse_args()

    root_path = Path(args.path).resolve()

    if not root_path.exists():
        print(f"❌ Error: Path does not exist: {root_path}")
        sys.exit(1)

    print("╔════════════════════════════════════════════════════════╗")
    print("║          CTB Metadata Tagger v1.0.0                    ║")
    print("╚════════════════════════════════════════════════════════╝")

    if args.dry_run:
        print("\n⚠️  DRY RUN MODE - No files will be modified\n")

    tagger = CTBMetadataTagger(root_path, dry_run=args.dry_run)
    tagger.scan_directory(root_path)

    print("\n" + "━" * 60)
    print(f"✅ Tagging Complete!")
    print(f"   Files Scanned: {tagger.stats['files_scanned']}")
    print(f"   Files Tagged: {tagger.stats['files_tagged']}")
    print(f"   Files Skipped: {tagger.stats['files_skipped']}")
    print(f"   Errors: {tagger.stats['errors']}")
    print("━" * 60)

    # Generate report
    report_path = Path(args.report)
    tagger.generate_report(report_path)

    sys.exit(0 if tagger.stats['errors'] == 0 else 1)


if __name__ == '__main__':
    main()
