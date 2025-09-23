-- Create admin_logs table for error tracking
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  level TEXT NOT NULL CHECK (level IN ('error', 'warn', 'info')),
  message TEXT NOT NULL,
  details TEXT,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on admin_logs
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- Only allow admins to view logs
CREATE POLICY "Only admins can view logs" 
ON public.admin_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'
  )
);

-- Allow authenticated users to insert logs (for error reporting)
CREATE POLICY "Authenticated users can insert logs" 
ON public.admin_logs 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON public.admin_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_level ON public.admin_logs(level);
CREATE INDEX IF NOT EXISTS idx_admin_logs_user_id ON public.admin_logs(user_id);