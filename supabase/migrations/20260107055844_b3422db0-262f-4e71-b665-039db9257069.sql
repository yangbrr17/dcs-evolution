-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create role-based access policy: admins and operators can view all, viewers only their own
CREATE POLICY "Role-based profile access" 
  ON public.profiles 
  FOR SELECT 
  TO authenticated
  USING (
    auth.uid() = id OR 
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'operator'::app_role)
  );