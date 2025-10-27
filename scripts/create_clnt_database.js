/**
 * Create clnt database in Neon
 */

import { Client } from 'pg';

// Connect to default neondb first
const connectionString = "postgresql://neondb_owner:npg_QnoCfHbgJm32@ep-frosty-brook-ad6wval6-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function createDatabase() {
  const client = new Client({ connectionString });

  try {
    console.log('🔌 Connecting to Neon (neondb)...');
    await client.connect();
    console.log('✅ Connected\n');

    console.log('🗄️  Creating database: clnt');

    try {
      await client.query('CREATE DATABASE clnt;');
      console.log('✅ Database "clnt" created successfully!\n');
    } catch (error) {
      if (error.code === '42P04') {
        console.log('ℹ️  Database "clnt" already exists\n');
      } else {
        throw error;
      }
    }

    console.log('🎉 Ready to run migrations!\n');

  } catch (error) {
    console.error('\n❌ Error:');
    console.error(error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createDatabase();
