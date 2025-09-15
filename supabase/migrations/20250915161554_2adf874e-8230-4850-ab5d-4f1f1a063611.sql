-- Create demo users in auth.users and profiles tables
-- Note: These are demo accounts for testing purposes

-- Insert demo users into auth.users (we'll simulate the auth creation)
-- Since we can't directly insert into auth.users, we'll create the profiles manually
-- and assume users will be created via the Supabase dashboard or signup process

-- First, let's create the profiles for our demo users
-- These will be linked when the actual auth users are created

INSERT INTO profiles (id, email, name, role) VALUES 
('11111111-1111-1111-1111-111111111111', 'provider@cyptrix.com', 'Dr. Sarah Provider', 'PROVIDER'),
('22222222-2222-2222-2222-222222222222', 'employee@cyptrix.com', 'John Employee', 'EMPLOYEE'),
('33333333-3333-3333-3333-333333333333', 'auditor@cyptrix.com', 'Jane Auditor', 'AUDITOR'),
('44444444-4444-4444-4444-444444444444', 'admin@cyptrix.com', 'Mike Admin', 'ADMIN')
ON CONFLICT (id) DO NOTHING;