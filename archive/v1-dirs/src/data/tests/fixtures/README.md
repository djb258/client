# Test Fixtures

This directory contains test data fixtures for CTB/DATA tests.

## Available Fixtures

### Client Fixtures
- `clients.json` - Sample client data
- `client_profiles.json` - Client profile data

### Blueprint Fixtures
- `blueprints.json` - Sample blueprint data
- `imo_processes.json` - IMO process data

## Usage

```python
import pytest
import json
from pathlib import Path

@pytest.fixture
def client_fixtures():
    """Load client test fixtures"""
    fixtures_path = Path(__file__).parent / 'fixtures' / 'clients.json'
    with open(fixtures_path) as f:
        return json.load(f)

def test_with_fixtures(client_fixtures):
    """Use fixtures in test"""
    assert len(client_fixtures) > 0
```

## Adding New Fixtures

1. Create JSON file with test data
2. Add to appropriate category
3. Update this README
4. Create corresponding pytest fixture
