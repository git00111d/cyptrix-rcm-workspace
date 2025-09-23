-- Add delete policy for admins on documents table
CREATE POLICY "Admins can delete all documents" 
ON public.documents 
FOR DELETE 
USING (EXISTS ( 
  SELECT 1 
  FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = 'ADMIN' 
));