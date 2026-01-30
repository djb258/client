/*
 * CTB Metadata
 * ctb_id: CTB-50072DE59708
 * ctb_branch: ui
 * ctb_path: ui/src/services/firebase/intake-service.ts
 * ctb_version: 1.0.0
 * created: 2025-10-23T16:37:02.216973
 * checksum: c79b5aa0
 */

// Firebase Service Layer for Client Intake Wizard
// Handles Firestore operations and integrates with Composio MCP

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  addDoc
} from 'firebase/firestore';
import { db } from './firebase-config'; // Assume this exports initialized Firestore instance
import {
  CompanyDocument,
  EmployeeDocument,
  IntakeAuditLogDocument
} from '../../firebase/types/firestore';
import {
  validateCompany,
  promoteCompany,
  validateEmployee,
  promoteEmployee,
  createAuditLog
} from '../composio/client-intake';
import { v4 as uuidv4 } from 'uuid';

// =====================================================
// COLLECTION REFERENCES
// =====================================================
const COMPANY_COLLECTION = 'company';
const EMPLOYEE_COLLECTION = 'employee';
const AUDIT_LOG_COLLECTION = 'intake_audit_log';

// =====================================================
// COMPANY OPERATIONS
// =====================================================

/**
 * Create a new company document in Firebase
 */
export async function createCompanyInFirebase(
  companyData: Omit<CompanyDocument, 'company_id' | 'validated' | 'promoted_to_neon' | 'last_touched' | 'created_at'>
): Promise<CompanyDocument> {
  const companyId = uuidv4();
  const now = Timestamp.now();

  const companyDoc: CompanyDocument = {
    company_id: companyId,
    ...companyData,
    validated: false,
    promoted_to_neon: false,
    last_touched: now,
    created_at: now
  };

  const companyRef = doc(db, COMPANY_COLLECTION, companyId);
  await setDoc(companyRef, companyDoc);

  // Log creation
  const auditLog = createAuditLog('company', companyId, 'create', {
    success: true,
    job_id: uuidv4(),
    errors: []
  });
  await addDoc(collection(db, AUDIT_LOG_COLLECTION), auditLog);

  console.log(`[FIREBASE] Company created: ${companyId}`);
  return companyDoc;
}

/**
 * Validate company via Composio and update Firebase
 */
export async function validateCompanyInFirebase(companyId: string): Promise<{ success: boolean; errors: string[] }> {
  const companyRef = doc(db, COMPANY_COLLECTION, companyId);
  const companySnap = await getDoc(companyRef);

  if (!companySnap.exists()) {
    return { success: false, errors: ['Company not found'] };
  }

  const companyDoc = companySnap.data() as CompanyDocument;
  const validationResult = await validateCompany(companyDoc);

  // Update validation status
  await updateDoc(companyRef, {
    validated: validationResult.validated,
    composio_job_id: validationResult.job_id,
    last_touched: Timestamp.now()
  });

  // Log validation attempt
  const auditLog = createAuditLog('company', companyId, 'validate', validationResult);
  await addDoc(collection(db, AUDIT_LOG_COLLECTION), auditLog);

  console.log(`[FIREBASE] Company validation: ${validationResult.success}`);
  return { success: validationResult.success, errors: validationResult.errors };
}

/**
 * Promote company to Neon via Composio
 */
export async function promoteCompanyToNeon(companyId: string): Promise<{ success: boolean; errors: string[]; neon_id?: string }> {
  const companyRef = doc(db, COMPANY_COLLECTION, companyId);
  const companySnap = await getDoc(companyRef);

  if (!companySnap.exists()) {
    return { success: false, errors: ['Company not found'] };
  }

  const companyDoc = companySnap.data() as CompanyDocument;

  if (!companyDoc.validated) {
    return { success: false, errors: ['Company must be validated before promotion'] };
  }

  if (companyDoc.promoted_to_neon) {
    return { success: false, errors: ['Company already promoted to Neon'] };
  }

  const promotionResult = await promoteCompany(companyDoc);

  if (promotionResult.success) {
    // Update promotion status
    await updateDoc(companyRef, {
      promoted_to_neon: true,
      composio_job_id: promotionResult.job_id,
      last_touched: Timestamp.now()
    });
  }

  // Log promotion attempt
  const auditLog = createAuditLog('company', companyId, 'promote', promotionResult);
  await addDoc(collection(db, AUDIT_LOG_COLLECTION), auditLog);

  console.log(`[FIREBASE] Company promotion: ${promotionResult.success}`);
  return {
    success: promotionResult.success,
    errors: promotionResult.errors,
    neon_id: promotionResult.neon_id
  };
}

/**
 * Get company by ID
 */
export async function getCompanyById(companyId: string): Promise<CompanyDocument | null> {
  const companyRef = doc(db, COMPANY_COLLECTION, companyId);
  const companySnap = await getDoc(companyRef);
  return companySnap.exists() ? (companySnap.data() as CompanyDocument) : null;
}

/**
 * Get all companies (optionally filtered by validation/promotion status)
 */
export async function getCompanies(filters?: {
  validated?: boolean;
  promoted_to_neon?: boolean;
}): Promise<CompanyDocument[]> {
  let q = query(collection(db, COMPANY_COLLECTION), orderBy('last_touched', 'desc'));

  if (filters?.validated !== undefined) {
    q = query(q, where('validated', '==', filters.validated));
  }

  if (filters?.promoted_to_neon !== undefined) {
    q = query(q, where('promoted_to_neon', '==', filters.promoted_to_neon));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as CompanyDocument);
}

// =====================================================
// EMPLOYEE OPERATIONS
// =====================================================

/**
 * Create a new employee document in Firebase
 */
export async function createEmployeeInFirebase(
  employeeData: Omit<EmployeeDocument, 'employee_id' | 'validated' | 'promoted_to_neon' | 'last_touched' | 'created_at'>
): Promise<EmployeeDocument> {
  const employeeId = uuidv4();
  const now = Timestamp.now();

  const employeeDoc: EmployeeDocument = {
    employee_id: employeeId,
    ...employeeData,
    validated: false,
    promoted_to_neon: false,
    last_touched: now,
    created_at: now
  };

  const employeeRef = doc(db, EMPLOYEE_COLLECTION, employeeId);
  await setDoc(employeeRef, employeeDoc);

  // Log creation
  const auditLog = createAuditLog('employee', employeeId, 'create', {
    success: true,
    job_id: uuidv4(),
    errors: []
  });
  await addDoc(collection(db, AUDIT_LOG_COLLECTION), auditLog);

  console.log(`[FIREBASE] Employee created: ${employeeId}`);
  return employeeDoc;
}

/**
 * Validate employee via Composio and update Firebase
 */
export async function validateEmployeeInFirebase(employeeId: string): Promise<{ success: boolean; errors: string[] }> {
  const employeeRef = doc(db, EMPLOYEE_COLLECTION, employeeId);
  const employeeSnap = await getDoc(employeeRef);

  if (!employeeSnap.exists()) {
    return { success: false, errors: ['Employee not found'] };
  }

  const employeeDoc = employeeSnap.data() as EmployeeDocument;
  const validationResult = await validateEmployee(employeeDoc);

  // Update validation status
  await updateDoc(employeeRef, {
    validated: validationResult.validated,
    composio_job_id: validationResult.job_id,
    last_touched: Timestamp.now()
  });

  // Log validation attempt
  const auditLog = createAuditLog('employee', employeeId, 'validate', validationResult);
  await addDoc(collection(db, AUDIT_LOG_COLLECTION), auditLog);

  console.log(`[FIREBASE] Employee validation: ${validationResult.success}`);
  return { success: validationResult.success, errors: validationResult.errors };
}

/**
 * Promote employee to Neon via Composio
 */
export async function promoteEmployeeToNeon(employeeId: string): Promise<{ success: boolean; errors: string[]; neon_id?: string }> {
  const employeeRef = doc(db, EMPLOYEE_COLLECTION, employeeId);
  const employeeSnap = await getDoc(employeeRef);

  if (!employeeSnap.exists()) {
    return { success: false, errors: ['Employee not found'] };
  }

  const employeeDoc = employeeSnap.data() as EmployeeDocument;

  if (!employeeDoc.validated) {
    return { success: false, errors: ['Employee must be validated before promotion'] };
  }

  if (employeeDoc.promoted_to_neon) {
    return { success: false, errors: ['Employee already promoted to Neon'] };
  }

  const promotionResult = await promoteEmployee(employeeDoc);

  if (promotionResult.success) {
    // Update promotion status
    await updateDoc(employeeRef, {
      promoted_to_neon: true,
      composio_job_id: promotionResult.job_id,
      last_touched: Timestamp.now()
    });
  }

  // Log promotion attempt
  const auditLog = createAuditLog('employee', employeeId, 'promote', promotionResult);
  await addDoc(collection(db, AUDIT_LOG_COLLECTION), auditLog);

  console.log(`[FIREBASE] Employee promotion: ${promotionResult.success}`);
  return {
    success: promotionResult.success,
    errors: promotionResult.errors,
    neon_id: promotionResult.neon_id
  };
}

/**
 * Get employees by company ID
 */
export async function getEmployeesByCompanyId(companyId: string): Promise<EmployeeDocument[]> {
  const q = query(
    collection(db, EMPLOYEE_COLLECTION),
    where('company_id', '==', companyId),
    orderBy('last_touched', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as EmployeeDocument);
}

/**
 * Batch import employees from CSV
 */
export async function batchImportEmployees(
  companyId: string,
  employees: Omit<EmployeeDocument, 'employee_id' | 'company_id' | 'validated' | 'promoted_to_neon' | 'last_touched' | 'created_at'>[]
): Promise<{ success: number; failed: number; errors: string[] }> {
  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const empData of employees) {
    try {
      await createEmployeeInFirebase({ ...empData, company_id: companyId });
      success++;
    } catch (error) {
      failed++;
      errors.push(
        `Failed to import ${empData.first_name} ${empData.last_name}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  console.log(`[FIREBASE] Batch import: ${success} success, ${failed} failed`);
  return { success, failed, errors };
}