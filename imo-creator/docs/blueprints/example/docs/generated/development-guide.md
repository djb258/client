# Development Guide

## Getting Started

### Prerequisites

- Node.js >= 18
- Python >= 3.11
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/your-repo

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
