// Composio MCP Client Integration for Client Intake Wizard
// All Neon writes MUST be routed through these endpoints

import {
  CompanyDocument,
  EmployeeDocument,
  ComposioValidateResponse,
  ComposioPromoteResponse,
  IntakeAuditLogDocument
} from '../../firebase/types/firestore';
import { v4 as uuidv4 } from 'uuid';

// =====================================================
// CONFIGURATION
// =====================================================
const MCP_BASE_URL = process.env.COMPOSIO_MCP_BASE_URL || 'http://localhost:8080';
const MCP_API_KEY = process.env.COMPOSIO_API_KEY;

interface MCPRequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  body?: any;
  timeout?: number;
}

// =====================================================
// BASE MCP REQUEST HANDLER
// =====================================================
async function mcpRequest<T>(options: MCPRequestOptions): Promise<T> {
  const { method, endpoint, body, timeout = 30000 } = options;
  const url = `${MCP_BASE_URL}${endpoint}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MCP_API_KEY}`,
        'X-Request-ID': uuidv4()
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `MCP request failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`
      );
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`MCP request timed out after ${timeout}ms`);
    }
    throw error;
  }
}

// =====================================================
// COMPANY VALIDATION
// =====================================================
export async function validateCompany(
  companyDoc: Partial<CompanyDocument>
): Promise<ComposioValidateResponse> {
  console.log(`[COMPOSIO] Validating company: ${companyDoc.company_name}`);

  try {
    const response = await mcpRequest<ComposioValidateResponse>({
      method: 'POST',
      endpoint: '/mcp/client-intake/company/validate',
      body: {
        company_id: companyDoc.company_id,
        company_name: companyDoc.company_name,
        ein: companyDoc.ein,
        address: companyDoc.address,
        industry: companyDoc.industry,
        internal_group_number: companyDoc.internal_group_number,
        vendor_group_numbers: companyDoc.vendor_group_numbers || {},
        renewal_date: companyDoc.renewal_date,
        hr_tone: companyDoc.hr_tone || {}
      }
    });

    console.log(`[COMPOSIO] Company validation result: ${response.success}, job_id: ${response.job_id}`);
    return response;
  } catch (error) {
    console.error('[COMPOSIO] Company validation error:', error);
    return {
      success: false,
      job_id: uuidv4(),
      errors: [error instanceof Error ? error.message : 'Unknown validation error'],
      validated: false
    };
  }
}

// =====================================================
// COMPANY PROMOTION
// =====================================================
export async function promoteCompany(
  companyDoc: CompanyDocument
): Promise<ComposioPromoteResponse> {
  console.log(`[COMPOSIO] Promoting company to Neon: ${companyDoc.company_name}`);

  if (!companyDoc.validated) {
    return {
      success: false,
      job_id: uuidv4(),
      errors: ['Company must be validated before promotion'],
      promoted_table: 'company'
    };
  }

  try {
    const response = await mcpRequest<ComposioPromoteResponse>({
      method: 'POST',
      endpoint: '/mcp/client-intake/company/promote',
      body: {
        company_id: companyDoc.company_id,
        firebase_doc: companyDoc
      }
    });

    console.log(`[COMPOSIO] Company promotion result: ${response.success}, neon_id: ${response.neon_id}`);
    return response;
  } catch (error) {
    console.error('[COMPOSIO] Company promotion error:', error);
    return {
      success: false,
      job_id: uuidv4(),
      errors: [error instanceof Error ? error.message : 'Unknown promotion error'],
      promoted_table: 'company'
    };
  }
}

// =====================================================
// EMPLOYEE VALIDATION
// =====================================================
export async function validateEmployee(
  employeeDoc: Partial<EmployeeDocument>
): Promise<ComposioValidateResponse> {
  console.log(`[COMPOSIO] Validating employee: ${employeeDoc.first_name} ${employeeDoc.last_name}`);

  try {
    const response = await mcpRequest<ComposioValidateResponse>({
      method: 'POST',
      endpoint: '/mcp/client-intake/employee/validate',
      body: {
        employee_id: employeeDoc.employee_id,
        company_id: employeeDoc.company_id,
        first_name: employeeDoc.first_name,
        last_name: employeeDoc.last_name,
        internal_employee_number: employeeDoc.internal_employee_number,
        vendor_employee_ids: employeeDoc.vendor_employee_ids || {},
        benefit_type: employeeDoc.benefit_type,
        coverage_tier: employeeDoc.coverage_tier,
        dependents: employeeDoc.dependents || []
      }
    });

    console.log(`[COMPOSIO] Employee validation result: ${response.success}, job_id: ${response.job_id}`);
    return response;
  } catch (error) {
    console.error('[COMPOSIO] Employee validation error:', error);
    return {
      success: false,
      job_id: uuidv4(),
      errors: [error instanceof Error ? error.message : 'Unknown validation error'],
      validated: false
    };
  }
}

// =====================================================
// EMPLOYEE PROMOTION
// =====================================================
export async function promoteEmployee(
  employeeDoc: EmployeeDocument
): Promise<ComposioPromoteResponse> {
  console.log(`[COMPOSIO] Promoting employee to Neon: ${employeeDoc.first_name} ${employeeDoc.last_name}`);

  if (!employeeDoc.validated) {
    return {
      success: false,
      job_id: uuidv4(),
      errors: ['Employee must be validated before promotion'],
      promoted_table: 'employee'
    };
  }

  try {
    const response = await mcpRequest<ComposioPromoteResponse>({
      method: 'POST',
      endpoint: '/mcp/client-intake/employee/promote',
      body: {
        employee_id: employeeDoc.employee_id,
        firebase_doc: employeeDoc
      }
    });

    console.log(`[COMPOSIO] Employee promotion result: ${response.success}, neon_id: ${response.neon_id}`);
    return response;
  } catch (error) {
    console.error('[COMPOSIO] Employee promotion error:', error);
    return {
      success: false,
      job_id: uuidv4(),
      errors: [error instanceof Error ? error.message : 'Unknown promotion error'],
      promoted_table: 'employee'
    };
  }
}

// =====================================================
// AUDIT LOG HELPER
// =====================================================
export function createAuditLog(
  entityType: 'company' | 'employee',
  entityId: string,
  action: 'validate' | 'promote' | 'update' | 'create',
  result: ComposioValidateResponse | ComposioPromoteResponse,
  metadata: Record<string, any> = {}
): IntakeAuditLogDocument {
  return {
    log_id: uuidv4(),
    entity_type: entityType,
    entity_id: entityId,
    action,
    composio_job_id: result.job_id,
    success: result.success,
    errors: result.errors,
    metadata,
    created_at: new Date()
  };
}

// =====================================================
// BATCH OPERATIONS
// =====================================================
export async function validateAndPromoteCompany(
  companyDoc: CompanyDocument
): Promise<{ validated: boolean; promoted: boolean; errors: string[]; job_ids: string[] }> {
  const errors: string[] = [];
  const job_ids: string[] = [];

  // Step 1: Validate
  const validateResult = await validateCompany(companyDoc);
  job_ids.push(validateResult.job_id);

  if (!validateResult.success) {
    errors.push(...validateResult.errors);
    return { validated: false, promoted: false, errors, job_ids };
  }

  // Step 2: Promote
  const promoteResult = await promoteCompany({ ...companyDoc, validated: true });
  job_ids.push(promoteResult.job_id);

  if (!promoteResult.success) {
    errors.push(...promoteResult.errors);
    return { validated: true, promoted: false, errors, job_ids };
  }

  return { validated: true, promoted: true, errors, job_ids };
}

export async function validateAndPromoteEmployee(
  employeeDoc: EmployeeDocument
): Promise<{ validated: boolean; promoted: boolean; errors: string[]; job_ids: string[] }> {
  const errors: string[] = [];
  const job_ids: string[] = [];

  // Step 1: Validate
  const validateResult = await validateEmployee(employeeDoc);
  job_ids.push(validateResult.job_id);

  if (!validateResult.success) {
    errors.push(...validateResult.errors);
    return { validated: false, promoted: false, errors, job_ids };
  }

  // Step 2: Promote
  const promoteResult = await promoteEmployee({ ...employeeDoc, validated: true });
  job_ids.push(promoteResult.job_id);

  if (!promoteResult.success) {
    errors.push(...promoteResult.errors);
    return { validated: true, promoted: false, errors, job_ids };
  }

  return { validated: true, promoted: true, errors, job_ids };
}