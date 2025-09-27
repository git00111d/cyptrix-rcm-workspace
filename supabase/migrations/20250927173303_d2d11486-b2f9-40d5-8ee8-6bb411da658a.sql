-- Create table for document decisions
CREATE TABLE public.document_decisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  decision TEXT NOT NULL CHECK (decision IN ('ACCEPTED', 'REJECTED')),
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for ICD-10 page codes (enhanced version)
CREATE TABLE public.icd_page_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  icd_codes TEXT[] DEFAULT '{}',
  comments TEXT,
  supporting_files TEXT[], -- Store file paths/URLs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(document_id, employee_id, page_number)
);

-- Create table for audit submissions
CREATE TABLE public.audit_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  submission_data JSONB NOT NULL, -- Store all page codes and data
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  auditor_id UUID REFERENCES auth.users(id),
  auditor_comments TEXT,
  audited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.document_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.icd_page_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document_decisions
CREATE POLICY "Employees can manage their own document decisions"
ON public.document_decisions
FOR ALL
USING (employee_id = auth.uid());

CREATE POLICY "Staff can view all document decisions"
ON public.document_decisions
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() 
  AND role IN ('AUDITOR', 'ADMIN')
));

-- RLS Policies for icd_page_codes
CREATE POLICY "Employees can manage their own ICD codes"
ON public.icd_page_codes
FOR ALL
USING (employee_id = auth.uid());

CREATE POLICY "Staff can view all ICD codes"
ON public.icd_page_codes
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() 
  AND role IN ('AUDITOR', 'ADMIN')
));

-- RLS Policies for audit_submissions
CREATE POLICY "Employees can manage their own submissions"
ON public.audit_submissions
FOR ALL
USING (employee_id = auth.uid());

CREATE POLICY "Auditors can view and update submissions"
ON public.audit_submissions
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() 
  AND role IN ('AUDITOR', 'ADMIN')
));

-- Add triggers for updated_at
CREATE TRIGGER update_document_decisions_updated_at
  BEFORE UPDATE ON public.document_decisions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_icd_page_codes_updated_at
  BEFORE UPDATE ON public.icd_page_codes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_audit_submissions_updated_at
  BEFORE UPDATE ON public.audit_submissions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Add document_id field to existing page_codes if needed for compatibility
-- Note: The existing page_codes table structure looks compatible, so we'll keep both for now