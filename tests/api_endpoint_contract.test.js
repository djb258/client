/**
 * Jest Test Suite: API Endpoint Contract Verification
 * ---------------------------------------------------
 * Ensures that each endpoint defined in the Composio manifest is valid JSON,
 * has required properties, and matches api_registry.json.
 *
 * Run with: npm test
 */
import fs from "fs";
import path from "path";

// Load configuration files
const registryPath = path.join(process.cwd(), "sys/api_registry.json");
const manifestPath = path.join(process.cwd(), "sys/composio-mcp/manifest.json");

let registry;
let manifest;

beforeAll(() => {
  // Load registry
  const registryContent = fs.readFileSync(registryPath, "utf-8");
  registry = JSON.parse(registryContent);

  // Load manifest
  const manifestContent = fs.readFileSync(manifestPath, "utf-8");
  manifest = JSON.parse(manifestContent);
});

describe("API Registry Structure", () => {
  test("Registry file exists and is valid JSON", () => {
    expect(registry).toBeDefined();
    expect(typeof registry).toBe("object");
  });

  test("Registry has required top-level properties", () => {
    expect(registry).toHaveProperty("api_version");
    expect(registry).toHaveProperty("database");
    expect(registry).toHaveProperty("schemas");
    expect(registry).toHaveProperty("access_control");
    expect(registry).toHaveProperty("doctrine_metadata");
  });

  test("Registry database is 'clnt'", () => {
    expect(registry.database).toBe("clnt");
  });

  test("Registry has all 5 schemas", () => {
    const schemaKeys = Object.keys(registry.schemas);
    expect(schemaKeys).toHaveLength(5);
    expect(schemaKeys).toContain("core");
    expect(schemaKeys).toContain("benefits");
    expect(schemaKeys).toContain("compliance");
    expect(schemaKeys).toContain("operations");
    expect(schemaKeys).toContain("staging");
  });

  test("Each schema has description and tables", () => {
    Object.entries(registry.schemas).forEach(([schemaName, schemaData]) => {
      expect(schemaData).toHaveProperty("description");
      expect(schemaData).toHaveProperty("tables");
      expect(typeof schemaData.description).toBe("string");
      expect(typeof schemaData.tables).toBe("object");
    });
  });

  test("Each table has required properties", () => {
    Object.entries(registry.schemas).forEach(([schemaName, schemaData]) => {
      Object.entries(schemaData.tables).forEach(([tableName, tableData]) => {
        expect(tableData).toHaveProperty("methods");
        expect(tableData).toHaveProperty("keys");
        expect(tableData).toHaveProperty("relations");

        expect(Array.isArray(tableData.methods)).toBe(true);
        expect(Array.isArray(tableData.keys)).toBe(true);
        expect(Array.isArray(tableData.relations)).toBe(true);

        // Methods should be valid HTTP methods
        tableData.methods.forEach((method) => {
          expect(["GET", "POST", "PATCH", "PUT", "DELETE"]).toContain(method);
        });
      });
    });
  });
});

describe("Composio Manifest Structure", () => {
  test("Manifest file exists and is valid JSON", () => {
    expect(manifest).toBeDefined();
    expect(typeof manifest).toBe("object");
  });

  test("Manifest has required top-level properties", () => {
    expect(manifest).toHaveProperty("manifest_version");
    expect(manifest).toHaveProperty("name");
    expect(manifest).toHaveProperty("description");
    expect(manifest).toHaveProperty("version");
    expect(manifest).toHaveProperty("endpoints");
    expect(manifest).toHaveProperty("security");
    expect(manifest).toHaveProperty("metadata");
  });

  test("Manifest name is 'barton-client-database'", () => {
    expect(manifest.name).toBe("barton-client-database");
  });

  test("Manifest endpoints is an array", () => {
    expect(Array.isArray(manifest.endpoints)).toBe(true);
    expect(manifest.endpoints.length).toBeGreaterThan(0);
  });

  test("Each endpoint has required properties", () => {
    manifest.endpoints.forEach((endpoint) => {
      expect(endpoint).toHaveProperty("path");
      expect(endpoint).toHaveProperty("schema");
      expect(endpoint).toHaveProperty("table");
      expect(endpoint).toHaveProperty("methods");
      expect(endpoint).toHaveProperty("auth");

      expect(typeof endpoint.path).toBe("string");
      expect(typeof endpoint.schema).toBe("string");
      expect(typeof endpoint.table).toBe("string");
      expect(Array.isArray(endpoint.methods)).toBe(true);
      expect(typeof endpoint.auth).toBe("string");
    });
  });

  test("Endpoint methods are valid HTTP methods", () => {
    manifest.endpoints.forEach((endpoint) => {
      endpoint.methods.forEach((method) => {
        expect(["GET", "POST", "PATCH", "PUT", "DELETE"]).toContain(method);
      });
    });
  });

  test("Endpoint auth is valid", () => {
    manifest.endpoints.forEach((endpoint) => {
      expect(["gatekeeper", "readonly", "public"]).toContain(endpoint.auth);
    });
  });

  test("Manifest security has required properties", () => {
    expect(manifest.security).toHaveProperty("auth_mode");
    expect(manifest.security).toHaveProperty("key_env");
    expect(manifest.security.auth_mode).toBe("api_key");
    expect(manifest.security.key_env).toBe("BARTON_GATEKEEPER_KEY");
  });

  test("Manifest metadata has required properties", () => {
    expect(manifest.metadata).toHaveProperty("owner");
    expect(manifest.metadata).toHaveProperty("doctrine");
    expect(manifest.metadata).toHaveProperty("validator_agent");
    expect(manifest.metadata).toHaveProperty("auto_generate_sdk");
    expect(manifest.metadata).toHaveProperty("endpoint_status");
  });

  test("Endpoints are initially inactive", () => {
    expect(manifest.metadata.endpoint_status).toBe("inactive");
  });

  test("SDK auto-generation is initially disabled", () => {
    expect(manifest.metadata.auto_generate_sdk).toBe(false);
  });
});

describe("Registry and Manifest Consistency", () => {
  test("Registry and manifest table counts match", () => {
    // Count tables in registry
    let registryTableCount = 0;
    Object.values(registry.schemas).forEach((schemaData) => {
      registryTableCount += Object.keys(schemaData.tables).length;
    });

    // Count endpoints in manifest
    const manifestTableCount = manifest.endpoints.length;

    expect(manifestTableCount).toBe(registryTableCount);
  });

  test("All registry tables have corresponding manifest endpoints", () => {
    const registryTables = [];

    Object.entries(registry.schemas).forEach(([schemaName, schemaData]) => {
      Object.keys(schemaData.tables).forEach((tableName) => {
        registryTables.push(`${schemaName}.${tableName}`);
      });
    });

    const manifestTables = manifest.endpoints.map(
      (e) => `${e.schema}.${e.table}`
    );

    registryTables.forEach((table) => {
      expect(manifestTables).toContain(table);
    });
  });

  test("All manifest endpoints reference existing registry tables", () => {
    manifest.endpoints.forEach((endpoint) => {
      const schemaExists = registry.schemas.hasOwnProperty(endpoint.schema);
      expect(schemaExists).toBe(true);

      if (schemaExists) {
        const tableExists = registry.schemas[endpoint.schema].tables.hasOwnProperty(
          endpoint.table
        );
        expect(tableExists).toBe(true);
      }
    });
  });

  test("Endpoint methods match registry table methods", () => {
    manifest.endpoints.forEach((endpoint) => {
      const registryTable =
        registry.schemas[endpoint.schema]?.tables[endpoint.table];

      if (registryTable) {
        // Every method in manifest should be in registry
        endpoint.methods.forEach((method) => {
          expect(registryTable.methods).toContain(method);
        });
      }
    });
  });
});

describe("Doctrine Metadata Compliance", () => {
  test("Doctrine metadata version is present", () => {
    expect(registry.doctrine_metadata).toHaveProperty("version");
    expect(registry.doctrine_metadata.version).toBe("STAMPED-SPVPET-v1.0");
  });

  test("Doctrine metadata has validator", () => {
    expect(registry.doctrine_metadata).toHaveProperty("validated_by");
    expect(registry.doctrine_metadata.validated_by).toBe("Barton Validator Agent");
  });

  test("Doctrine enforced fields are defined", () => {
    expect(registry.doctrine_metadata).toHaveProperty("enforced_fields");
    expect(Array.isArray(registry.doctrine_metadata.enforced_fields)).toBe(true);
    expect(registry.doctrine_metadata.enforced_fields).toContain("column_number");
    expect(registry.doctrine_metadata.enforced_fields).toContain("column_description");
    expect(registry.doctrine_metadata.enforced_fields).toContain("column_format");
  });

  test("Manifest doctrine matches registry", () => {
    expect(manifest.metadata.doctrine).toBe("STAMPED");
  });

  test("Manifest validator agent is defined", () => {
    expect(manifest.metadata.validator_agent).toBe("barton-validator");
  });
});

describe("Access Control Configuration", () => {
  test("Access control has required properties", () => {
    expect(registry.access_control).toHaveProperty("default_mode");
    expect(registry.access_control).toHaveProperty("gatekeeper");
    expect(registry.access_control).toHaveProperty("roles");
  });

  test("Default mode is readwrite", () => {
    expect(registry.access_control.default_mode).toBe("readwrite");
  });

  test("Gatekeeper is validator_agent", () => {
    expect(registry.access_control.gatekeeper).toBe("validator_agent");
  });

  test("All expected integration roles are defined", () => {
    const roles = registry.access_control.roles;
    expect(roles).toHaveProperty("n8n");
    expect(roles).toHaveProperty("composio");
    expect(roles).toHaveProperty("builder.io");
    expect(roles).toHaveProperty("lovable.dev");
    expect(roles).toHaveProperty("firebase");
  });

  test("Role permissions are valid", () => {
    const validPermissions = ["read", "write", "readwrite"];

    Object.entries(registry.access_control.roles).forEach(([role, permissions]) => {
      expect(Array.isArray(permissions) || typeof permissions === "string").toBe(true);

      if (Array.isArray(permissions)) {
        permissions.forEach((permission) => {
          expect(validPermissions).toContain(permission);
        });
      } else {
        expect(validPermissions).toContain(permissions);
      }
    });
  });
});

describe("Schema Validation", () => {
  test("Core schema has 3 tables", () => {
    const coreTableCount = Object.keys(registry.schemas.core.tables).length;
    expect(coreTableCount).toBe(3);
  });

  test("Benefits schema has 2 tables", () => {
    const benefitsTableCount = Object.keys(registry.schemas.benefits.tables).length;
    expect(benefitsTableCount).toBe(2);
  });

  test("Compliance schema has 1 table", () => {
    const complianceTableCount = Object.keys(
      registry.schemas.compliance.tables
    ).length;
    expect(complianceTableCount).toBe(1);
  });

  test("Operations schema has 1 table", () => {
    const operationsTableCount = Object.keys(
      registry.schemas.operations.tables
    ).length;
    expect(operationsTableCount).toBe(1);
  });

  test("Staging schema has 2 tables", () => {
    const stagingTableCount = Object.keys(registry.schemas.staging.tables).length;
    expect(stagingTableCount).toBe(2);
  });

  test("Total table count is 9", () => {
    let totalTables = 0;
    Object.values(registry.schemas).forEach((schemaData) => {
      totalTables += Object.keys(schemaData.tables).length;
    });
    expect(totalTables).toBe(9);
  });
});

describe("Edge Cases and Error Handling", () => {
  test("No duplicate table names across schemas", () => {
    const allTableNames = [];

    Object.entries(registry.schemas).forEach(([schemaName, schemaData]) => {
      Object.keys(schemaData.tables).forEach((tableName) => {
        const fullTableName = `${schemaName}.${tableName}`;
        expect(allTableNames).not.toContain(fullTableName);
        allTableNames.push(fullTableName);
      });
    });
  });

  test("No duplicate endpoint paths in manifest", () => {
    const paths = manifest.endpoints.map((e) => e.path);
    const uniquePaths = [...new Set(paths)];
    expect(paths.length).toBe(uniquePaths.length);
  });

  test("All primary keys are non-empty arrays", () => {
    Object.entries(registry.schemas).forEach(([schemaName, schemaData]) => {
      Object.entries(schemaData.tables).forEach(([tableName, tableData]) => {
        expect(tableData.keys.length).toBeGreaterThan(0);
      });
    });
  });
});
