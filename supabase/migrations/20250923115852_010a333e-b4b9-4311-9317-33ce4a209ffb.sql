-- Create document_queries table for employee queries and feedback
CREATE TABLE public.document_queries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    page_number INTEGER,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED')),
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    response TEXT,
    responded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    responded_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.document_queries ENABLE ROW LEVEL SECURITY;

-- Create policies for document_queries
CREATE POLICY "Users can view queries for documents they have access to"
ON public.document_queries
FOR SELECT
USING (
    -- Allow if user created the query
    created_by = auth.uid() OR
    -- Allow if user is provider of the document
    EXISTS (
        SELECT 1 FROM documents 
        WHERE documents.id = document_queries.document_id 
        AND documents.provider_id = auth.uid()
    ) OR
    -- Allow employees, auditors, and admins to view all queries
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('EMPLOYEE', 'AUDITOR', 'ADMIN')
    )
);

CREATE POLICY "Users can create queries for documents they can access"
ON public.document_queries
FOR INSERT
WITH CHECK (
    created_by = auth.uid() AND (
        -- Allow if user is provider of the document
        EXISTS (
            SELECT 1 FROM documents 
            WHERE documents.id = document_queries.document_id 
            AND documents.provider_id = auth.uid()
        ) OR
        -- Allow employees to create queries
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'EMPLOYEE'
        )
    )
);

CREATE POLICY "Staff can update query responses"
ON public.document_queries
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('AUDITOR', 'ADMIN')
    )
);

-- Create index for better performance
CREATE INDEX idx_document_queries_document_id ON public.document_queries(document_id);
CREATE INDEX idx_document_queries_status ON public.document_queries(status);
CREATE INDEX idx_document_queries_created_by ON public.document_queries(created_by);