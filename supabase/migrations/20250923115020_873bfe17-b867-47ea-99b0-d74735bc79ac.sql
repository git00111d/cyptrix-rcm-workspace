-- Fix user roles in profiles table
UPDATE profiles 
SET role = 'ADMIN' 
WHERE email = 'admin@cyptrix.com';

UPDATE profiles 
SET role = 'AUDITOR' 
WHERE email = 'auditor@cyptrix.com';