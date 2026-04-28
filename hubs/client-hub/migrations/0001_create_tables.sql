PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS person (
  person_id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  ssn_hash TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES client(client_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_person_client_id ON person(client_id);

CREATE TABLE IF NOT EXISTS employee_error (
  employee_error_id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  source_entity TEXT NOT NULL,
  source_id TEXT,
  error_code TEXT NOT NULL,
  error_message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'error' CHECK (severity IN ('warning', 'error', 'critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),
  context TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES client(client_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_employee_error_client_id ON employee_error(client_id);
CREATE INDEX IF NOT EXISTS idx_employee_error_status ON employee_error(status);

CREATE TABLE IF NOT EXISTS election (
  election_id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  person_id TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  coverage_tier TEXT NOT NULL CHECK (coverage_tier IN ('EE', 'ES', 'EC', 'FAM')),
  effective_date TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES client(client_id) ON DELETE CASCADE,
  FOREIGN KEY (person_id) REFERENCES person(person_id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES plan(plan_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_election_client_id ON election(client_id);
CREATE INDEX IF NOT EXISTS idx_election_person_id ON election(person_id);
CREATE INDEX IF NOT EXISTS idx_election_plan_id ON election(plan_id);

CREATE TABLE IF NOT EXISTS enrollment_intake (
  enrollment_intake_id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  upload_date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES client(client_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_enrollment_intake_client_id ON enrollment_intake(client_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_intake_status ON enrollment_intake(status);

CREATE TABLE IF NOT EXISTS intake_record (
  intake_record_id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  enrollment_intake_id TEXT NOT NULL,
  raw_payload TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES client(client_id) ON DELETE CASCADE,
  FOREIGN KEY (enrollment_intake_id) REFERENCES enrollment_intake(enrollment_intake_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_intake_record_client_id ON intake_record(client_id);
CREATE INDEX IF NOT EXISTS idx_intake_record_enrollment_intake_id ON intake_record(enrollment_intake_id);

CREATE TABLE IF NOT EXISTS vendor (
  vendor_id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  vendor_name TEXT NOT NULL,
  vendor_type TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES client(client_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_vendor_client_id ON vendor(client_id);

CREATE TABLE IF NOT EXISTS vendor_error (
  vendor_error_id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  source_entity TEXT NOT NULL,
  source_id TEXT,
  error_code TEXT NOT NULL,
  error_message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'error' CHECK (severity IN ('warning', 'error', 'critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),
  context TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES client(client_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_vendor_error_client_id ON vendor_error(client_id);
CREATE INDEX IF NOT EXISTS idx_vendor_error_status ON vendor_error(status);

CREATE TABLE IF NOT EXISTS external_identity_map (
  external_identity_id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('person', 'plan')),
  internal_id TEXT NOT NULL,
  vendor_id TEXT NOT NULL,
  external_id_value TEXT NOT NULL,
  effective_date TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES client(client_id) ON DELETE CASCADE,
  FOREIGN KEY (vendor_id) REFERENCES vendor(vendor_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_external_identity_map_client_id ON external_identity_map(client_id);
CREATE INDEX IF NOT EXISTS idx_external_identity_map_vendor_id ON external_identity_map(vendor_id);
CREATE INDEX IF NOT EXISTS idx_external_identity_map_internal_id ON external_identity_map(internal_id);

CREATE TABLE IF NOT EXISTS invoice (
  invoice_id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  vendor_id TEXT NOT NULL,
  invoice_number TEXT NOT NULL,
  amount REAL NOT NULL,
  invoice_date TEXT NOT NULL,
  due_date TEXT,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'approved', 'paid', 'disputed')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES client(client_id) ON DELETE CASCADE,
  FOREIGN KEY (vendor_id) REFERENCES vendor(vendor_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_invoice_client_id ON invoice(client_id);
CREATE INDEX IF NOT EXISTS idx_invoice_vendor_id ON invoice(vendor_id);
CREATE INDEX IF NOT EXISTS idx_invoice_status ON invoice(status);

CREATE TABLE IF NOT EXISTS service_request (
  service_request_id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  opened_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES client(client_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_service_request_client_id ON service_request(client_id);
CREATE INDEX IF NOT EXISTS idx_service_request_status ON service_request(status);

CREATE TABLE IF NOT EXISTS service_error (
  service_error_id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  source_entity TEXT NOT NULL,
  source_id TEXT,
  error_code TEXT NOT NULL,
  error_message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'error' CHECK (severity IN ('warning', 'error', 'critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),
  context TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES client(client_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_service_error_client_id ON service_error(client_id);
CREATE INDEX IF NOT EXISTS idx_service_error_status ON service_error(status);

CREATE TRIGGER IF NOT EXISTS trg_person_updated_at
AFTER UPDATE ON person
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE person
  SET updated_at = CURRENT_TIMESTAMP
  WHERE person_id = OLD.person_id;
END;

CREATE TRIGGER IF NOT EXISTS trg_election_updated_at
AFTER UPDATE ON election
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE election
  SET updated_at = CURRENT_TIMESTAMP
  WHERE election_id = OLD.election_id;
END;

CREATE TRIGGER IF NOT EXISTS trg_enrollment_intake_updated_at
AFTER UPDATE ON enrollment_intake
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE enrollment_intake
  SET updated_at = CURRENT_TIMESTAMP
  WHERE enrollment_intake_id = OLD.enrollment_intake_id;
END;

CREATE TRIGGER IF NOT EXISTS trg_vendor_updated_at
AFTER UPDATE ON vendor
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE vendor
  SET updated_at = CURRENT_TIMESTAMP
  WHERE vendor_id = OLD.vendor_id;
END;

CREATE TRIGGER IF NOT EXISTS trg_external_identity_map_updated_at
AFTER UPDATE ON external_identity_map
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE external_identity_map
  SET updated_at = CURRENT_TIMESTAMP
  WHERE external_identity_id = OLD.external_identity_id;
END;

CREATE TRIGGER IF NOT EXISTS trg_invoice_updated_at
AFTER UPDATE ON invoice
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE invoice
  SET updated_at = CURRENT_TIMESTAMP
  WHERE invoice_id = OLD.invoice_id;
END;

CREATE TRIGGER IF NOT EXISTS trg_service_request_updated_at
AFTER UPDATE ON service_request
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE service_request
  SET updated_at = CURRENT_TIMESTAMP
  WHERE service_request_id = OLD.service_request_id;
END;
