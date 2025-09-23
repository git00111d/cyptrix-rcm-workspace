-- Remove public access from documents bucket if it exists
UPDATE storage.buckets 
SET public = false 
WHERE id = 'documents';

-- If bucket doesn't exist, create it as private
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Create RLS policies for secure document access
CREATE POLICY "Users can view their own documents" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Authenticated users can view assigned documents" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'documents' 
  AND EXISTS (
    SELECT 1 FROM public.documents d 
    WHERE d.file_path = storage.objects.name 
    AND (
      d.provider_id = auth.uid() 
      OR auth.jwt() ->> 'role' IN ('ADMIN', 'AUDITOR', 'EMPLOYEE')
    )
  )
);

CREATE POLICY "Providers can upload documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Only admins can delete documents" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'documents' 
  AND auth.jwt() ->> 'role' = 'ADMIN'
);