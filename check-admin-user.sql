-- Check if admin user exists and update to admin role if needed
SELECT email, role, is_super_user FROM profiles WHERE email = 'admin@talk-to-my-lawyer.com';

-- If admin user doesn't exist, you'll need to:
-- 1. Sign up as admin@talk-to-my-lawyer.com
-- 2. Then run this to make them an admin:
UPDATE profiles
SET role = 'admin', is_super_user = true
WHERE email = 'admin@talk-to-my-lawyer.com';

-- Or update your current email to admin:
-- UPDATE profiles
-- SET role = 'admin', is_super_user = true
-- WHERE email = 'your-current-email@example.com';