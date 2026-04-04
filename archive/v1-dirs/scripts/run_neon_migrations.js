/**
 * Run Neon Database Migrations
 * Executes all migration files in order
 */

import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectionString = "postgresql://neondb_owner:npg_QnoCfHbgJm32@ep-frosty-brook-ad6wval6-pooler.c-2.us-east-1.aws.neon.tech/clnt?sslmode=require&channel_binding=require";

const migrations = [
  '10_clnt_core_schema.sql',
  '11_clnt_benefits_schema.sql',
  '12_clnt_compliance_schema.sql',
  '13_clnt_operations_schema.sql',
  '14_clnt_staging_schema.sql',
  '15_clnt_seed_data.sql'
];

async function runMigrations() {
  const client = new Client({ connectionString });

  try {
    console.log('🔌 Connecting to Neon database...');
    await client.connect();
    console.log('✅ Connected to database: clnt\n');

    for (const migrationFile of migrations) {
      const migrationPath = path.join(__dirname, '../db/neon/migrations', migrationFile);

      console.log(`📄 Running migration: ${migrationFile}`);

      const sql = fs.readFileSync(migrationPath, 'utf-8');

      try {
        await client.query(sql);
        console.log(`✅ ${migrationFile} completed successfully\n`);
      } catch (error) {
        console.error(`❌ Error in ${migrationFile}:`);
        console.error(error.message);
        throw error;
      }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 All migrations completed successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Verify schemas
    console.log('\n🔍 Verifying schemas...');
    const schemaResult = await client.query(`
      SELECT schema_name
      FROM information_schema.schemata
      WHERE schema_name IN ('core', 'benefits', 'compliance', 'operations', 'staging')
      ORDER BY schema_name;
    `);

    console.log(`✅ Found ${schemaResult.rows.length} schemas:`);
    schemaResult.rows.forEach(row => console.log(`   - ${row.schema_name}`));

    // Verify tables
    console.log('\n🔍 Verifying tables...');
    const tableResult = await client.query(`
      SELECT table_schema, table_name
      FROM information_schema.tables
      WHERE table_schema IN ('core', 'benefits', 'compliance', 'operations', 'staging')
      ORDER BY table_schema, table_name;
    `);

    console.log(`✅ Found ${tableResult.rows.length} tables:`);
    tableResult.rows.forEach(row => console.log(`   - ${row.table_schema}.${row.table_name}`));

    // Count seed data
    console.log('\n🔍 Verifying seed data...');
    const counts = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM core.company_master) as companies,
        (SELECT COUNT(*) FROM core.employee_master) as employees,
        (SELECT COUNT(*) FROM benefits.vendor_link) as vendors,
        (SELECT COUNT(*) FROM compliance.compliance_vault) as compliance_records,
        (SELECT COUNT(*) FROM operations.audit_data_lineage) as audit_records,
        (SELECT COUNT(*) FROM staging.raw_intake_company WHERE processed = FALSE) as unprocessed_companies,
        (SELECT COUNT(*) FROM staging.raw_intake_employee WHERE processed = FALSE) as unprocessed_employees;
    `);

    const data = counts.rows[0];
    console.log(`✅ Seed data loaded:`);
    console.log(`   - Companies: ${data.companies}`);
    console.log(`   - Employees: ${data.employees}`);
    console.log(`   - Vendors: ${data.vendors}`);
    console.log(`   - Compliance records: ${data.compliance_records}`);
    console.log(`   - Audit records: ${data.audit_records}`);
    console.log(`   - Unprocessed companies: ${data.unprocessed_companies}`);
    console.log(`   - Unprocessed employees: ${data.unprocessed_employees}`);

    console.log('\n🚀 Database is ready for use!\n');

  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
