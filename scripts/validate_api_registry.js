/**
 * Barton API Registry Validator
 * ---------------------------------
 * Compares /sys/api_registry.json definitions with the actual Neon database
 * to ensure schema, table, and field consistency.
 *
 * Usage:
 *   node scripts/validate_api_registry.js
 */

import fs from "fs";
import { Client } from "pg";

const registryPath = "./sys/api_registry.json";
const connectionString = process.env.NEON_URL || process.env.DATABASE_URL;

async function validateRegistry() {
  console.log("🔍 Validating Barton API Registry...");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  if (!connectionString) {
    console.error("❌ Error: NEON_URL or DATABASE_URL environment variable not set.");
    console.error("   Set it to your Neon PostgreSQL connection string.\n");
    process.exit(1);
  }

  // Load registry
  let registry;
  try {
    registry = JSON.parse(fs.readFileSync(registryPath, "utf-8"));
    console.log(`✅ Loaded registry: ${registryPath}`);
  } catch (error) {
    console.error(`❌ Failed to load registry: ${error.message}\n`);
    process.exit(1);
  }

  // Connect to database
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log(`✅ Connected to database: ${registry.database}\n`);
  } catch (error) {
    console.error(`❌ Database connection failed: ${error.message}\n`);
    process.exit(1);
  }

  let errors = [];
  let warnings = [];
  let tableCount = 0;
  let schemaCount = 0;

  // Validate each schema and table
  for (const [schemaKey, schemaData] of Object.entries(registry.schemas)) {
    schemaCount++;
    console.log(`📂 Schema: ${schemaKey}`);
    console.log(`   Description: ${schemaData.description}`);

    for (const [tableName, tableData] of Object.entries(schemaData.tables)) {
      tableCount++;

      // Check if table exists
      const tableQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = $1
          AND table_name = $2
        ) AS exists;
      `;

      try {
        const res = await client.query(tableQuery, [schemaKey, tableName]);

        if (!res.rows[0].exists) {
          errors.push(`❌ Missing table: ${schemaKey}.${tableName}`);
          console.log(`   ❌ ${tableName} - NOT FOUND`);
        } else {
          console.log(`   ✅ ${tableName} - Found`);

          // Validate primary keys
          const pkQuery = `
            SELECT a.attname
            FROM pg_index i
            JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
            WHERE i.indrelid = $1::regclass AND i.indisprimary;
          `;

          try {
            const pkRes = await client.query(pkQuery, [`${schemaKey}.${tableName}`]);
            const dbKeys = pkRes.rows.map((row) => row.attname);
            const registryKeys = tableData.keys;

            // Check if registry keys match database keys
            for (const key of registryKeys) {
              if (!dbKeys.includes(key)) {
                errors.push(
                  `❌ Primary key mismatch in ${schemaKey}.${tableName}: expected '${key}' not found`
                );
                console.log(`      ❌ Primary key '${key}' - NOT FOUND`);
              } else {
                console.log(`      ✅ Primary key '${key}' - Verified`);
              }
            }
          } catch (pkError) {
            warnings.push(
              `⚠️  Could not verify primary keys for ${schemaKey}.${tableName}: ${pkError.message}`
            );
          }

          // Validate doctrine metadata columns
          const doctrineFields = registry.doctrine_metadata.enforced_fields;
          const columnQuery = `
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = $1 AND table_name = $2;
          `;

          try {
            const colRes = await client.query(columnQuery, [schemaKey, tableName]);
            const dbColumns = colRes.rows.map((row) => row.column_name);

            let allDoctrinePresent = true;
            for (const field of doctrineFields) {
              if (!dbColumns.includes(field)) {
                errors.push(
                  `❌ Missing doctrine field '${field}' in ${schemaKey}.${tableName}`
                );
                console.log(`      ❌ Doctrine field '${field}' - MISSING`);
                allDoctrinePresent = false;
              }
            }

            if (allDoctrinePresent) {
              console.log(`      ✅ All doctrine fields present`);
            }
          } catch (colError) {
            warnings.push(
              `⚠️  Could not verify columns for ${schemaKey}.${tableName}: ${colError.message}`
            );
          }

          // Validate foreign key relationships (if any)
          if (tableData.relations && tableData.relations.length > 0) {
            const fkQuery = `
              SELECT
                ccu.table_name AS foreign_table
              FROM information_schema.table_constraints AS tc
              JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
                AND tc.table_schema = kcu.table_schema
              JOIN information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
                AND ccu.table_schema = tc.table_schema
              WHERE tc.constraint_type = 'FOREIGN KEY'
                AND tc.table_schema = $1
                AND tc.table_name = $2;
            `;

            try {
              const fkRes = await client.query(fkQuery, [schemaKey, tableName]);
              const dbRelations = fkRes.rows.map((row) => row.foreign_table);

              for (const relation of tableData.relations) {
                if (!dbRelations.includes(relation)) {
                  warnings.push(
                    `⚠️  Relation '${relation}' in ${schemaKey}.${tableName} not enforced by FK in database`
                  );
                  console.log(`      ⚠️  Relation '${relation}' - Not enforced by FK`);
                } else {
                  console.log(`      ✅ Relation '${relation}' - Valid FK`);
                }
              }
            } catch (fkError) {
              warnings.push(
                `⚠️  Could not verify foreign keys for ${schemaKey}.${tableName}: ${fkError.message}`
              );
            }
          }
        }
      } catch (error) {
        errors.push(`❌ Error checking ${schemaKey}.${tableName}: ${error.message}`);
        console.log(`   ❌ ${tableName} - ERROR: ${error.message}`);
      }
    }

    console.log(); // Blank line between schemas
  }

  await client.end();

  // Print summary
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📊 VALIDATION SUMMARY");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`   Schemas checked:  ${schemaCount}`);
  console.log(`   Tables checked:   ${tableCount}`);
  console.log(`   Errors found:     ${errors.length}`);
  console.log(`   Warnings found:   ${warnings.length}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  if (errors.length > 0) {
    console.log("❌ ERRORS:");
    errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
    console.log();
  }

  if (warnings.length > 0) {
    console.log("⚠️  WARNINGS:");
    warnings.forEach((warning, index) => {
      console.log(`   ${index + 1}. ${warning}`);
    });
    console.log();
  }

  if (errors.length === 0 && warnings.length === 0) {
    console.log("🎉 Registry validation successful. All tables found.");
    console.log("✅ All primary keys verified.");
    console.log("✅ All doctrine fields present.");
    console.log("✅ All foreign key relationships valid.\n");
    console.log("📌 Next steps:");
    console.log("   1. Set 'endpoint_status': 'active' in manifest.json");
    console.log("   2. Deploy Composio MCP endpoints");
    console.log("   3. Run endpoint tests: npm run test\n");
  } else if (errors.length === 0) {
    console.log("✅ Registry validation successful with warnings.");
    console.log("⚠️  Review warnings above before activating endpoints.\n");
  } else {
    console.log("❌ Registry validation failed.");
    console.log("🛠️  Fix errors above before activating endpoints.\n");
    process.exit(1);
  }
}

validateRegistry().catch((e) => {
  console.error("\n⚠️  Fatal error validating registry:", e.message);
  console.error(e.stack);
  process.exit(1);
});
