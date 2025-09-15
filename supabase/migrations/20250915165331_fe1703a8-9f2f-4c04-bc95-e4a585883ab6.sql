-- Make documents bucket public for file access
UPDATE storage.buckets 
SET public = true 
WHERE id = 'documents';

-- Update existing documents with proper file URLs
UPDATE documents 
SET file_url = 'https://bnptlhgfplqisbnumzpf.supabase.co/storage/v1/object/public/documents/' || file_path
WHERE file_url IS NULL;