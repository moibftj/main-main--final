-- Promote admin user to super admin
UPDATE profiles
SET role = 'admin', is_super_user = true
WHERE email = 'admin@talk-to-my-lawyer.com';

-- Verify the update
SELECT email, role, is_super_user FROM profiles WHERE email = 'admin@talk-to-my-lawyer.com';