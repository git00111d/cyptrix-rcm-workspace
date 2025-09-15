-- Fix function search path security issue
DROP FUNCTION IF EXISTS public.handle_page_codes_updated_at();

CREATE OR REPLACE FUNCTION public.handle_page_codes_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;