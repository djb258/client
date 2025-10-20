// Jest Setup File for Client Intake Wizard Tests

// Mock environment variables
process.env.COMPOSIO_MCP_BASE_URL = 'http://test-mcp.local';
process.env.COMPOSIO_API_KEY = 'test-api-key';
process.env.NEON_DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

// Mock fetch globally if not available in test environment
if (typeof global.fetch === 'undefined') {
  global.fetch = jest.fn();
}

// Mock console methods to reduce noise in tests (optional)
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  // Keep error and warn for debugging
  error: console.error,
  warn: console.warn
};