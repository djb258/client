CREATE SCHEMA IF NOT EXISTS client;

-- Table 1: clients_master
CREATE TABLE client.clients_master (
    col_1_client_id UUID PRIMARY KEY, -- Unique client identifier
    col_2_legal_name TEXT NOT NULL, -- Legal name of the client
    col_3_plan_type TEXT CHECK (plan_type IN ('self-insured', 'fully-insured')), -- Plan type
    col_4_status TEXT, -- Current status of the client
    col_5_renewal_date DATE, -- Renewal date of the plan
    col_6_effective_date DATE, -- Effective date of the plan
    col_7_domicile_state TEXT, -- State of domicile
    col_8_industry TEXT, -- Industry type
    col_9_headcount INTEGER, -- Number of employees
    col_10_fein TEXT, -- Federal Employer Identification Number
    col_11_notes TEXT -- Additional notes
);

-- Table 2: employer_contacts
CREATE TABLE client.employer_contacts (
    col_1_client_id UUID REFERENCES client.clients_master(col_1_client_id), -- Client reference
    col_2_contact_type TEXT CHECK (contact_type IN ('Primary', 'Billing', 'HR')), -- Type of contact
    col_3_name TEXT, -- Contact name
    col_4_title TEXT, -- Contact title
    col_5_email TEXT, -- Contact email
    col_6_phone TEXT -- Contact phone
);

-- Table 3: account_team_assignments
CREATE TABLE client.account_team_assignments (
    col_1_client_id UUID REFERENCES client.clients_master(col_1_client_id), -- Client reference
    col_2_role TEXT CHECK (role IN ('Producer', 'AE', 'AM', 'Analyst')), -- Team role
    col_3_name TEXT, -- Team member name
    col_4_email TEXT, -- Team member email
    col_5_role_start_date DATE, -- Role start date
    col_6_active_flag BOOLEAN -- Is assignment active
);

-- Table 4: tone_profile
CREATE TABLE client.tone_profile (
    col_1_client_id UUID REFERENCES client.clients_master(col_1_client_id), -- Client reference
    col_2_tone_style TEXT CHECK (tone_style IN ('formal', 'casual', 'directive')), -- Preferred tone style
    col_3_preferred_channels TEXT[], -- Preferred communication channels
    col_4_hr_owner_id UUID -- HR owner user ID
);

-- Table 5: group_vendor_benefits
CREATE TABLE client.group_vendor_benefits (
    col_1_client_id UUID REFERENCES client.clients_master(col_1_client_id), -- Client reference
    col_2_benefit_id UUID, -- Benefit identifier
    col_3_vendor_id UUID, -- Vendor identifier
    col_4_vendor_name TEXT, -- Vendor name
    col_5_vendor_group_id UUID, -- Vendor group identifier
    col_6_vendor_contact_email TEXT, -- Vendor contact email
    col_7_vendor_contact_phone TEXT, -- Vendor contact phone
    col_8_delivery_method TEXT CHECK (delivery_method IN ('API', 'CSV', 'Portal')), -- Delivery method
    col_9_export_required BOOLEAN, -- Is export required
    col_10_target_output_table TEXT, -- Target output table name
    col_11_claims_table_expected TEXT, -- Expected claims table
    col_12_claims_system_origin TEXT, -- Claims system origin
    col_13_funding_type TEXT -- Funding type
);

-- Table 6: active_census_intake
CREATE TABLE client.active_census_intake (
    col_1_participant_id UUID PRIMARY KEY, -- Unique participant identifier
    col_2_client_id UUID REFERENCES client.clients_master(col_1_client_id), -- Client reference
    col_3_group_id UUID, -- Group identifier
    col_4_vendor_id UUID, -- Vendor identifier
    col_5_relationship TEXT, -- Relationship to employee
    col_6_employment_status TEXT, -- Employment status
    col_7_hire_date DATE -- Hire date
);

-- Table 7: participant_benefit_elections
CREATE TABLE client.participant_benefit_elections (
    col_1_participant_id UUID REFERENCES client.active_census_intake(col_1_participant_id), -- Participant reference
    col_2_benefit_id UUID, -- Benefit identifier
    col_3_tier_level TEXT, -- Tier level
    col_4_coverage_status TEXT, -- Coverage status
    col_5_effective_date DATE, -- Coverage effective date
    col_6_termination_date DATE, -- Coverage termination date
    col_7_monthly_premium NUMERIC(12,2), -- Monthly premium
    col_8_employee_contribution NUMERIC(12,2), -- Employee contribution
    col_9_employer_contribution NUMERIC(12,2) -- Employer contribution
);

-- Table 8: vendor_participant_uid_map
CREATE TABLE client.vendor_participant_uid_map (
    col_1_participant_id UUID REFERENCES client.active_census_intake(col_1_participant_id), -- Participant reference
    col_2_vendor_id UUID, -- Vendor identifier
    col_3_vendor_type TEXT, -- Vendor type
    col_4_vendor_participant_uid TEXT, -- Vendor participant UID
    col_5_effective_date DATE, -- Effective date
    col_6_last_verified_date DATE -- Last verified date
);

-- Table 9: uid_name_keyfile
CREATE TABLE client.uid_name_keyfile (
    col_1_participant_id UUID, -- Participant identifier
    col_2_full_name TEXT, -- Full name
    col_3_email TEXT, -- Email address
    col_4_phone TEXT, -- Phone number
    col_5_hr_employee_id TEXT -- HR employee ID
);

-- Table 10: benefit_config_grid
CREATE TABLE client.benefit_config_grid (
    col_1_client_id UUID REFERENCES client.clients_master(col_1_client_id), -- Client reference
    col_2_group_id UUID, -- Group identifier
    col_3_benefit_id UUID, -- Benefit identifier
    col_4_tier_name TEXT, -- Tier name
    col_5_employee_rate NUMERIC(12,2), -- Employee rate
    col_6_employer_rate NUMERIC(12,2) -- Employer rate
);

-- Table 11: employee_message_log
CREATE TABLE client.employee_message_log (
    col_1_participant_id UUID, -- Participant identifier
    col_2_message_type TEXT CHECK (message_type IN ('welcome', 'reminder', 'confirmation')), -- Message type
    col_3_delivery_channel TEXT, -- Delivery channel
    col_4_audience TEXT, -- Audience
    col_5_status TEXT -- Message status
);

-- Table 12: enrollment_ticket_log
CREATE TABLE client.enrollment_ticket_log (
    col_1_participant_id UUID, -- Participant identifier
    col_2_ticket_type TEXT, -- Ticket type
    col_3_resolution_status TEXT, -- Resolution status
    col_4_created_at TIMESTAMP DEFAULT now(), -- Ticket creation timestamp
    col_5_updated_at TIMESTAMP -- Ticket update timestamp
);

-- Table 13: renewal_year_tracker
CREATE TABLE client.renewal_year_tracker (
    col_1_client_id UUID REFERENCES client.clients_master(col_1_client_id), -- Client reference
    col_2_plan_year INTEGER, -- Plan year
    col_3_plan_type TEXT, -- Plan type
    col_4_renewal_date DATE, -- Renewal date
    col_5_vendor_summary TEXT, -- Vendor summary
    col_6_benchmark_gap_score NUMERIC(6,2), -- Benchmark gap score
    col_7_sniper_recommendation_id UUID, -- Sniper recommendation ID
    col_8_monte_carlo_projection_id UUID, -- Monte Carlo projection ID
    col_9_compliance_flags TEXT, -- Compliance flags
    col_10_renewed_flag BOOLEAN, -- Renewed flag
    col_11_decision_summary TEXT -- Decision summary
);

-- Table 14: benefit_year_performance_summary
CREATE TABLE client.benefit_year_performance_summary (
    col_1_client_id UUID REFERENCES client.clients_master(col_1_client_id), -- Client reference
    col_2_plan_year INTEGER, -- Plan year
    col_3_benefit_id UUID, -- Benefit identifier
    col_4_vendor_id UUID, -- Vendor identifier
    col_5_vendor_group_id UUID, -- Vendor group identifier
    col_6_funding_type TEXT, -- Funding type
    col_7_average_enrolled_headcount INTEGER, -- Average enrolled headcount
    col_8_total_claims_paid NUMERIC(14,2), -- Total claims paid
    col_9_stop_loss_fees_paid NUMERIC(14,2), -- Stop loss fees paid
    col_10_admin_fees_paid NUMERIC(14,2), -- Admin fees paid
    col_11_total_premium_billed NUMERIC(14,2), -- Total premium billed
    col_12_employee_contributions NUMERIC(14,2), -- Employee contributions
    col_13_employer_contributions NUMERIC(14,2), -- Employer contributions
    col_14_total_cost NUMERIC(14,2), -- Total cost
    col_15_cost_per_employee_per_year NUMERIC(14,2), -- Cost per employee per year
    col_16_trend_vs_prior_year NUMERIC(6,2) -- Trend vs prior year
);

-- Table 15: compliance_requirements
CREATE TABLE client.compliance_requirements (
    col_1_client_id UUID REFERENCES client.clients_master(col_1_client_id), -- Client reference
    col_2_requirement_type TEXT CHECK (requirement_type IN ('ACA', 'RxDC', 'PCORI')), -- Requirement type
    col_3_due_date DATE, -- Due date
    col_4_completion_status TEXT, -- Completion status
    col_5_source TEXT -- Source of requirement
);

-- Table 16: rxdc_filing_log
CREATE TABLE client.rxdc_filing_log (
    col_1_client_id UUID REFERENCES client.clients_master(col_1_client_id), -- Client reference
    col_2_plan_year INTEGER, -- Plan year
    col_3_status TEXT, -- Filing status
    col_4_submission_id TEXT, -- Submission ID
    col_5_timestamp TIMESTAMP -- Filing timestamp
);

-- Table 17: aca_1095_log
CREATE TABLE client.aca_1095_log (
    col_1_client_id UUID REFERENCES client.clients_master(col_1_client_id), -- Client reference
    col_2_plan_year INTEGER, -- Plan year
    col_3_number_of_1095s INTEGER, -- Number of 1095s
    col_4_filing_status TEXT, -- Filing status
    col_5_error_flag BOOLEAN -- Error flag
);

-- Table 18: support_tickets
CREATE TABLE client.support_tickets (
    col_1_client_id UUID REFERENCES client.clients_master(col_1_client_id), -- Client reference
    col_2_source_module TEXT, -- Source module
    col_3_ticket_type TEXT, -- Ticket type
    col_4_status TEXT, -- Ticket status
    col_5_agent_owner TEXT -- Agent owner
);

-- Table 19: blueprint_execution_log
CREATE TABLE client.blueprint_execution_log (
    col_1_client_id UUID REFERENCES client.clients_master(col_1_client_id), -- Client reference
    col_2_blueprint_id UUID, -- Blueprint identifier
    col_3_step_name TEXT, -- Step name
    col_4_status TEXT, -- Step status
    col_5_timestamp TIMESTAMP -- Execution timestamp
);

-- Table 20: touchpoint_log
CREATE TABLE client.touchpoint_log (
    col_1_client_id UUID REFERENCES client.clients_master(col_1_client_id), -- Client reference
    col_2_user_role TEXT CHECK (user_role IN ('AM', 'HR', 'CFO')), -- User role
    col_3_topic TEXT, -- Touchpoint topic
    col_4_notes TEXT, -- Touchpoint notes
    col_5_timestamp TIMESTAMP -- Touchpoint timestamp
);

-- Table 21: dashboard_enrollment_flat (read-only)
CREATE TABLE client.dashboard_enrollment_flat (
    col_1_client_id UUID, -- Client identifier
    col_2_vendor_id UUID, -- Vendor identifier
    col_3_benefit_id UUID, -- Benefit identifier
    col_4_participant_id_hash TEXT, -- Hashed participant ID (no PII)
    col_5_tier_level TEXT, -- Tier level
    col_6_coverage_status TEXT, -- Coverage status
    col_7_monthly_premium NUMERIC(14,2), -- Monthly premium
    col_8_employee_contribution NUMERIC(14,2), -- Employee contribution
    col_9_employer_contribution NUMERIC(14,2), -- Employer contribution
    col_10_cost_per_employee_per_year NUMERIC(14,2), -- Cost per employee per year
    col_11_communication_status TEXT, -- Communication status
    col_12_compliance_flags TEXT, -- Compliance flags
    col_13_billing_total NUMERIC(14,2), -- Billing total
    col_14_payroll_total NUMERIC(14,2) -- Payroll total
); 