.PHONY: codegen verify gate drift dev build lint

# Registry-first codegen
codegen:
	npx ts-node scripts/codegen-schema.ts

# Verify generated files match registry
verify:
	npm run codegen:verify

# Run registry gate (CI check)
gate:
	bash scripts/ctb-registry-gate.sh

# Run drift audit (requires DATABASE_URL)
drift:
	bash scripts/ctb-drift-audit.sh

# Check for banned DB client imports
banned:
	bash scripts/detect-banned-db-clients.sh

# Development server
dev:
	npm run dev

# Production build
build:
	npm run build

# Lint
lint:
	npm run lint

# Bootstrap audit (first-time setup validation)
bootstrap:
	bash scripts/bootstrap-audit.sh

# Full CI gate suite
ci: gate banned verify
	@echo "All CI gates passed."
