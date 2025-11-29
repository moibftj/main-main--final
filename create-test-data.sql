-- Test Data Population for Admin Dashboard
-- Run this script in Supabase SQL Editor to populate the database with sample data

-- 1. Create Test Subscribers with active subscriptions
INSERT INTO profiles (id, email, full_name, role, phone, company_name, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'john.doe@example.com', 'John Doe', 'subscriber', '555-0101', 'Doe Enterprises', NOW() - INTERVAL '30 days', NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'jane.smith@example.com', 'Jane Smith', 'subscriber', '555-0102', 'Smith Consulting', NOW() - INTERVAL '45 days', NOW()),
('550e8400-e29b-41d4-a716-446655440003', 'robert.johnson@example.com', 'Robert Johnson', 'subscriber', '555-0103', 'Johnson & Co', NOW() - INTERVAL '60 days', NOW()),
('550e8400-e29b-41d4-a716-446655440004', 'emily.wilson@example.com', 'Emily Wilson', 'subscriber', '555-0104', 'Wilson Legal Services', NOW() - INTERVAL '90 days', NOW()),
('550e8400-e29b-41d4-a716-446655440005', 'michael.brown@example.com', 'Michael Brown', 'subscriber', '555-0105', 'Brown Corporation', NOW() - INTERVAL '120 days', NOW())
ON CONFLICT (id) DO NOTHING;

-- 2. Create active subscriptions for test subscribers
INSERT INTO subscriptions (id, user_id, plan, status, price, discount, credits_remaining, created_at, updated_at, expires_at) VALUES
('sub001', '550e8400-e29b-41d4-a716-446655440001', 'monthly', 'active', 299.00, 0, 3, NOW() - INTERVAL '30 days', NOW(), NOW() + INTERVAL '30 days'),
('sub002', '550e8400-e29b-41d4-a716-446655440002', 'yearly', 'active', 599.00, 0, 6, NOW() - INTERVAL '45 days', NOW(), NOW() + INTERVAL '320 days'),
('sub003', '550e8400-e29b-41d4-a716-446655440003', 'monthly', 'active', 299.00, 0, 2, NOW() - INTERVAL '60 days', NOW(), NOW() + INTERVAL '30 days'),
('sub004', '550e8400-e29b-41d4-a716-446655440004', 'single', 'canceled', 299.00, 0, 0, NOW() - INTERVAL '90 days', NOW() - INTERVAL '1 day', NULL),
('sub005', '550e8400-e29b-41d4-a716-446655440005', 'monthly', 'active', 299.00, 20, 4, NOW() - INTERVAL '120 days', NOW(), NOW() + INTERVAL '30 days')
ON CONFLICT (id) DO NOTHING;

-- 3. Create Test Employees
INSERT INTO profiles (id, email, full_name, role, phone, company_name, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440101', 'sarah.employee@example.com', 'Sarah Employee', 'employee', '555-0201', 'Legal Referrals Inc', NOW() - INTERVAL '90 days', NOW()),
('550e8400-e29b-41d4-a716-446655440102', 'david.partner@example.com', 'David Partner', 'employee', '555-0202', 'Partner Legal Solutions', NOW() - INTERVAL '60 days', NOW())
ON CONFLICT (id) DO NOTHING;

-- 4. Create employee coupons
INSERT INTO employee_coupons (id, employee_id, code, discount_percent, is_active, usage_count, created_at) VALUES
('coupon001', '550e8400-e29b-41d4-a716-446655440101', 'SARAH20', 20, true, 3, NOW() - INTERVAL '90 days'),
('coupon002', '550e8400-e29b-41d4-a716-446655440102', 'DAVID20', 20, true, 1, NOW() - INTERVAL '60 days')
ON CONFLICT (id) DO NOTHING;

-- 5. Create commission records for employees
INSERT INTO commissions (id, employee_id, subscription_id, subscription_amount, commission_rate, commission_amount, status, created_at, paid_at) VALUES
('comm001', '550e8400-e29b-41d4-a716-446655440101', 'sub002', 599.00, 5, 29.95, 'pending', NOW() - INTERVAL '45 days', NULL),
('comm002', '550e8400-e29b-41d4-a716-446655440101', 'sub005', 299.00, 5, 14.95, 'paid', NOW() - INTERVAL '120 days', NOW() - INTERVAL '100 days'),
('comm003', '550e8400-e29b-41d4-a716-446655440102', 'sub003', 299.00, 5, 14.95, 'pending', NOW() - INTERVAL '60 days', NULL)
ON CONFLICT (id) DO NOTHING;

-- 6. Create test letters in various statuses
INSERT INTO letters (id, user_id, title, letter_type, status, intake_data, ai_draft_content, final_content, reviewed_by, reviewed_at, review_notes, rejection_reason, created_at, updated_at, completed_at) VALUES
-- Pending review letters
('letter001', '550e8400-e29b-41d4-a716-446655440001', 'Demand Letter for Unpaid Services', 'Demand Letter', 'pending_review',
 '{"recipient_name":"ABC Corp","recipient_address":"123 Business St","amount_due":5000,"service_date":"2024-10-15","description":"Consulting services provided"}',
 '{"recipient_name":"ABC Corp","recipient_address":"123 Business St","date":"November 29, 2024","subject":"Demand for Payment - Account #12345","body":"This letter serves as formal demand for payment..."}',
 NULL, NULL, NULL, NULL, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours', NULL),

('letter002', '550e8400-e29b-41d4-a716-446655440002', 'Cease and Desist - Copyright Infringement', 'Cease and Desist', 'pending_review',
 '{"infringing_party":"Copycat Company","infringed_work":"Original software code","infringement_details":"Unauthorized use of proprietary algorithms","first_discovery_date":"2024-11-15"}',
 '{"infringing_party":"Copycat Company","date":"November 29, 2024","subject":"Cease and Desist Notice - Copyright Infringement","body":"We demand that you immediately cease..."}',
 NULL, NULL, NULL, NULL, NOW() - INTERVAL '4 hours', NOW() - INTERVAL '4 hours', NULL),

-- Letters under review
('letter003', '550e8400-e29b-41d4-a716-446655440003', 'Landlord-Tenant Dispute - Security Deposit', 'Legal Notice', 'under_review',
 '{"landlord_name":"Property Management LLC","tenant_name":"Robert Johnson","property_address":"456 Rental Ave","deposit_amount":1500,"dispute_reason":"Wrongful withholding of deposit"}',
 '{"landlord_name":"Property Management LLC","date":"November 29, 2024","subject":"Security Deposit Dispute","body":"I am writing regarding the wrongful withholding..."}',
 NULL, 'admin@talk-to-my-lawyer.com', NOW() - INTERVAL '1 hour', 'Needs minor clarification on dates', NULL, NOW() - INTERVAL '6 hours', NOW() - INTERVAL '1 hour', NULL),

-- Approved letters
('letter004', '550e8400-e29b-41d4-a716-446655440001', 'Employment Termination Appeal', 'Appeal Letter', 'approved',
 '{"employer_name":"Tech Corp Inc","employee_name":"John Doe","termination_date":"2024-11-01","reason_for_appeal":"Wrongful termination","previous_warnings":0}',
 '{"employer_name":"Tech Corp Inc","date":"November 29, 2024","subject":"Appeal of Employment Termination","body":"I am writing to appeal my recent termination..."}',
 '{"employer_name":"Tech Corp Inc","date":"November 29, 2024","subject":"Appeal of Employment Termination - FINAL VERSION","body":"I am writing to formally appeal my termination dated November 1, 2024..."}',
 'admin@talk-to-my-lawyer.com', NOW() - INTERVAL '2 days', 'Approved with minor edits to clarify timeline', NULL, NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),

-- Rejected letters
('letter005', '550e8400-e29b-41d4-a716-446655440004', 'Frivolous Legal Threat', 'Legal Notice', 'rejected',
 '{"target_party":"Business Competitor","dispute_type":"Unfair competition","damages_sought":100000,"legal_basis":"None provided"}',
 '{"target_party":"Business Competitor","date":"November 29, 2024","subject":"Legal Notice","body":"This letter constitutes formal notice..."}',
 NULL, 'admin@talk-to-my-lawyer.com', NOW() - INTERVAL '1 week', 'Rejected: No valid legal basis provided. This appears to be a frivolous request.', 'No valid legal claim', NOW() - INTERVAL '1 week', NOW() - INTERVAL '1 week', NULL),

-- Completed letters
('letter006', '550e8400-e29b-41d4-a716-446655440002', 'Breach of Contract - Software Development', 'Demand Letter', 'completed',
 '{"contracting_party":"Software Solutions Inc","contract_date":"2024-01-15","breach_description":"Failure to deliver software by agreed deadline","damages":25000}',
 '{"contracting_party":"Software Solutions Inc","date":"November 29, 2024","subject":"Breach of Contract Demand","body":"This letter concerns your breach..."}',
 '{"contracting_party":"Software Solutions Inc","date":"November 29, 2024","subject":"Breach of Contract Demand - FINAL","body":"This letter constitutes our final demand..."}',
 'admin@talk-to-my-lawyer.com', NOW() - INTERVAL '2 weeks', 'Approved and sent to recipient', NULL, NOW() - INTERVAL '3 weeks', NOW() - INTERVAL '2 weeks', NOW() - INTERVAL '2 weeks'),

-- More letters for realistic data
('letter007', '550e8400-e29b-41d4-a716-446655440005', 'Personal Injury Settlement Demand', 'Demand Letter', 'completed',
 '{"insurance_company":"Safe Auto Insurance","claim_number":"CLAIM12345","incident_date":"2024-09-15","injuries":"Whiplash and back injuries","medical_expenses":8500}',
 '{"insurance_company":"Safe Auto Insurance","date":"November 29, 2024","subject":"Demand for Settlement - Claim #CLAIM12345","body":"We hereby demand settlement..."}',
 '{"insurance_company":"Safe Auto Insurance","date":"November 29, 2024","subject":"Demand for Settlement - FINAL VERSION","body":"Pursuant to your policy obligations..."}',
 'admin@talk-to-my-lawyer.com', NOW() - INTERVAL '4 weeks', 'Strengthened legal arguments', NULL, NOW() - INTERVAL '1 month', NOW() - INTERVAL '4 weeks', NOW() - INTERVAL '4 weeks'),

('letter008', '550e8400-e29b-41d4-a716-446655440003', 'Neighbor Dispute - Property Damage', 'Legal Notice', 'generating',
 '{"neighbor_name":"Problematic Neighbor","property_address":"789 Suburb St","damage_description":"Tree fell on fence","repair_cost":2500,"incident_date":"2024-11-20"}',
 NULL, NULL, NULL, NULL, NULL, NULL, NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 minutes', NULL)

ON CONFLICT (id) DO NOTHING;

-- 7. Create audit trail entries for letters
INSERT INTO letter_audit_trail (letter_id, performed_by, action, old_status, new_status, notes, created_at) VALUES
-- Letter001 lifecycle
('letter001', '550e8400-e29b-41d4-a716-446655440001', 'created', NULL, 'draft', 'Letter created by user', NOW() - INTERVAL '3 hours'),
('letter001', '550e8400-e29b-41d4-a716-446655440001', 'ai_generated', 'draft', 'generating', 'AI draft generated', NOW() - INTERVAL '2.5 hours'),
('letter001', 'system', 'ai_completed', 'generating', 'pending_review', 'AI generation completed, ready for review', NOW() - INTERVAL '2 hours'),

-- Letter002 lifecycle
('letter002', '550e8400-e29b-41d4-a716-446655440002', 'created', NULL, 'draft', 'Letter created by user', NOW() - INTERVAL '5 hours'),
('letter002', '550e8400-e29b-41d4-a716-446655440002', 'ai_generated', 'draft', 'generating', 'AI draft generated', NOW() - INTERVAL '4.5 hours'),
('letter002', 'system', 'ai_completed', 'generating', 'pending_review', 'AI generation completed, ready for review', NOW() - INTERVAL '4 hours'),

-- Letter003 lifecycle
('letter003', '550e8400-e29b-41d4-a716-446655440003', 'created', NULL, 'draft', 'Letter created by user', NOW() - INTERVAL '7 hours'),
('letter003', '550e8400-e29b-41d4-a716-446655440003', 'ai_generated', 'draft', 'generating', 'AI draft generated', NOW() - INTERVAL '6.5 hours'),
('letter003', 'system', 'ai_completed', 'generating', 'pending_review', 'AI generation completed, ready for review', NOW() - INTERVAL '6 hours'),
('letter003', 'admin@talk-to-my-lawyer.com', 'review_started', 'pending_review', 'under_review', 'Admin began review process', NOW() - INTERVAL '1 hour'),

-- Letter004 lifecycle
('letter004', '550e8400-e29b-41d4-a716-446655440001', 'created', NULL, 'draft', 'Letter created by user', NOW() - INTERVAL '4 days'),
('letter004', '550e8400-e29b-41d4-a716-446655440001', 'ai_generated', 'draft', 'generating', 'AI draft generated', NOW() - INTERVAL '3.5 days'),
('letter004', 'system', 'ai_completed', 'generating', 'pending_review', 'AI generation completed, ready for review', NOW() - INTERVAL '3 days'),
('letter004', 'admin@talk-to-my-lawyer.com', 'approved', 'pending_review', 'approved', 'Letter approved with minor edits', NOW() - INTERVAL '2 days'),
('letter004', 'admin@talk-to-my-lawyer.com', 'completed', 'approved', 'completed', 'Letter marked as completed', NOW() - INTERVAL '2 days'),

-- Letter005 lifecycle
('letter005', '550e8400-e29b-41d4-a716-446655440004', 'created', NULL, 'draft', 'Letter created by user', NOW() - INTERVAL '8 days'),
('letter005', '550e8400-e29b-41d4-a716-446655440004', 'ai_generated', 'draft', 'generating', 'AI draft generated', NOW() - INTERVAL '7.5 days'),
('letter005', 'system', 'ai_completed', 'generating', 'pending_review', 'AI generation completed, ready for review', NOW() - INTERVAL '7 days'),
('letter005', 'admin@talk-to-my-lawyer.com', 'rejected', 'pending_review', 'rejected', 'Rejected: No valid legal basis', NOW() - INTERVAL '1 week')

ON CONFLICT (id) DO NOTHING;

-- 8. Update subscription employee_id for those with employee coupons
UPDATE subscriptions SET employee_id = '550e8400-e29b-41d4-a716-446655440101', coupon_code = 'SARAH20' WHERE id = 'sub002';
UPDATE subscriptions SET employee_id = '550e8400-e29b-41d4-a716-446655440101', coupon_code = 'SARAH20' WHERE id = 'sub005';
UPDATE subscriptions SET employee_id = '550e8400-e29b-41d4-a716-446655440102', coupon_code = 'DAVID20' WHERE id = 'sub003';

-- Summary of test data created:
-- 5 Test subscribers with various subscription plans
-- 5 Active subscriptions (1 yearly, 3 monthly, 1 single/canceled)
-- 2 Test employees
-- 2 Employee coupons (both 20% discount)
-- 3 Commission records (2 pending, 1 paid)
-- 8 Test letters in various statuses:
--   - 2 pending_review
--   - 1 under_review
--   - 1 approved
--   - 2 rejected
--   - 2 completed
--   - 1 generating
-- Multiple audit trail entries showing letter status progression

SELECT 'Test data population completed successfully!' as status;