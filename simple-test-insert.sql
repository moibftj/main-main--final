-- Simple test data for existing admin user
-- This creates test letters tied to existing users
-- Run this in your Supabase SQL Editor

-- First, let's see what users we have
-- SELECT id, email, role FROM profiles WHERE role = 'subscriber' LIMIT 5;

-- Create some test letters for existing admin email (you can change the user_id to match your actual users)
INSERT INTO letters (
  id,
  user_id,
  title,
  letter_type,
  status,
  intake_data,
  ai_draft_content,
  created_at,
  updated_at
) VALUES
  -- Pending review letter
  (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'admin@talk-to-my-lawyer.com' LIMIT 1),
    'Demand Letter for Unpaid Services',
    'Demand Letter',
    'pending_review',
    '{"recipient_name":"ABC Corp","recipient_address":"123 Business St","amount_due":5000,"service_date":"2024-10-15","description":"Consulting services provided"}'::jsonb,
    'ABC Corp
123 Business St

November 29, 2024

RE: Demand for Payment - Account #12345

Dear ABC Corp,

This letter serves as formal demand for payment of outstanding consulting services in the amount of $5,000.00.

Services were rendered on October 15, 2024, as per our agreement. Despite multiple attempts to collect this debt, the account remains unpaid.

Please remit payment within 10 business days to avoid further action.

Sincerely,
Legal Department',
    NOW(),
    NOW()
  ),

  -- Another pending review
  (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'admin@talk-to-my-lawyer.com' LIMIT 1),
    'Cease and Desist - Copyright Infringement',
    'Cease and Desist',
    'pending_review',
    '{"infringing_party":"Copycat Company","infringed_work":"Original software code","infringement_details":"Unauthorized use of proprietary algorithms","first_discovery_date":"2024-11-15"}'::jsonb,
    'Copycat Company
[Address]

November 29, 2024

RE: Cease and Desist Notice - Copyright Infringement

Dear Copycat Company,

We demand that you immediately cease and desist from using our proprietary software code and algorithms.

Your unauthorized use constitutes copyright infringement under applicable law. We discovered this infringement on November 15, 2024.

Failure to comply within 5 business days will result in legal action.

Sincerely,
Legal Department',
    NOW() - INTERVAL '1 hour',
    NOW() - INTERVAL '1 hour'
  ),

  -- Under review letter
  (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'admin@talk-to-my-lawyer.com' LIMIT 1),
    'Landlord-Tenant Dispute - Security Deposit',
    'Legal Notice',
    'under_review',
    '{"landlord_name":"Property Management LLC","tenant_name":"John Doe","property_address":"456 Rental Ave","deposit_amount":1500,"dispute_reason":"Wrongful withholding of deposit"}'::jsonb,
    'Property Management LLC
[Address]

November 29, 2024

RE: Security Deposit Dispute

Dear Property Management LLC,

I am writing regarding the wrongful withholding of my $1,500.00 security deposit for the property at 456 Rental Ave.

Despite leaving the property in excellent condition, you have failed to return my deposit within the legally required timeframe.

Please remit payment immediately to avoid legal action.

Sincerely,
John Doe',
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '1 hour'
  ),

  -- Approved letter
  (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'admin@talk-to-my-lawyer.com' LIMIT 1),
    'Employment Termination Appeal',
    'Appeal Letter',
    'approved',
    '{"employer_name":"Tech Corp Inc","employee_name":"Jane Smith","termination_date":"2024-11-01","reason_for_appeal":"Wrongful termination","previous_warnings":0}'::jsonb,
    'Tech Corp Inc
[Address]

November 29, 2024

RE: Appeal of Employment Termination

Dear Tech Corp Inc,

I am writing to appeal my recent termination dated November 1, 2024.

This termination was without cause and without any prior warnings or performance issues.

I request an immediate review of this decision.

Sincerely,
Jane Smith',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
  ),

  -- Completed letter
  (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'admin@talk-to-my-lawyer.com' LIMIT 1),
    'Breach of Contract - Software Development',
    'Demand Letter',
    'completed',
    '{"contracting_party":"Software Solutions Inc","contract_date":"2024-01-15","breach_description":"Failure to deliver software by agreed deadline","damages":25000}'::jsonb,
    'Software Solutions Inc
[Address]

November 29, 2024

RE: Breach of Contract Demand

Dear Software Solutions Inc,

This letter concerns your breach of our software development contract dated January 15, 2024.

You failed to deliver the agreed-upon software by the deadline, resulting in damages of $25,000.

We demand immediate payment of these damages.

Sincerely,
Legal Department',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days'
  ),

  -- Rejected letter
  (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'admin@talk-to-my-lawyer.com' LIMIT 1),
    'Invalid Legal Request',
    'Legal Notice',
    'rejected',
    '{"target_party":"Unknown","dispute_type":"Unclear","damages_sought":0}'::jsonb,
    'This letter has insufficient legal basis.',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days'
  );

-- Create audit trail entries
DO $$
DECLARE
  letter_ids UUID[];
  admin_id UUID;
BEGIN
  -- Get admin user ID
  SELECT id INTO admin_id FROM profiles WHERE email = 'admin@talk-to-my-lawyer.com' LIMIT 1;

  -- Get all letter IDs we just created
  SELECT array_agg(id) INTO letter_ids FROM letters WHERE created_at > NOW() - INTERVAL '5 minutes';

  -- Create audit trail for each letter
  FOREACH letter_id IN ARRAY letter_ids
  LOOP
    INSERT INTO letter_audit_trail (letter_id, performed_by, action, old_status, new_status, notes, created_at)
    VALUES (
      letter_id,
      admin_id,
      'created',
      NULL,
      'draft',
      'Letter created by user',
      NOW() - INTERVAL '4 hours'
    );

    INSERT INTO letter_audit_trail (letter_id, performed_by, action, old_status, new_status, notes, created_at)
    VALUES (
      letter_id,
      admin_id,
      'ai_generated',
      'draft',
      'generating',
      'AI draft generated',
      NOW() - INTERVAL '3 hours'
    );

    INSERT INTO letter_audit_trail (letter_id, performed_by, action, old_status, new_status, notes, created_at)
    VALUES (
      letter_id,
      admin_id,
      'ai_completed',
      'generating',
      'pending_review',
      'AI generation completed, ready for review',
      NOW() - INTERVAL '2 hours'
    );
  END LOOP;
END $$;

-- Update approved and completed letters with proper review data
UPDATE letters
SET
  reviewed_by = (SELECT id FROM profiles WHERE email = 'admin@talk-to-my-lawyer.com' LIMIT 1),
  reviewed_at = NOW() - INTERVAL '1 day',
  review_notes = 'Letter approved after thorough review',
  final_content = ai_draft_content,
  completed_at = NOW() - INTERVAL '1 day'
WHERE status = 'approved' OR status = 'completed';

UPDATE letters
SET
  reviewed_by = (SELECT id FROM profiles WHERE email = 'admin@talk-to-my-lawyer.com' LIMIT 1),
  reviewed_at = NOW() - INTERVAL '3 days',
  rejection_reason = 'Insufficient legal basis provided',
  review_notes = 'Rejected due to lack of legal merit'
WHERE status = 'rejected';

UPDATE letters
SET
  reviewed_by = (SELECT id FROM profiles WHERE email = 'admin@talk-to-my-lawyer.com' LIMIT 1),
  reviewed_at = NOW() - INTERVAL '1 hour',
  review_notes = 'Currently under admin review'
WHERE status = 'under_review';

-- Display results
SELECT 'Test data creation completed!' as status;

-- Show summary
SELECT
  'Letter Summary' as category,
  status,
  COUNT(*) as count
FROM letters
WHERE created_at > NOW() - INTERVAL '5 minutes'
GROUP BY status
ORDER BY count DESC;

SELECT
  'Dashboard Metrics' as category,
  COUNT(*)::text as total_letters,
  COUNT(CASE WHEN status IN ('pending_review', 'under_review') THEN 1 END)::text as pending_review,
  COUNT(CASE WHEN status = 'completed' THEN 1 END)::text as completed,
  COUNT(CASE WHEN status = 'rejected' THEN 1 END)::text as rejected
FROM letters
WHERE created_at > NOW() - INTERVAL '5 minutes';