#!/usr/bin/env node
/**
 * Agent Environment Validation Script
 *
 * This script validates the agent environment by:
 * 1. Reading and validating bootstrap_program.json
 * 2. Verifying access to Neon database
 * 3. Confirming required tables exist (employee_vendor_ids, audit_log, error_log)
 * 4. Logging success/failure for each check
 *
 * Usage: npm run agent:validate-env
 * Or: ts-node scripts/setup_agent_env.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { Pool } from 'pg';

interface BootstrapConfig {
  repo_name: string;
  blueprint_version: string;
  validator_signature: string;
  error_log_table: string;
  audit_log_table: string;
  vendor_table: string;
  doctrine: string[];
  llm_instruction: string;
}

interface ValidationResult {
  check: string;
  status: 'success' | 'failure';
  message: string;
  details?: any;
}

class AgentEnvironmentValidator {
  private results: ValidationResult[] = [];
  private bootstrapConfig: BootstrapConfig | null = null;
  private dbPool: Pool | null = null;

  /**
   * Run all validation checks
   */
  async validate(): Promise<boolean> {
    console.log('🔍 Starting agent environment validation...\n');

    // Check 1: Read and validate bootstrap_program.json
    await this.checkBootstrapConfig();

    // Check 2: Verify database connectivity
    await this.checkDatabaseConnection();

    // Check 3: Verify required tables exist
    if (this.dbPool && this.bootstrapConfig) {
      await this.checkTableExists('clnt', 'employee_vendor_ids');
      await this.checkTableExists('shq', 'audit_log');
      await this.checkTableExists('shq', 'error_log');
    }

    // Close database connection
    if (this.dbPool) {
      await this.dbPool.end();
    }

    // Print results
    this.printResults();

    // Determine overall status
    const allPassed = this.results.every(r => r.status === 'success');
    return allPassed;
  }

  /**
   * Check 1: Read and validate bootstrap_program.json
   */
  private async checkBootstrapConfig(): Promise<void> {
    const bootstrapPath = path.join(process.cwd(), 'bootstrap_program.json');

    try {
      // Check if file exists
      if (!fs.existsSync(bootstrapPath)) {
        this.results.push({
          check: 'Bootstrap Config',
          status: 'failure',
          message: 'bootstrap_program.json not found',
          details: { path: bootstrapPath }
        });
        return;
      }

      // Read and parse JSON
      const content = fs.readFileSync(bootstrapPath, 'utf-8');
      const config = JSON.parse(content) as BootstrapConfig;

      // Validate required fields
      const requiredFields = [
        'repo_name',
        'blueprint_version',
        'validator_signature',
        'error_log_table',
        'audit_log_table',
        'vendor_table',
        'doctrine',
        'llm_instruction'
      ];

      const missingFields = requiredFields.filter(field => !config[field as keyof BootstrapConfig]);

      if (missingFields.length > 0) {
        this.results.push({
          check: 'Bootstrap Config',
          status: 'failure',
          message: 'Missing required fields',
          details: { missingFields }
        });
        return;
      }

      // Validate doctrine array
      if (!Array.isArray(config.doctrine) || config.doctrine.length === 0) {
        this.results.push({
          check: 'Bootstrap Config',
          status: 'failure',
          message: 'Doctrine must be a non-empty array',
          details: { doctrine: config.doctrine }
        });
        return;
      }

      this.bootstrapConfig = config;
      this.results.push({
        check: 'Bootstrap Config',
        status: 'success',
        message: 'bootstrap_program.json is valid',
        details: {
          repo_name: config.repo_name,
          blueprint_version: config.blueprint_version,
          validator_signature: config.validator_signature,
          doctrine: config.doctrine
        }
      });

    } catch (error) {
      this.results.push({
        check: 'Bootstrap Config',
        status: 'failure',
        message: `Failed to read/parse bootstrap_program.json: ${error instanceof Error ? error.message : String(error)}`,
        details: { error }
      });
    }
  }

  /**
   * Check 2: Verify database connectivity
   */
  private async checkDatabaseConnection(): Promise<void> {
    const databaseUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;

    if (!databaseUrl) {
      this.results.push({
        check: 'Database Connection',
        status: 'failure',
        message: 'DATABASE_URL or NEON_DATABASE_URL environment variable not set',
        details: {
          hint: 'Set DATABASE_URL in your .env file or environment'
        }
      });
      return;
    }

    try {
      // Create connection pool
      this.dbPool = new Pool({
        connectionString: databaseUrl,
        ssl: { rejectUnauthorized: false }, // Required for Neon
        max: 1,
        idleTimeoutMillis: 10000,
        connectionTimeoutMillis: 5000
      });

      // Test connection
      const client = await this.dbPool.connect();
      const result = await client.query('SELECT 1 as connection_test');
      client.release();

      this.results.push({
        check: 'Database Connection',
        status: 'success',
        message: 'Successfully connected to Neon database',
        details: {
          connectionTest: result.rows[0].connection_test === 1 ? 'passed' : 'failed'
        }
      });

    } catch (error) {
      this.results.push({
        check: 'Database Connection',
        status: 'failure',
        message: `Failed to connect to database: ${error instanceof Error ? error.message : String(error)}`,
        details: { error }
      });
    }
  }

  /**
   * Check 3: Verify table exists
   */
  private async checkTableExists(schema: string, tableName: string): Promise<void> {
    if (!this.dbPool) {
      this.results.push({
        check: `Table: ${schema}.${tableName}`,
        status: 'failure',
        message: 'Database connection not available',
        details: {}
      });
      return;
    }

    try {
      const query = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = $1
          AND table_name = $2
        ) as table_exists;
      `;

      const result = await this.dbPool.query(query, [schema, tableName]);
      const exists = result.rows[0].table_exists;

      if (exists) {
        // Get additional table info
        const countQuery = `SELECT COUNT(*) as row_count FROM ${schema}.${tableName}`;
        const countResult = await this.dbPool.query(countQuery);

        this.results.push({
          check: `Table: ${schema}.${tableName}`,
          status: 'success',
          message: `Table exists`,
          details: {
            schema,
            tableName,
            rowCount: parseInt(countResult.rows[0].row_count)
          }
        });
      } else {
        this.results.push({
          check: `Table: ${schema}.${tableName}`,
          status: 'failure',
          message: `Table does not exist`,
          details: {
            schema,
            tableName,
            hint: `Run migrations to create ${schema}.${tableName}`
          }
        });
      }

    } catch (error) {
      this.results.push({
        check: `Table: ${schema}.${tableName}`,
        status: 'failure',
        message: `Failed to check table existence: ${error instanceof Error ? error.message : String(error)}`,
        details: { schema, tableName, error }
      });
    }
  }

  /**
   * Print validation results
   */
  private printResults(): void {
    console.log('\n📋 Validation Results:\n');
    console.log('═'.repeat(80));

    this.results.forEach((result, index) => {
      const icon = result.status === 'success' ? '✅' : '❌';
      console.log(`\n${index + 1}. ${icon} ${result.check}`);
      console.log(`   Status: ${result.status.toUpperCase()}`);
      console.log(`   Message: ${result.message}`);

      if (result.details && Object.keys(result.details).length > 0) {
        console.log(`   Details: ${JSON.stringify(result.details, null, 2).split('\n').join('\n   ')}`);
      }
    });

    console.log('\n' + '═'.repeat(80));

    const successCount = this.results.filter(r => r.status === 'success').length;
    const failureCount = this.results.filter(r => r.status === 'failure').length;
    const totalCount = this.results.length;

    console.log(`\n📊 Summary: ${successCount}/${totalCount} checks passed (${failureCount} failed)\n`);

    if (failureCount === 0) {
      console.log('✅ Agent environment is valid and ready.\n');
    } else {
      console.log('❌ Agent environment validation failed. Please fix the errors above.\n');
    }
  }
}

/**
 * Main execution
 */
async function main() {
  const validator = new AgentEnvironmentValidator();
  const isValid = await validator.validate();

  // Exit with appropriate code
  process.exit(isValid ? 0 : 1);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Unexpected error during validation:', error);
    process.exit(1);
  });
}

export { AgentEnvironmentValidator, ValidationResult, BootstrapConfig };
