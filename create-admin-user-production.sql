-- To create admin access, run this SQL in your Supabase SQL Editor:
-- https://nomiiqzxaxyxnxndvkbe.supabase.co/project/sql

-- 1. First, sign up as admin@talk-to-my-lawyer.com in your app
-- 2. Then run this SQL to make them an admin:

UPDATE profiles
SET role = 'admin', is_super_user = true
WHERE email = 'admin@talk-to-my-lawyer.com';

-- Or to make your own email admin (replace with your email):
UPDATE profiles
SET role = 'admin', is_super_user = true
WHERE email = 'your-email@example.com';

-- Check admin users:
SELECT email, role, is_super_user
FROM profiles
WHERE role = 'admin';