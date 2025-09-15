-- Drop existing document_codes table and create new page_codes table for the workflow
DROP TABLE IF EXISTS public.document_codes;

-- Create page_codes table for page-wise coding
CREATE TABLE public.page_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL,
  page_number INTEGER NOT NULL,
  icd_codes TEXT[] DEFAULT '{}',
  cpt_codes TEXT[] DEFAULT '{}',
  notes TEXT DEFAULT '',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(document_id, page_number, created_by)
);

-- Enable RLS on page_codes
ALTER TABLE public.page_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for page_codes
-- Providers can insert/select codes for their own documents
CREATE POLICY "Providers can manage codes for own documents" 
ON public.page_codes 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM documents 
    WHERE documents.id = page_codes.document_id 
    AND documents.provider_id = auth.uid()
  )
  OR created_by = auth.uid()
);

-- Employees can insert/select codes for all documents
CREATE POLICY "Employees can manage codes for all documents" 
ON public.page_codes 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'EMPLOYEE'
  )
  OR created_by = auth.uid()
);

-- Auditors can only select (read-only access to everything)
CREATE POLICY "Auditors can view all codes" 
ON public.page_codes 
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'AUDITOR'
  )
);

-- Update documents table RLS policies for cleaner role-based access
DROP POLICY IF EXISTS "Providers can view own documents" ON public.documents;
DROP POLICY IF EXISTS "Providers can insert their own documents" ON public.documents;
DROP POLICY IF EXISTS "Employees can update document status" ON public.documents;

-- New RLS policies for documents
CREATE POLICY "Providers can manage own documents" 
ON public.documents 
FOR ALL
USING (provider_id = auth.uid());

CREATE POLICY "Employees can view all documents" 
ON public.documents 
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('EMPLOYEE', 'AUDITOR', 'ADMIN')
  )
);

-- Create trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_page_codes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER page_codes_updated_at
BEFORE UPDATE ON public.page_codes
FOR EACH ROW
EXECUTE FUNCTION public.handle_page_codes_updated_at();