# Barton API Validation CI/CD Pipeline

## 🧭 Overview

This pipeline enforces Barton Doctrine compliance on every push or pull request. It automatically validates the API registry against the live Neon database schema and runs the complete test suite.

The pipeline ensures:
- ✅ All tables in `/sys/api_registry.json` exist in Neon
- ✅ Composio manifest matches the registry
- ✅ Full Jest contract suite passes
- ✅ Test coverage is tracked
- ✅ Results are reported to GitHub as a pass/fail check

---

## ⚙️ Workflow Summary

The CI pipeline runs on:
- **Push** to `main`, `dev`, or `get-ingest` branches
- **Pull requests** to `main` or `dev` branches

### Pipeline Steps

| Step | Action | Tool | Purpose |
|------|--------|------|---------|
| 1️⃣ | **Checkout Repository** | `actions/checkout@v4` | Clone repo code |
| 2️⃣ | **Setup Node.js** | `actions/setup-node@v4` | Install Node 20 with npm cache |
| 3️⃣ | **Install Dependencies** | `npm ci` | Install exact package versions |
| 4️⃣ | **Set Environment Variables** | Environment setup | Configure NEON_URL, etc. |
| 5️⃣ | **Validate Schema Registry** | `validate_api_registry.js` | Check database matches registry |
| 6️⃣ | **Run Jest Tests** | `api_endpoint_contract.test.js` | Run 39 contract tests |
| 7️⃣ | **Upload Test Results** | `actions/upload-artifact@v4` | Save test results & coverage |
| 8️⃣ | **Upload Coverage** | `codecov/codecov-action@v4` | Send coverage to Codecov (optional) |
| 9️⃣ | **Comment PR with Results** | `actions/github-script@v7` | Post summary to PR |
| 🔟 | **Final Summary** | Echo commands | Print success message |

---

## 🔐 Environment Variables

### Required Secrets

Set these in **GitHub Repository Settings → Secrets and variables → Actions**:

| Variable | Description | Example |
|----------|-------------|---------|
| `NEON_URL` | Connection string to Neon PostgreSQL | `postgresql://user:pass@host/clnt` |
| `BARTON_GATEKEEPER_KEY` | API key for Composio endpoints | `barton_key_abc123...` |

### Setting Secrets via GitHub CLI

```bash
# Set Neon database URL
gh secret set NEON_URL --body "postgresql://user:password@ep-example-123456.us-east-2.aws.neon.tech/clnt?sslmode=require"

# Set Barton gatekeeper API key
gh secret set BARTON_GATEKEEPER_KEY --body "your-secure-api-key-here"
```

### Setting Secrets via GitHub UI

1. Navigate to your repository on GitHub
2. Go to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add `NEON_URL` with your connection string
5. Add `BARTON_GATEKEEPER_KEY` with your API key

---

## ✅ Local Usage

Run the complete validation locally before pushing:

```bash
# Set environment variable
export NEON_URL="postgresql://user:pass@host/clnt"

# Run complete verification
npm run verify:api
```

This will:
1. Run schema registry validation
2. Run Jest test suite
3. Print success message

### Individual Commands

```bash
# Run only schema validation
npm run agent:validate-registry

# Run only tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

---

## 📊 GitHub Output

### Status Checks

The pipeline creates a GitHub status check visible on:
- **Pull requests** (required check before merge)
- **Commits** (visible on commit page)
- **Branches** (visible on branches page)

### Status Indicators

| Status | Meaning | Action |
|--------|---------|--------|
| ✅ **Pass** | All validations successful | Merge allowed |
| ❌ **Fail** | Validation or tests failed | Fix errors before merge |
| 🟡 **Pending** | Pipeline running | Wait for completion |

### PR Comment Example

When the pipeline runs on a pull request, it automatically posts a comment with results:

```markdown
## 🔍 Barton API Validation Results

✅ **Schema Registry Validation**: Passed
✅ **Jest Test Suite**: Passed

### 📊 Test Coverage

- **Lines**: 95.2%
- **Statements**: 94.8%
- **Functions**: 91.3%
- **Branches**: 88.7%

### 📋 Validation Summary

- ✅ All schemas exist in database
- ✅ All tables verified
- ✅ Primary keys validated
- ✅ Doctrine metadata present
- ✅ Registry/manifest consistency

🎉 All checks passed! This PR is ready for review.
```

---

## 📦 Artifacts

The pipeline uploads test artifacts that are available for 30 days:

### Downloadable Artifacts

1. **jest-results** - Contains:
   - `junit.xml` - JUnit format test results
   - `coverage/` - Full coverage reports (HTML, JSON, LCOV)

### Accessing Artifacts

1. Go to **Actions** tab in your repository
2. Click on a workflow run
3. Scroll to **Artifacts** section at bottom
4. Download `jest-results.zip`

---

## 🛠️ Troubleshooting

### Pipeline Fails: "NEON_URL not set"

**Cause:** Missing or incorrectly named secret

**Solution:**
```bash
gh secret set NEON_URL --body "your-connection-string"
```

Verify secret exists:
```bash
gh secret list
```

### Pipeline Fails: "Database connection failed"

**Cause:** Invalid connection string or network issue

**Solutions:**
1. Test connection locally:
   ```bash
   psql "$NEON_URL" -c "SELECT current_database();"
   ```
2. Verify Neon database is online
3. Check if Neon allows connections from GitHub Actions IPs
4. Verify connection string format is correct

### Pipeline Fails: "Missing table: core.company_master"

**Cause:** Database migrations not applied

**Solution:**
1. Ensure all migrations have been run on Neon:
   ```bash
   psql "$NEON_URL" -f db/neon/migrations/10_clnt_core_schema.sql
   psql "$NEON_URL" -f db/neon/migrations/11_clnt_benefits_schema.sql
   # ... run all migrations 10-15
   ```
2. Verify migrations in GitHub Actions (add migration step if needed)

### Tests Pass Locally but Fail in CI

**Causes:**
- Different Node.js versions
- Missing environment variables
- File path issues (Windows vs Linux)

**Solutions:**
1. Use same Node version locally:
   ```bash
   nvm use 20
   npm test
   ```
2. Check environment variables match
3. Test with CI flag:
   ```bash
   CI=true npm test
   ```

### Jest Tests Timeout

**Cause:** Database connection taking too long

**Solution:** Increase timeout in jest.config.js:
```javascript
module.exports = {
  testTimeout: 30000, // 30 seconds
};
```

---

## 🔧 Customization

### Changing Trigger Branches

Edit `.github/workflows/validate-api.yml`:

```yaml
on:
  push:
    branches: [main, dev, staging, production]  # Add your branches
  pull_request:
    branches: [main, production]
```

### Adding Slack Notifications

Add this step after the final summary:

```yaml
- name: 📢 Notify Slack
  uses: 8398a7/action-slack@v3
  if: always()
  with:
    status: ${{ job.status }}
    text: "Barton API validation ${{ job.status }}"
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

### Adding Email Notifications

Add this step:

```yaml
- name: 📧 Send Email
  uses: dawidd6/action-send-mail@v3
  if: failure()
  with:
    server_address: smtp.gmail.com
    server_port: 465
    username: ${{ secrets.EMAIL_USERNAME }}
    password: ${{ secrets.EMAIL_PASSWORD }}
    subject: "Barton API Validation Failed"
    to: team@example.com
    from: ci@example.com
    body: "Validation failed for commit ${{ github.sha }}"
```

### Running on Schedule

Add a scheduled trigger to run tests daily:

```yaml
on:
  push:
    branches: [main, dev]
  pull_request:
    branches: [main, dev]
  schedule:
    - cron: '0 8 * * *'  # Run daily at 8am UTC
```

---

## 📈 Coverage Reporting

### Codecov Integration (Optional)

The pipeline includes optional Codecov integration for tracking test coverage trends.

**Setup:**
1. Sign up at [codecov.io](https://codecov.io)
2. Link your GitHub repository
3. Add `CODECOV_TOKEN` to GitHub secrets (optional for public repos)

**Viewing Coverage:**
- Visit `https://codecov.io/gh/your-org/your-repo`
- See coverage trends, file-by-file coverage
- Add Codecov badge to README

### Coverage Badges

Add to your README.md:

```markdown
![API Tests](https://github.com/your-org/your-repo/actions/workflows/validate-api.yml/badge.svg)
![Coverage](https://codecov.io/gh/your-org/your-repo/branch/main/graph/badge.svg)
```

---

## 🚀 Advanced Configuration

### Running Tests in Parallel

Update the workflow to run validation and tests in parallel:

```yaml
jobs:
  validate-schema:
    runs-on: ubuntu-latest
    steps:
      # ... validation steps

  run-tests:
    runs-on: ubuntu-latest
    steps:
      # ... test steps

  summary:
    needs: [validate-schema, run-tests]
    runs-on: ubuntu-latest
    steps:
      - name: All checks passed
        run: echo "✅ Complete"
```

### Matrix Testing (Multiple Node Versions)

Test against multiple Node versions:

```yaml
jobs:
  verify-api:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20, 21]
    steps:
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
      # ... rest of steps
```

### Conditional Execution

Only run on specific file changes:

```yaml
on:
  push:
    paths:
      - 'sys/**'
      - 'scripts/validate_api_registry.js'
      - 'tests/api_endpoint_contract.test.js'
      - 'db/neon/migrations/**'
```

---

## 📋 Checklist for First Run

Before the first pipeline run:

- [ ] ✅ Set `NEON_URL` secret in GitHub
- [ ] ✅ Set `BARTON_GATEKEEPER_KEY` secret in GitHub
- [ ] ✅ Verify all migrations applied to Neon database
- [ ] ✅ Test validation script locally (`npm run agent:validate-registry`)
- [ ] ✅ Test complete verification locally (`npm run verify:api`)
- [ ] ✅ Commit `.github/workflows/validate-api.yml`
- [ ] ✅ Push to trigger first pipeline run
- [ ] ✅ Check Actions tab for results
- [ ] ✅ Fix any failures and push again

---

## 🎯 Expected Results

### Successful Run Output

```
🧩 Checkout Repository
✅ Completed

🧱 Setup Node.js
✅ Node 20 installed

📦 Install Dependencies
✅ 143 packages installed

🔑 Set Environment Variables
✅ NEON_URL is set: Yes
✅ Environment ready for API validation.

🔍 Validate Schema Registry
✅ Connected to database: clnt
✅ All 5 schemas verified
✅ All 9 tables verified
✅ All primary keys validated
✅ All doctrine fields present

🧪 Run Jest Tests
✅ 39 tests passed
✅ Coverage: 94.2%

📊 Upload Test Results
✅ Artifacts uploaded

💬 Comment PR with Results
✅ Comment posted

✅ Final Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 Barton API Verification Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Schema registry validated
✅ All tests passed
✅ Coverage report generated
```

---

## 📚 Related Documentation

- [API Validation Guide](./API_VALIDATION_GUIDE.md) - Complete local testing guide
- [API Registry README](../sys/api_registry_README.md) - API documentation
- [Schema Migrations](../db/neon/migrations/README.md) - Database setup
- [GitHub Actions Docs](https://docs.github.com/en/actions) - GitHub Actions reference

---

## 🆘 Support

### Getting Help

1. **Check Actions Tab**: See detailed logs for each step
2. **Review Validation Guide**: [API_VALIDATION_GUIDE.md](./API_VALIDATION_GUIDE.md)
3. **Test Locally**: Run `npm run verify:api` to reproduce issues
4. **Check Secrets**: Verify all required secrets are set

### Common Issues and Solutions

| Issue | Quick Fix |
|-------|-----------|
| Missing secrets | `gh secret set NEON_URL --body "..."` |
| Connection failed | Verify Neon DB is online and accessible |
| Tests timeout | Increase timeout in jest.config.js |
| Missing tables | Run all migrations (10-15) on Neon |
| Node version mismatch | Use Node 20 locally |

---

**Pipeline Version:** 1.0.0
**Created:** 2025-10-27
**Workflow File:** `.github/workflows/validate-api.yml`
**Status:** Active
