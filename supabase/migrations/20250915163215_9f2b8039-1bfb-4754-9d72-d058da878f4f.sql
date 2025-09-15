-- Fix the employee user role
UPDATE profiles 
SET role = 'EMPLOYEE' 
WHERE email = 'employee@cyptrix.com';

-- Add file_url column to documents table to store the public URL
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS file_url TEXT;