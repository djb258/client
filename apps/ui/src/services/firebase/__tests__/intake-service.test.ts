// Jest Unit Tests for Firebase Intake Service

import {
  createCompanyInFirebase,
  validateCompanyInFirebase,
  promoteCompanyToNeon,
  getCompanyById,
  getCompanies,
  createEmployeeInFirebase,
  validateEmployeeInFirebase,
  promoteEmployeeToNeon,
  getEmployeesByCompanyId,
  batchImportEmployees
} from '../intake-service';
import * as composioClient from '../../composio/client-intake';
import {
  CompanyDocument,
  EmployeeDocument,
  ComposioValidateResponse,
  ComposioPromoteResponse
} from '../../../firebase/types/firestore';

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  addDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({ seconds: 1234567890, nanoseconds: 0 }))
  }
}));

// Mock Composio client
jest.mock('../../composio/client-intake');

// Mock Firebase config
jest.mock('../firebase-config', () => ({
  db: {}
}));

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  getDocs,
  Timestamp
} from 'firebase/firestore';

describe('Firebase Intake Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =====================================================
  // COMPANY CREATION TESTS
  // =====================================================
  describe('createCompanyInFirebase', () => {
    it('should create a new company document', async () => {
      const companyData = {
        company_name: 'Test Corp',
        ein: '12-3456789',
        address: '123 Main St',
        industry: 'Tech',
        internal_group_number: 'GRP-001',
        vendor_group_numbers: { vendor_a: 'ABC123' },
        hr_tone: { tone: 'professional' as const }
      };

      (setDoc as jest.Mock).mockResolvedValueOnce(undefined);
      (addDoc as jest.Mock).mockResolvedValueOnce({ id: 'audit-log-id' });

      const result = await createCompanyInFirebase(companyData);

      expect(result.company_name).toBe('Test Corp');
      expect(result.validated).toBe(false);
      expect(result.promoted_to_neon).toBe(false);
      expect(result.company_id).toBeDefined();
      expect(setDoc).toHaveBeenCalled();
      expect(addDoc).toHaveBeenCalled(); // Audit log
    });

    it('should assign UUID and timestamps', async () => {
      const companyData = {
        company_name: 'Test Corp',
        vendor_group_numbers: {},
        hr_tone: {}
      };

      (setDoc as jest.Mock).mockResolvedValueOnce(undefined);
      (addDoc as jest.Mock).mockResolvedValueOnce({ id: 'audit-log-id' });

      const result = await createCompanyInFirebase(companyData);

      expect(result.company_id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      );
      expect(result.last_touched).toBeDefined();
      expect(result.created_at).toBeDefined();
    });
  });

  // =====================================================
  // COMPANY VALIDATION TESTS
  // =====================================================
  describe('validateCompanyInFirebase', () => {
    const mockCompanyDoc: CompanyDocument = {
      company_id: 'test-company-id',
      company_name: 'Test Corp',
      ein: '12-3456789',
      address: '123 Main St',
      industry: 'Tech',
      internal_group_number: 'GRP-001',
      vendor_group_numbers: {},
      hr_tone: {},
      validated: false,
      promoted_to_neon: false,
      last_touched: new Date(),
      created_at: new Date()
    };

    it('should validate existing company', async () => {
      (getDoc as jest.Mock).mockResolvedValueOnce({
        exists: () => true,
        data: () => mockCompanyDoc
      });

      const mockValidationResult: ComposioValidateResponse = {
        success: true,
        job_id: 'job-123',
        errors: [],
        validated: true
      };

      jest.spyOn(composioClient, 'validateCompany').mockResolvedValueOnce(mockValidationResult);
      (updateDoc as jest.Mock).mockResolvedValueOnce(undefined);
      (addDoc as jest.Mock).mockResolvedValueOnce({ id: 'audit-log-id' });

      const result = await validateCompanyInFirebase('test-company-id');

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(updateDoc).toHaveBeenCalled();
      expect(addDoc).toHaveBeenCalled();
    });

    it('should return error if company not found', async () => {
      (getDoc as jest.Mock).mockResolvedValueOnce({
        exists: () => false
      });

      const result = await validateCompanyInFirebase('non-existent-id');

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Company not found');
    });

    it('should handle validation failures', async () => {
      (getDoc as jest.Mock).mockResolvedValueOnce({
        exists: () => true,
        data: () => mockCompanyDoc
      });

      const mockValidationResult: ComposioValidateResponse = {
        success: false,
        job_id: 'job-456',
        errors: ['EIN format invalid'],
        validated: false
      };

      jest.spyOn(composioClient, 'validateCompany').mockResolvedValueOnce(mockValidationResult);
      (updateDoc as jest.Mock).mockResolvedValueOnce(undefined);
      (addDoc as jest.Mock).mockResolvedValueOnce({ id: 'audit-log-id' });

      const result = await validateCompanyInFirebase('test-company-id');

      expect(result.success).toBe(false);
      expect(result.errors).toContain('EIN format invalid');
    });
  });

  // =====================================================
  // COMPANY PROMOTION TESTS
  // =====================================================
  describe('promoteCompanyToNeon', () => {
    const mockCompanyDoc: CompanyDocument = {
      company_id: 'test-company-id',
      company_name: 'Test Corp',
      ein: '12-3456789',
      address: '123 Main St',
      industry: 'Tech',
      internal_group_number: 'GRP-001',
      vendor_group_numbers: {},
      hr_tone: {},
      validated: true,
      promoted_to_neon: false,
      last_touched: new Date(),
      created_at: new Date()
    };

    it('should promote validated company to Neon', async () => {
      (getDoc as jest.Mock).mockResolvedValueOnce({
        exists: () => true,
        data: () => mockCompanyDoc
      });

      const mockPromoteResult: ComposioPromoteResponse = {
        success: true,
        job_id: 'promo-job-789',
        errors: [],
        promoted_table: 'company',
        neon_id: 'neon-uuid-123'
      };

      jest.spyOn(composioClient, 'promoteCompany').mockResolvedValueOnce(mockPromoteResult);
      (updateDoc as jest.Mock).mockResolvedValueOnce(undefined);
      (addDoc as jest.Mock).mockResolvedValueOnce({ id: 'audit-log-id' });

      const result = await promoteCompanyToNeon('test-company-id');

      expect(result.success).toBe(true);
      expect(result.neon_id).toBe('neon-uuid-123');
      expect(updateDoc).toHaveBeenCalled();
    });

    it('should reject promotion if not validated', async () => {
      const unvalidatedCompany = { ...mockCompanyDoc, validated: false };

      (getDoc as jest.Mock).mockResolvedValueOnce({
        exists: () => true,
        data: () => unvalidatedCompany
      });

      const result = await promoteCompanyToNeon('test-company-id');

      expect(result.success).toBe(false);
      expect(result.errors).toContain('must be validated');
    });

    it('should reject promotion if already promoted', async () => {
      const promotedCompany = { ...mockCompanyDoc, promoted_to_neon: true };

      (getDoc as jest.Mock).mockResolvedValueOnce({
        exists: () => true,
        data: () => promotedCompany
      });

      const result = await promoteCompanyToNeon('test-company-id');

      expect(result.success).toBe(false);
      expect(result.errors).toContain('already promoted');
    });
  });

  // =====================================================
  // EMPLOYEE CREATION TESTS
  // =====================================================
  describe('createEmployeeInFirebase', () => {
    it('should create a new employee document', async () => {
      const employeeData = {
        company_id: 'company-123',
        first_name: 'John',
        last_name: 'Doe',
        internal_employee_number: 'EMP-001',
        vendor_employee_ids: { vendor_a: 'VEMP001' },
        benefit_type: 'medical',
        coverage_tier: 'employee+spouse' as const,
        dependents: []
      };

      (setDoc as jest.Mock).mockResolvedValueOnce(undefined);
      (addDoc as jest.Mock).mockResolvedValueOnce({ id: 'audit-log-id' });

      const result = await createEmployeeInFirebase(employeeData);

      expect(result.first_name).toBe('John');
      expect(result.last_name).toBe('Doe');
      expect(result.validated).toBe(false);
      expect(result.promoted_to_neon).toBe(false);
      expect(result.employee_id).toBeDefined();
      expect(setDoc).toHaveBeenCalled();
    });
  });

  // =====================================================
  // EMPLOYEE VALIDATION TESTS
  // =====================================================
  describe('validateEmployeeInFirebase', () => {
    const mockEmployeeDoc: EmployeeDocument = {
      employee_id: 'test-emp-id',
      company_id: 'company-123',
      first_name: 'John',
      last_name: 'Doe',
      vendor_employee_ids: {},
      dependents: [],
      validated: false,
      promoted_to_neon: false,
      last_touched: new Date(),
      created_at: new Date()
    };

    it('should validate existing employee', async () => {
      (getDoc as jest.Mock).mockResolvedValueOnce({
        exists: () => true,
        data: () => mockEmployeeDoc
      });

      const mockValidationResult: ComposioValidateResponse = {
        success: true,
        job_id: 'emp-job-123',
        errors: [],
        validated: true
      };

      jest.spyOn(composioClient, 'validateEmployee').mockResolvedValueOnce(mockValidationResult);
      (updateDoc as jest.Mock).mockResolvedValueOnce(undefined);
      (addDoc as jest.Mock).mockResolvedValueOnce({ id: 'audit-log-id' });

      const result = await validateEmployeeInFirebase('test-emp-id');

      expect(result.success).toBe(true);
      expect(updateDoc).toHaveBeenCalled();
    });

    it('should return error if employee not found', async () => {
      (getDoc as jest.Mock).mockResolvedValueOnce({
        exists: () => false
      });

      const result = await validateEmployeeInFirebase('non-existent-id');

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Employee not found');
    });
  });

  // =====================================================
  // BATCH IMPORT TESTS
  // =====================================================
  describe('batchImportEmployees', () => {
    it('should import multiple employees', async () => {
      const employees = [
        {
          first_name: 'John',
          last_name: 'Doe',
          vendor_employee_ids: {},
          dependents: []
        },
        {
          first_name: 'Jane',
          last_name: 'Smith',
          vendor_employee_ids: {},
          dependents: []
        }
      ];

      (setDoc as jest.Mock).mockResolvedValue(undefined);
      (addDoc as jest.Mock).mockResolvedValue({ id: 'audit-log-id' });

      const result = await batchImportEmployees('company-123', employees);

      expect(result.success).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(setDoc).toHaveBeenCalledTimes(2);
    });

    it('should handle partial failures', async () => {
      const employees = [
        {
          first_name: 'John',
          last_name: 'Doe',
          vendor_employee_ids: {},
          dependents: []
        },
        {
          first_name: 'Jane',
          last_name: 'Smith',
          vendor_employee_ids: {},
          dependents: []
        }
      ];

      (setDoc as jest.Mock)
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('Database error'));
      (addDoc as jest.Mock).mockResolvedValue({ id: 'audit-log-id' });

      const result = await batchImportEmployees('company-123', employees);

      expect(result.success).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Jane Smith');
    });
  });

  // =====================================================
  // QUERY TESTS
  // =====================================================
  describe('getCompanyById', () => {
    it('should retrieve company by ID', async () => {
      const mockCompany: CompanyDocument = {
        company_id: 'company-123',
        company_name: 'Test Corp',
        ein: '12-3456789',
        vendor_group_numbers: {},
        hr_tone: {},
        validated: true,
        promoted_to_neon: false,
        last_touched: new Date(),
        created_at: new Date()
      };

      (getDoc as jest.Mock).mockResolvedValueOnce({
        exists: () => true,
        data: () => mockCompany
      });

      const result = await getCompanyById('company-123');

      expect(result).toEqual(mockCompany);
    });

    it('should return null if company not found', async () => {
      (getDoc as jest.Mock).mockResolvedValueOnce({
        exists: () => false
      });

      const result = await getCompanyById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getEmployeesByCompanyId', () => {
    it('should retrieve all employees for a company', async () => {
      const mockEmployees: EmployeeDocument[] = [
        {
          employee_id: 'emp-1',
          company_id: 'company-123',
          first_name: 'John',
          last_name: 'Doe',
          vendor_employee_ids: {},
          dependents: [],
          validated: true,
          promoted_to_neon: false,
          last_touched: new Date(),
          created_at: new Date()
        },
        {
          employee_id: 'emp-2',
          company_id: 'company-123',
          first_name: 'Jane',
          last_name: 'Smith',
          vendor_employee_ids: {},
          dependents: [],
          validated: true,
          promoted_to_neon: false,
          last_touched: new Date(),
          created_at: new Date()
        }
      ];

      (getDocs as jest.Mock).mockResolvedValueOnce({
        docs: mockEmployees.map(emp => ({
          data: () => emp
        }))
      });

      const result = await getEmployeesByCompanyId('company-123');

      expect(result).toHaveLength(2);
      expect(result[0].first_name).toBe('John');
      expect(result[1].first_name).toBe('Jane');
    });
  });
});