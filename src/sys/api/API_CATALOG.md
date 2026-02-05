# API Endpoint Catalog

**Implementation Date:** 2025-10-23
**Version:** 1.0.0
**Status:** ✅ COMPLETE TRACEABILITY

---

## 🎯 Overview

Complete documentation of every API endpoint in the client-subhive repository. This catalog provides 100% traceability for all HTTP endpoints, their handlers, request/response schemas, and integration points.

## 📊 Endpoint Summary

| Endpoint | Method | Purpose | Handler | Status |
|----------|--------|---------|---------|--------|
| `/api/hello` | GET | Health check | hello.js | ✅ Active |
| `/api/test` | GET | API working test | test.js | ✅ Active |
| `/api/llm` | POST | Multi-provider LLM | llm.js | ✅ Active |
| `/api/subagents` | GET | Subagent registry | subagents.js | ✅ Active |
| `/api/ssot/save` | POST | SSOT processing | ssot/save.js | ✅ Active |

**Total Endpoints:** 5

---

## 📍 Endpoint Details

### 1. Health Check Endpoint

**Route:** `/api/hello`
**Method:** `GET`
**Handler:** `api/hello.js`
**Purpose:** Simple health check to verify API is running

#### Request
```
GET /api/hello
```

No parameters required.

#### Response
```json
{
  "message": "Hello from Vercel!",
  "url": "<request-url>"
}
```

#### Handler Function
```javascript
export default function handler(req, res) {
  res.status(200).json({
    message: 'Hello from Vercel!',
    url: req.url,
  });
}
```

#### Notes
- No authentication required
- CORS enabled (Access-Control-Allow-Origin: *)
- Returns 200 OK on success

---

### 2. API Working Test Endpoint

**Route:** `/api/test`
**Method:** `GET`
**Handler:** `api/test.js`
**Purpose:** Verify API is functional with timestamp

#### Request
```
GET /api/test
```

No parameters required.

#### Response
```json
{
  "message": "API is working!",
  "timestamp": "2025-10-23T12:00:00.000Z"
}
```

#### Handler Function
```javascript
export default function handler(req, res) {
  res.status(200).json({
    message: 'API is working!',
    timestamp: new Date().toISOString(),
  });
}
```

#### Notes
- No authentication required
- CORS enabled (Access-Control-Allow-Origin: *)
- Includes ISO 8601 timestamp
- Returns 200 OK on success

---

### 3. LLM Multi-Provider Endpoint

**Route:** `/api/llm`
**Method:** `POST`
**Handler:** `api/llm.js`
**Purpose:** Process LLM requests with automatic provider selection (Anthropic Claude or OpenAI GPT)

#### Request
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Your prompt here"
    }
  ],
  "provider": "anthropic",
  "model": "claude-3-5-sonnet-20241022",
  "max_tokens": 1024,
  "temperature": 0.7
}
```

**Parameters:**
- `messages` (array, required): Array of message objects with role and content
- `provider` (string, optional): Either "anthropic" or "openai" (auto-detected from model if not provided)
- `model` (string, required): Model identifier (e.g., "claude-3-5-sonnet-20241022", "gpt-4")
- `max_tokens` (number, optional): Maximum tokens in response (default: 1024)
- `temperature` (number, optional): Response randomness 0-1 (default: 0.7)

#### Response
```json
{
  "content": "LLM response text",
  "provider": "anthropic",
  "model": "claude-3-5-sonnet-20241022",
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 50,
    "total_tokens": 60
  }
}
```

#### Error Response
```json
{
  "error": "Error message",
  "details": "Detailed error information"
}
```

#### Handler Function Details

**Supported Providers:**
1. **Anthropic Claude**
   - Environment Variable: `ANTHROPIC_API_KEY`
   - Models: claude-3-5-sonnet-20241022, claude-3-opus, claude-3-sonnet, etc.
   - Auto-detected when model starts with "claude"

2. **OpenAI GPT**
   - Environment Variable: `OPENAI_API_KEY`
   - Models: gpt-4, gpt-3.5-turbo, etc.
   - Auto-detected when model starts with "gpt"

**Provider Selection Logic:**
```javascript
const detectedProvider = provider || (model.toLowerCase().startsWith('claude') ? 'anthropic' : 'openai');
```

**Anthropic Implementation:**
```javascript
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const response = await anthropic.messages.create({
  model,
  max_tokens,
  temperature,
  messages,
});
```

**OpenAI Implementation:**
```javascript
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const response = await openai.chat.completions.create({
  model,
  messages,
  max_tokens,
  temperature,
});
```

#### Environment Variables Required
```bash
ANTHROPIC_API_KEY=your-anthropic-key
OPENAI_API_KEY=your-openai-key
```

#### Notes
- CORS enabled (Access-Control-Allow-Origin: *)
- POST method only
- Returns 400 for missing messages
- Returns 500 for provider errors
- Automatic provider detection based on model name
- Supports both streaming and non-streaming responses
- Token usage tracking included in response

---

### 4. Subagent Registry Endpoint

**Route:** `/api/subagents`
**Method:** `GET`
**Handler:** `api/subagents.js`
**Purpose:** Retrieve available subagent definitions and MCP server integrations

#### Request
```
GET /api/subagents
```

No parameters required.

#### Response
```json
{
  "subagents": [
    {
      "name": "garage-mcp",
      "description": "Garage MCP subagent for vehicle management",
      "capabilities": ["vehicle_lookup", "service_records"],
      "status": "active"
    }
  ],
  "fallback": {
    "name": "default-fallback",
    "description": "Default fallback when no specialized subagent available"
  }
}
```

#### Handler Function Details

**MCP Integration:**
- Connects to garage-mcp server if available
- Provides fallback when MCP unavailable
- Returns list of available subagents with capabilities

**Fallback Behavior:**
```javascript
{
  fallback: {
    name: "default-fallback",
    description: "Default fallback when no specialized subagent available"
  }
}
```

#### Notes
- CORS enabled (Access-Control-Allow-Origin: *)
- No authentication required
- Returns 200 with fallback if MCP servers unavailable
- Used by AI orchestration layer to determine available capabilities

---

### 5. SSOT Save Endpoint

**Route:** `/api/ssot/save`
**Method:** `POST`
**Handler:** `api/ssot/save.js`
**Purpose:** Process and save Single Source of Truth (SSOT) data with HEIR-compliant ID generation

#### Request
```json
{
  "data": {
    "type": "client_intake",
    "payload": {
      "company_name": "Acme Corp",
      "contact_email": "contact@acme.com"
    }
  },
  "metadata": {
    "source": "intake_wizard",
    "timestamp": "2025-10-23T12:00:00.000Z"
  }
}
```

**Parameters:**
- `data` (object, required): Data to be saved
  - `type` (string, required): Type of data being saved
  - `payload` (object, required): Actual data payload
- `metadata` (object, optional): Metadata about the data
  - `source` (string): Source of the data
  - `timestamp` (string): ISO 8601 timestamp

#### Response
```json
{
  "success": true,
  "unique_id": "CLNT-20251023-ABC123456",
  "process_id": "PROC-20251023-XYZ789012",
  "timestamp": "2025-10-23T12:00:00.000Z",
  "heir_altitude": 10,
  "data_saved": true
}
```

#### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "heir_altitude": 20,
  "details": "Detailed error information"
}
```

#### Handler Function Details

**HEIR-Compliant ID Generation:**

1. **Unique ID Format:**
   ```
   CLNT-YYYYMMDD-XXXXXXXXX
   ```
   - Prefix: CLNT (client), PROC (process), etc.
   - Date: YYYYMMDD format
   - Hash: 9-character alphanumeric

2. **Process ID Format:**
   ```
   PROC-YYYYMMDD-XXXXXXXXX
   ```
   - Tracks process execution
   - Links multiple operations

**ID Generation Logic:**
```javascript
function generateHeirId(prefix = 'CLNT') {
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const hash = crypto.randomBytes(5).toString('hex').toUpperCase().substring(0, 9);
  return `${prefix}-${date}-${hash}`;
}
```

**Barton Doctrine Compliance:**
- All IDs follow hierarchical structure
- Date-based prefixes for time-based queries
- Cryptographically secure hash generation
- Consistent format across all data types

**HEIR Altitude Levels:**
- **Level 5:** Data validation errors
- **Level 10:** Successful operations (default)
- **Level 20:** Processing errors
- **Level 30:** Critical system errors

#### Environment Variables Required
```bash
DATABASE_URL=postgresql://...
FIREBASE_PROJECT_ID=client-subhive
```

#### Notes
- CORS enabled (Access-Control-Allow-Origin: *)
- POST method only
- Returns 400 for missing data
- Returns 500 for save errors
- All saves logged with HEIR altitude
- IDs stored in database for traceability
- Supports both PostgreSQL and Firebase/Firestore

---

## 🔧 Configuration

### Base URL

**Production:**
```
https://client-subhive.vercel.app
```

**Development:**
```
http://localhost:3000
```

### CORS Configuration

All endpoints include CORS headers:
```javascript
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
```

### Authentication

**Current Status:** No authentication required

**Planned:** JWT-based authentication for production endpoints

---

## 🔗 Integration Points

### 1. AI Orchestration Layer
- **Endpoints Used:** `/api/llm`, `/api/subagents`
- **Purpose:** Agent processing and capability discovery
- **Location:** `ctb/ai/`

### 2. Data Layer
- **Endpoints Used:** `/api/ssot/save`
- **Purpose:** Database persistence
- **Location:** `ctb/data/`

### 3. UI Layer
- **Endpoints Used:** All endpoints
- **Purpose:** Frontend API consumption
- **Location:** `ctb/ui/`

### 4. MCP Servers
- **Endpoints Used:** `/api/subagents`
- **Purpose:** External service integration
- **Location:** `ctb/sys/mcp-servers/`

---

## 📋 Request/Response Patterns

### Standard Success Response
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "ISO-8601-timestamp"
}
```

### Standard Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": "Detailed information",
  "heir_altitude": 20
}
```

### HTTP Status Codes
- `200` - Success
- `400` - Bad Request (missing parameters)
- `401` - Unauthorized (when auth implemented)
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## 🧪 Testing

### Health Check Test
```bash
curl https://client-subhive.vercel.app/api/hello
```

### API Working Test
```bash
curl https://client-subhive.vercel.app/api/test
```

### LLM Endpoint Test
```bash
curl -X POST https://client-subhive.vercel.app/api/llm \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Hello"}],
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 100
  }'
```

### Subagents Endpoint Test
```bash
curl https://client-subhive.vercel.app/api/subagents
```

### SSOT Save Endpoint Test
```bash
curl -X POST https://client-subhive.vercel.app/api/ssot/save \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "type": "test",
      "payload": {"test": "data"}
    }
  }'
```

---

## 📊 Monitoring

### Endpoint Metrics
- Request count per endpoint
- Response times (p50, p95, p99)
- Error rates
- Token usage (LLM endpoint)

### Logging
- All requests logged to `logs/api/`
- HEIR altitude tracking for errors
- Request/response pairs stored
- Performance metrics captured

---

## 🚀 Deployment

### Vercel Configuration
```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/**/*.js",
      "use": "@vercel/node"
    }
  ]
}
```

### Environment Variables (Production)
```bash
# LLM Providers
ANTHROPIC_API_KEY=...
OPENAI_API_KEY=...

# Database
DATABASE_URL=...
FIREBASE_PROJECT_ID=...
FIREBASE_PRIVATE_KEY=...
FIREBASE_CLIENT_EMAIL=...

# Configuration
NODE_ENV=production
```

---

## 📚 Related Documentation

- **Architecture:** [ctb/docs/architecture.mmd](../../docs/architecture.mmd)
- **System README:** [ctb/sys/README.md](../README.md)
- **Environment Setup:** [ctb/sys/api/.env.example](./. env.example)
- **Database Schema:** [ctb/data/SCHEMA_REFERENCE.md](../../data/SCHEMA_REFERENCE.md)
- **Entry Point:** [ENTRYPOINT.md](../../../ENTRYPOINT.md)

---

**Implementation Status:** ✅ COMPLETE
**Traceability:** ✅ 100%
**Endpoints Documented:** 5/5
**Last Updated:** 2025-10-23
