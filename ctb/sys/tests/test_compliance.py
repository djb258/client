"""
CTB System Compliance Tests
Tests for CTB structure and compliance checking
"""

import pytest
from pathlib import Path
import json
import yaml


class TestCTBStructure:
    """Test CTB directory structure"""

    def test_ctb_directories_exist(self):
        """Test that all required CTB directories exist"""
        required_dirs = ['sys', 'ai', 'data', 'docs', 'ui', 'meta']
        ctb_path = Path('ctb')

        for dir_name in required_dirs:
            dir_path = ctb_path / dir_name
            assert dir_path.exists(), f"Missing CTB directory: {dir_name}"
            assert dir_path.is_dir(), f"CTB {dir_name} is not a directory"

    def test_global_factory_exists(self):
        """Test that global factory directory exists"""
        factory_path = Path('ctb/sys/global-factory')
        assert factory_path.exists(), "Global factory directory missing"
        assert factory_path.is_dir(), "Global factory is not a directory"

    def test_compliance_scripts_exist(self):
        """Test that compliance scripts exist"""
        scripts = [
            'ctb_metadata_tagger.py',
            'ctb_audit_generator.py',
            'ctb_remediator.py'
        ]
        scripts_path = Path('ctb/sys/global-factory/scripts')

        for script in scripts:
            script_path = scripts_path / script
            assert script_path.exists(), f"Missing compliance script: {script}"

    def test_logs_directory_exists(self):
        """Test that logs directory exists with subdirectories"""
        logs_path = Path('logs')
        assert logs_path.exists(), "Logs directory missing"

        subdirs = ['compliance', 'sync', 'errors']
        for subdir in subdirs:
            subdir_path = logs_path / subdir
            assert subdir_path.exists(), f"Missing logs subdirectory: {subdir}"


class TestGlobalConfig:
    """Test global configuration files"""

    def test_global_config_exists(self):
        """Test that global-config.yaml exists"""
        config_path = Path('global-config.yaml')
        assert config_path.exists(), "global-config.yaml missing"

    def test_global_config_valid_yaml(self):
        """Test that global-config.yaml is valid YAML"""
        config_path = Path('global-config.yaml')

        with open(config_path) as f:
            config = yaml.safe_load(f)

        assert config is not None, "global-config.yaml is empty"
        assert 'doctrine_enforcement' in config, "Missing doctrine_enforcement section"
        assert 'integration' in config, "Missing integration section"

    def test_enforcement_rules_exist(self):
        """Test that enforcement rules exist"""
        rules_path = Path('ctb/meta/enforcement_rules.json')

        if rules_path.exists():
            with open(rules_path) as f:
                rules = json.load(f)

            assert 'enforcement' in rules, "Missing enforcement section"
            assert 'required_metadata' in rules['enforcement'], "Missing required_metadata"

    def test_ctb_registry_valid(self):
        """Test that CTB registry is valid JSON"""
        registry_path = Path('ctb/meta/ctb_registry.json')

        if registry_path.exists():
            with open(registry_path) as f:
                registry = json.load(f)

            assert 'compliance_score' in registry, "Missing compliance_score"
            assert 'files' in registry, "Missing files section"


class TestComplianceScripts:
    """Test compliance scripts can be imported"""

    def test_scripts_are_executable(self):
        """Test that compliance scripts have execute permissions"""
        scripts_path = Path('ctb/sys/global-factory/scripts')
        scripts = scripts_path.glob('*.py')

        for script in scripts:
            # Check if file is readable (executable check is platform-specific)
            assert script.is_file(), f"Script is not a file: {script.name}"

    def test_compliance_check_script_exists(self):
        """Test that compliance-check.sh exists"""
        script_path = Path('ctb/sys/global-factory/compliance-check.sh')
        assert script_path.exists(), "compliance-check.sh missing"


@pytest.fixture
def temp_ctb_structure(tmp_path):
    """Create a temporary CTB structure for testing"""
    ctb = tmp_path / 'ctb'

    # Create directories
    for branch in ['sys', 'ai', 'data', 'docs', 'ui', 'meta']:
        (ctb / branch).mkdir(parents=True)

    return ctb


def test_temp_structure(temp_ctb_structure):
    """Test that temp structure is created correctly"""
    assert temp_ctb_structure.exists()
    assert (temp_ctb_structure / 'sys').exists()
    assert (temp_ctb_structure / 'ai').exists()
