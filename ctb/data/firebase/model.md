# Firebase Workbench Model — clnt_subhive

This workbench layer handles intake, validation, and export staging before promotion into Neon (clnt schema).

## Collections

### company_intake
- company_name (string, required)
- ein (string, optional)
- address (string)
- metadata:
  - agent_id (string)
  - process_id (string)
  - blueprint_id (string)
  - ttl (int, seconds)
  - validated (boolean)
  - promoted_to (string, target schema/table)
  - timestamp_last_touched (timestamp)

### employee_intake
- company_unique_id (string, FK → company_master)
- first_name (string, required)
- last_name (string, required)
- dob (date, optional)
- ssn_last4 (string, length=4, optional)
- metadata: (same as above)

### benefit_intake
- company_vendor_id (string, FK → company_vendor_link)
- vendor_benefit_id (string, required)
- benefit_type (string: medical, dental, vision, life, etc.)
- effective_date (date)
- renewal_date (date)
- spd_url (string, optional)
- metadata: (same as above)

### validation_failed
- entity_type (string: company, employee, benefit)
- entity_id (string)
- error_code (string)
- error_message (string)
- resolution_status (string: unresolved, in_progress, resolved)
- metadata:
  - process_id (string)
  - timestamp_last_touched (timestamp)

### export_queue
- company_vendor_id (string)
- benefit_unique_id (string)
- export_status (string: pending, processing, complete, failed)
- target_vendor (string)
- metadata: (same as above)