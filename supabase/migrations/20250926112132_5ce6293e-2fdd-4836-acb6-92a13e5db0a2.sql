-- Create a security definer function to check if a user is admin
-- This bypasses RLS policies to avoid circular dependencies
CREATE OR REPLACE FUNCTION public.is_user_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role = 'ADMIN'
  );
$$;