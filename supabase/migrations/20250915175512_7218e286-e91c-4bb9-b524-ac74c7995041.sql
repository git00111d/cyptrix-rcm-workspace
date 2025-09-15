-- Fix function search path security issue by dropping trigger first
DROP TRIGGER IF EXISTS page_codes_updated_at ON public.page_codes;
DROP FUNCTION IF EXISTS public.handle_page_codes_updated_at();

-- Recreate function with proper security settings
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

-- Recreate trigger
CREATE TRIGGER page_codes_updated_at
BEFORE UPDATE ON public.page_codes
FOR EACH ROW
EXECUTE FUNCTION public.handle_page_codes_updated_at();