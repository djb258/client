/**
 * Check what exists in Neon database
 */

import { Client } from 'pg';

const connectionString = "postgresql://neondb_owner:npg_QnoCfHbgJm32@ep-frosty-brook-ad6wval6-pooler.c-2.us-east-1.aws.neon.tech/clnt?sslmode=require&channel_binding=require";

async function checkDatabase() {
  const client = new Client({ connectionString });

  try {
    console.log('🔌 Connecting to Neon...');
    await client.connect();
    console.log('✅ Connected\n');

    // Check current database
    const dbResult = await client.query('SELECT current_database();');
    console.log(`📊 Current database: ${dbResult.rows[0].current_database}\n`);

    // List all schemas
    console.log('📂 Schemas:');
    const schemaResult = await client.query(`
      SELECT schema_name
      FROM information_schema.schemata
      WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
      ORDER BY schema_name;
    `);

    if (schemaResult.rows.length === 0) {
      console.log('   ❌ No schemas found\n');
    } else {
      schemaResult.rows.forEach(row => console.log(`   - ${row.schema_name}`));
      console.log();
    }

    // List all tables
    console.log('📋 Tables:');
    const tableResult = await client.query(`
      SELECT table_schema, table_name
      FROM information_schema.tables
      WHERE table_schema NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
      ORDER BY table_schema, table_name;
    `);

    if (tableResult.rows.length === 0) {
      console.log('   ❌ No tables found\n');
    } else {
      tableResult.rows.forEach(row => console.log(`   - ${row.table_schema}.${row.table_name}`));
      console.log();
    }

    // Try to count records in any tables that might exist
    if (tableResult.rows.length > 0) {
      console.log('📊 Record counts:');
      for (const row of tableResult.rows) {
        try {
          const countResult = await client.query(`SELECT COUNT(*) FROM ${row.table_schema}.${row.table_name};`);
          console.log(`   - ${row.table_schema}.${row.table_name}: ${countResult.rows[0].count} records`);
        } catch (e) {
          console.log(`   - ${row.table_schema}.${row.table_name}: Error reading`);
        }
      }
      console.log();
    }

  } catch (error) {
    console.error('\n❌ Error:');
    console.error(error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

checkDatabase();
