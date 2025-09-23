-- Make documents bucket private for security
UPDATE storage.buckets 
SET public = false 
WHERE id = 'documents';

-- Drop existing conflicting policies if they exist
DROP POLICY IF EXISTS "Providers can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view assigned documents" ON storage.objects;

-- Create comprehensive RLS policies for secure document access
CREATE POLICY "Secure document access" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'documents' 
  AND (
    -- Users can access their own documents
    (storage.foldername(name))[1] = auth.uid()::text
    OR 
    -- Staff can access documents based on their role and document assignments
    EXISTS (
      SELECT 1 FROM public.documents d 
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE d.file_path = storage.objects.name 
      AND (
        d.provider_id = auth.uid() 
        OR p.role IN ('ADMIN', 'AUDITOR', 'EMPLOYEE')
      )
    )
  )
);

CREATE POLICY "Secure document upload" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Admin document deletion" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'documents' 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'ADMIN'
  )
);