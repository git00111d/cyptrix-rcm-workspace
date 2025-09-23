-- Fix storage policies by removing conflicting ones and keeping only necessary ones
DROP POLICY IF EXISTS "Employees can view all documents" ON storage.objects;
DROP POLICY IF EXISTS "Providers can view own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view documents they have access to" ON storage.objects;
DROP POLICY IF EXISTS "Providers can upload to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Secure document upload" ON storage.objects;

-- Create simplified and clear storage policies
CREATE POLICY "Document access for all authenticated users"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Document upload for authenticated users"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Admin can delete documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'documents' AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'
    )
  );