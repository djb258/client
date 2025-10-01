# Client Intake Wizard - Barton Doctrine (IMO + ORBT)

This project scaffolds a complete Client Intake Wizard system that follows the Barton Doctrine principles: Input (manual wizard) → Middle (static Neon schema) → Output (vendor-specific tables).

## 🏗️ Architecture Overview

### Data Flow
1. **Firebase (Firestore)**: Initial intake and staging area
2. **Composio MCP**: Validation and promotion gateway
3. **Neon (PostgreSQL)**: Canonical data storage

### Key Principle
**Every new client MUST flow through this wizard manually. Firebase issues UUIDs at intake; Neon canonizes IDs as permanent.**

---

## 📁 Project Structure

```
client-subhive/
├── db/neon/
│   └── client_subhive_intake.sql         # Neon schema with COMPANY & EMPLOYEE tables
├── firebase/
│   ├── firestore.rules                    # Firestore security rules
│   ├── firestore.indexes.json             # Firestore indexes
│   └── types/
│       └── firestore.ts                   # TypeScript types for all documents
├── src/
│   ├── services/
│   │   ├── composio/
│   │   │   ├── client-intake.ts           # Composio MCP integration
│   │   │   └── __tests__/
│   │   │       └── client-intake.test.ts  # Composio tests
│   │   └── firebase/
│   │       ├── intake-service.ts          # Firebase service layer
│   │       └── __tests__/
│   │           └── intake-service.test.ts # Firebase tests
│   └── components/
│       └── wizard/
│           ├── IntakeWizard.tsx           # Main wizard component
│           ├── WizardProgress.tsx         # Progress indicator
│           └── steps/
│               ├── CompanySetupStep.tsx   # Step 1: Company info
│               ├── HRToneSetupStep.tsx    # Step 2: HR communication style
│               ├── EmployeeIntakeStep.tsx # Step 3: Employee census
│               └── ReviewConfirmStep.tsx  # Step 4: Review & promote
├── composio.config.json                   # Composio MCP endpoint definitions
├── jest.config.js                         # Jest test configuration
└── package.json                           # Updated with test scripts
```

---

## 🗄️ Database Schema

### Neon Tables

#### `client_subhive.company`
| Column | Type | Description |
|--------|------|-------------|
| `company_id` | UUID (PK) | Primary key |
| `company_name` | TEXT | Company name (required) |
| `ein` | TEXT | Employer Identification Number |
| `address` | TEXT | Company address |
| `industry` | TEXT | Industry classification |
| `internal_group_number` | TEXT | Internal group identifier |
| `vendor_group_numbers` | JSONB | Vendor-specific group numbers |
| `renewal_date` | DATE | Benefits renewal date |
| `hr_tone` | JSONB | HR communication style preferences |
| `composio_job_id` | TEXT | Last Composio job ID |
| `validated` | BOOLEAN | Validation status |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

#### `client_subhive.employee`
| Column | Type | Description |
|--------|------|-------------|
| `employee_id` | UUID (PK) | Primary key |
| `company_id` | UUID (FK) | References company |
| `first_name` | TEXT | First name (required) |
| `last_name` | TEXT | Last name (required) |
| `internal_employee_number` | TEXT | Internal employee ID |
| `vendor_employee_ids` | JSONB | Vendor-specific employee IDs |
| `benefit_type` | TEXT | Type of benefit (medical, dental, etc.) |
| `coverage_tier` | TEXT | Coverage level |
| `dependents` | JSONB | Dependent information array |
| `composio_job_id` | TEXT | Last Composio job ID |
| `validated` | BOOLEAN | Validation status |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

#### `client_subhive.intake_audit_log`
Tracks all validation and promotion operations with full audit trail.

---

## 🔥 Firebase Collections

### `company` Collection
Mirrors Neon company structure with additional fields:
- `promoted_to_neon`: boolean
- `last_touched`: timestamp

### `employee` Collection
Mirrors Neon employee structure with additional fields:
- `promoted_to_neon`: boolean
- `last_touched`: timestamp

### `intake_audit_log` Collection
Append-only audit log for all operations.

---

## 🔌 Composio MCP Endpoints

All Neon writes MUST be routed through Composio MCP:

### Company Endpoints
- `POST /mcp/client-intake/company/validate`
- `POST /mcp/client-intake/company/promote`

### Employee Endpoints
- `POST /mcp/client-intake/employee/validate`
- `POST /mcp/client-intake/employee/promote`

Each endpoint returns:
```typescript
{
  success: boolean,
  job_id: string,
  errors: string[],
  promoted_table?: string,
  neon_id?: string
}
```

---

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run verbose
npm run test:verbose
```

### Test Coverage
- **Composio Integration**: Validation, promotion, batch operations
- **Firebase Service**: CRUD operations, validation flows, batch imports
- **Error Handling**: Network errors, validation failures, constraint violations
- **Audit Logging**: All operations tracked with job IDs

---

## 🚀 Usage

### 1. Database Setup
```bash
# Run Neon schema migration
psql $NEON_DATABASE_URL -f db/neon/client_subhive_intake.sql
```

### 2. Environment Variables
```bash
COMPOSIO_MCP_BASE_URL=https://your-mcp-endpoint.com
COMPOSIO_API_KEY=your-api-key
NEON_DATABASE_URL=postgresql://user:pass@host/db
FIREBASE_PROJECT_ID=client_intake
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Start Development Server
```bash
npm run dev
```

### 5. Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules,firestore:indexes
```

---

## 📋 Wizard Flow

### Step 1: Company Setup
- Company name, EIN, address, industry
- Internal group number
- Vendor-specific group numbers
- Renewal date

### Step 2: HR Tone Setup
- Communication tone (formal/professional/friendly/casual)
- Preferred salutation
- Sample phrases
- Communication style notes

### Step 3: Employee Intake
- **CSV Upload**: Bulk import from standardized CSV
- **Manual Entry**: Individual employee records
- Fields: Name, employee number, benefit type, coverage tier, dependents

### Step 4: Review & Confirm
- Review all data
- **Validate** via Composio MCP
- **Promote** to Neon on confirmation
- Real-time progress tracking
- Error handling and rollback

---

## 🔐 Security

### Firestore Rules
- Authenticated users only
- Non-promoted records are editable
- Promoted records are read-only (admin override)
- Audit logs are append-only

### Composio MCP
- API key authentication
- Rate limiting (60/min, 500/hour)
- CORS protection
- Request ID tracking

---

## 📊 Monitoring

### Audit Trail
Every operation is logged with:
- Entity type (company/employee)
- Entity ID
- Action (validate/promote/update/create)
- Composio job ID
- Success/failure status
- Error messages
- Metadata

### Query Examples
```sql
-- Get all audit logs for a company
SELECT * FROM client_subhive.intake_audit_log
WHERE entity_type = 'company' AND entity_id = 'uuid-here'
ORDER BY created_at DESC;

-- Get failed promotions
SELECT * FROM client_subhive.intake_audit_log
WHERE action = 'promote' AND success = false;
```

---

## 🛠️ Development

### TypeScript Types
All types are defined in `firebase/types/firestore.ts`:
- `CompanyDocument`
- `EmployeeDocument`
- `IntakeAuditLogDocument`
- `ComposioValidateResponse`
- `ComposioPromoteResponse`
- `WizardState`

### Service Functions

#### Composio Client (`src/services/composio/client-intake.ts`)
- `validateCompany(doc)`
- `promoteCompany(doc)`
- `validateEmployee(doc)`
- `promoteEmployee(doc)`
- `validateAndPromoteCompany(doc)` - batch operation
- `validateAndPromoteEmployee(doc)` - batch operation

#### Firebase Service (`src/services/firebase/intake-service.ts`)
- `createCompanyInFirebase(data)`
- `validateCompanyInFirebase(id)`
- `promoteCompanyToNeon(id)`
- `createEmployeeInFirebase(data)`
- `validateEmployeeInFirebase(id)`
- `promoteEmployeeToNeon(id)`
- `batchImportEmployees(companyId, employees[])`

---

## 📝 Doctrine Notes

1. **Manual Intake Only**: Every new client flows through this wizard manually
2. **Firebase = Staging**: UUIDs assigned at intake, temporary storage
3. **Neon = Canonical**: Permanent IDs, source of truth
4. **Composio = Gateway**: All Neon writes go through MCP validation
5. **Vendor Tables Later**: Output layer built after intake is complete

---

## 🤝 Contributing

1. All database schema changes must be reviewed
2. All Composio endpoints must have corresponding tests
3. Maintain audit logging for all operations
4. Follow TypeScript strict mode
5. Update this README for architectural changes

---

## 📚 Related Documentation

- [Barton Doctrine Overview](../docs/barton-doctrine.md)
- [Composio MCP Integration](../docs/composio-mcp.md)
- [Neon Schema Design](../docs/neon-schema.md)
- [Firebase Security Rules](../docs/firebase-security.md)

---

## 🐛 Troubleshooting

### Common Issues

**Validation Fails**
- Check Composio MCP endpoint availability
- Verify API key is set correctly
- Review validation errors in audit log

**Promotion Fails**
- Ensure company is validated first
- Check Neon connection string
- Verify no duplicate EIN or company_name

**Firebase Permission Denied**
- Check authentication status
- Review Firestore security rules
- Ensure user has correct role

---

## 📄 License

Proprietary - Internal Use Only

---

**Built with ❤️ under the Barton Doctrine**