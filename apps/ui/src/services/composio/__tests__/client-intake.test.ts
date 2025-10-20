// Jest Unit Tests for Composio Client Intake Functions

import {
  validateCompany,
  promoteCompany,
  validateEmployee,
  promoteEmployee,
  createAuditLog,
  validateAndPromoteCompany,
  validateAndPromoteEmployee
} from '../client-intake';
import {
  CompanyDocument,
  EmployeeDocument,
  ComposioValidateResponse,
  ComposioPromoteResponse
} from '../../../firebase/types/firestore';

// Mock fetch globally
global.fetch = jest.fn();

describe('Client Intake Composio Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.COMPOSIO_MCP_BASE_URL = 'http://test-mcp.local';
    process.env.COMPOSIO_API_KEY = 'test-api-key';
  });

  // =====================================================
  // COMPANY VALIDATION TESTS
  // =====================================================
  describe('validateCompany', () => {
    const mockCompanyDoc: Partial<CompanyDocument> = {
      company_id: '123e4567-e89b-12d3-a456-426614174000',
      company_name: 'Test Company',
      ein: '12-3456789',
      address: '123 Test St',
      industry: 'Technology',
      internal_group_number: 'GRP-001',
      vendor_group_numbers: { vendor_a: 'ABC123' },
      hr_tone: { tone: 'professional' }
    };

    it('should successfully validate a company', async () => {
      const mockResponse: ComposioValidateResponse = {
        success: true,
        job_id: 'job-123',
        errors: [],
        validated: true
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await validateCompany(mockCompanyDoc);

      expect(result.success).toBe(true);
      expect(result.validated).toBe(true);
      expect(result.job_id).toBe('job-123');
      expect(result.errors).toHaveLength(0);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://test-mcp.local/mcp/client-intake/company/validate',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-api-key'
          })
        })
      );
    });

    it('should handle validation errors', async () => {
      const mockResponse: ComposioValidateResponse = {
        success: false,
        job_id: 'job-456',
        errors: ['EIN format invalid', 'Company name too short'],
        validated: false
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await validateCompany(mockCompanyDoc);

      expect(result.success).toBe(false);
      expect(result.validated).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors).toContain('EIN format invalid');
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      const result = await validateCompany(mockCompanyDoc);

      expect(result.success).toBe(false);
      expect(result.validated).toBe(false);
      expect(result.errors[0]).toContain('Network error');
    });

    it('should handle HTTP errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Server error' })
      });

      const result = await validateCompany(mockCompanyDoc);

      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('500');
    });
  });

  // =====================================================
  // COMPANY PROMOTION TESTS
  // =====================================================
  describe('promoteCompany', () => {
    const mockCompanyDoc: CompanyDocument = {
      company_id: '123e4567-e89b-12d3-a456-426614174000',
      company_name: 'Test Company',
      ein: '12-3456789',
      address: '123 Test St',
      industry: 'Technology',
      internal_group_number: 'GRP-001',
      vendor_group_numbers: { vendor_a: 'ABC123' },
      hr_tone: { tone: 'professional' },
      validated: true,
      promoted_to_neon: false,
      last_touched: new Date(),
      created_at: new Date()
    };

    it('should successfully promote a validated company', async () => {
      const mockResponse: ComposioPromoteResponse = {
        success: true,
        job_id: 'job-789',
        errors: [],
        promoted_table: 'company',
        neon_id: 'neon-uuid-123'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await promoteCompany(mockCompanyDoc);

      expect(result.success).toBe(true);
      expect(result.promoted_table).toBe('company');
      expect(result.neon_id).toBe('neon-uuid-123');
      expect(result.errors).toHaveLength(0);
    });

    it('should reject promotion of non-validated company', async () => {
      const invalidCompanyDoc = { ...mockCompanyDoc, validated: false };

      const result = await promoteCompany(invalidCompanyDoc);

      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('must be validated');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle promotion errors', async () => {
      const mockResponse: ComposioPromoteResponse = {
        success: false,
        job_id: 'job-999',
        errors: ['Company already exists in Neon'],
        promoted_table: 'company'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await promoteCompany(mockCompanyDoc);

      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('already exists');
    });
  });

  // =====================================================
  // EMPLOYEE VALIDATION TESTS
  // =====================================================
  describe('validateEmployee', () => {
    const mockEmployeeDoc: Partial<EmployeeDocument> = {
      employee_id: '456e7890-e89b-12d3-a456-426614174001',
      company_id: '123e4567-e89b-12d3-a456-426614174000',
      first_name: 'John',
      last_name: 'Doe',
      internal_employee_number: 'EMP-001',
      vendor_employee_ids: { vendor_a: 'VEMP001' },
      benefit_type: 'medical',
      coverage_tier: 'employee+spouse',
      dependents: [{ name: 'Jane Doe', relationship: 'spouse', dob: '1990-01-01' }]
    };

    it('should successfully validate an employee', async () => {
      const mockResponse: ComposioValidateResponse = {
        success: true,
        job_id: 'job-emp-123',
        errors: [],
        validated: true
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await validateEmployee(mockEmployeeDoc);

      expect(result.success).toBe(true);
      expect(result.validated).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle missing required fields', async () => {
      const mockResponse: ComposioValidateResponse = {
        success: false,
        job_id: 'job-emp-456',
        errors: ['first_name is required', 'last_name is required'],
        validated: false
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const incompleteEmployee = { ...mockEmployeeDoc, first_name: '', last_name: '' };
      const result = await validateEmployee(incompleteEmployee);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(2);
    });
  });

  // =====================================================
  // EMPLOYEE PROMOTION TESTS
  // =====================================================
  describe('promoteEmployee', () => {
    const mockEmployeeDoc: EmployeeDocument = {
      employee_id: '456e7890-e89b-12d3-a456-426614174001',
      company_id: '123e4567-e89b-12d3-a456-426614174000',
      first_name: 'John',
      last_name: 'Doe',
      internal_employee_number: 'EMP-001',
      vendor_employee_ids: { vendor_a: 'VEMP001' },
      benefit_type: 'medical',
      coverage_tier: 'employee+spouse',
      dependents: [{ name: 'Jane Doe', relationship: 'spouse', dob: '1990-01-01' }],
      validated: true,
      promoted_to_neon: false,
      last_touched: new Date(),
      created_at: new Date()
    };

    it('should successfully promote a validated employee', async () => {
      const mockResponse: ComposioPromoteResponse = {
        success: true,
        job_id: 'job-emp-789',
        errors: [],
        promoted_table: 'employee',
        neon_id: 'neon-emp-uuid-123'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await promoteEmployee(mockEmployeeDoc);

      expect(result.success).toBe(true);
      expect(result.neon_id).toBe('neon-emp-uuid-123');
    });

    it('should reject promotion of non-validated employee', async () => {
      const invalidEmployeeDoc = { ...mockEmployeeDoc, validated: false };

      const result = await promoteEmployee(invalidEmployeeDoc);

      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('must be validated');
    });
  });

  // =====================================================
  // AUDIT LOG TESTS
  // =====================================================
  describe('createAuditLog', () => {
    it('should create audit log for validation', () => {
      const mockResult: ComposioValidateResponse = {
        success: true,
        job_id: 'job-123',
        errors: [],
        validated: true
      };

      const log = createAuditLog('company', 'company-id-123', 'validate', mockResult, {
        user: 'test-user'
      });

      expect(log.entity_type).toBe('company');
      expect(log.entity_id).toBe('company-id-123');
      expect(log.action).toBe('validate');
      expect(log.composio_job_id).toBe('job-123');
      expect(log.success).toBe(true);
      expect(log.metadata.user).toBe('test-user');
    });

    it('should create audit log for failed promotion', () => {
      const mockResult: ComposioPromoteResponse = {
        success: false,
        job_id: 'job-456',
        errors: ['Promotion failed'],
        promoted_table: 'employee'
      };

      const log = createAuditLog('employee', 'emp-id-456', 'promote', mockResult);

      expect(log.success).toBe(false);
      expect(log.errors).toContain('Promotion failed');
    });
  });

  // =====================================================
  // BATCH OPERATIONS TESTS
  // =====================================================
  describe('validateAndPromoteCompany', () => {
    const mockCompanyDoc: CompanyDocument = {
      company_id: '123e4567-e89b-12d3-a456-426614174000',
      company_name: 'Test Company',
      ein: '12-3456789',
      address: '123 Test St',
      industry: 'Technology',
      internal_group_number: 'GRP-001',
      vendor_group_numbers: {},
      hr_tone: {},
      validated: false,
      promoted_to_neon: false,
      last_touched: new Date(),
      created_at: new Date()
    };

    it('should validate and promote company in sequence', async () => {
      // Mock validation response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          job_id: 'val-job-123',
          errors: [],
          validated: true
        })
      });

      // Mock promotion response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          job_id: 'promo-job-456',
          errors: [],
          promoted_table: 'company',
          neon_id: 'neon-123'
        })
      });

      const result = await validateAndPromoteCompany(mockCompanyDoc);

      expect(result.validated).toBe(true);
      expect(result.promoted).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.job_ids).toHaveLength(2);
    });

    it('should stop on validation failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          job_id: 'val-job-789',
          errors: ['Validation error'],
          validated: false
        })
      });

      const result = await validateAndPromoteCompany(mockCompanyDoc);

      expect(result.validated).toBe(false);
      expect(result.promoted).toBe(false);
      expect(result.errors).toContain('Validation error');
      expect(result.job_ids).toHaveLength(1); // Only validation job
    });
  });

  describe('validateAndPromoteEmployee', () => {
    const mockEmployeeDoc: EmployeeDocument = {
      employee_id: '456e7890-e89b-12d3-a456-426614174001',
      company_id: '123e4567-e89b-12d3-a456-426614174000',
      first_name: 'John',
      last_name: 'Doe',
      vendor_employee_ids: {},
      dependents: [],
      validated: false,
      promoted_to_neon: false,
      last_touched: new Date(),
      created_at: new Date()
    };

    it('should validate and promote employee in sequence', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            job_id: 'emp-val-123',
            errors: [],
            validated: true
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            job_id: 'emp-promo-456',
            errors: [],
            promoted_table: 'employee',
            neon_id: 'neon-emp-123'
          })
        });

      const result = await validateAndPromoteEmployee(mockEmployeeDoc);

      expect(result.validated).toBe(true);
      expect(result.promoted).toBe(true);
      expect(result.job_ids).toHaveLength(2);
    });
  });
});