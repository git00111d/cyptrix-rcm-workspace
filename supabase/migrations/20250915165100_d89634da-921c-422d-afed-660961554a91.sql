-- Fix the documents bucket to be public for file access
UPDATE storage.buckets 
SET public = true 
WHERE id = 'documents';

-- Create proper storage policies for document access
-- Policy for providers to upload their own documents
CREATE POLICY "Providers can upload documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy for providers to view their own documents  
CREATE POLICY "Providers can view own documents"
ON storage.objects
FOR SELECT 
USING (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy for employees/auditors to view all documents
CREATE POLICY "Employees can view all documents"
ON storage.objects
FOR SELECT 
USING (
  bucket_id = 'documents' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('EMPLOYEE', 'AUDITOR', 'ADMIN')
  )
);