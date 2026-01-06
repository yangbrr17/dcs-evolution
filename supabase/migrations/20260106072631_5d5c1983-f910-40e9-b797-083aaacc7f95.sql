-- Fix 1: Update alarms UPDATE policy to require operator or admin role
DROP POLICY IF EXISTS "Anyone can update alarms" ON public.alarms;

CREATE POLICY "Operators and admins can update alarms"
  ON public.alarms
  FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'operator'::app_role)
  );

-- Fix 2: Update handle_new_user to assign 'viewer' role by default (least privilege)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, name, employee_id, department)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    NEW.raw_user_meta_data ->> 'employee_id',
    NEW.raw_user_meta_data ->> 'department'
  );
  
  -- Assign default role (viewer for least privilege - admin must upgrade)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'viewer');
  
  RETURN NEW;
END;
$$;