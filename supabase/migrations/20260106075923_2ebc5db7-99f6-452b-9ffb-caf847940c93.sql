-- Fix 1: Update alarms SELECT policy to require authentication
DROP POLICY IF EXISTS "Anyone can view alarms" ON public.alarms;

CREATE POLICY "Authenticated users can view alarms"
  ON public.alarms
  FOR SELECT
  TO authenticated
  USING (true);

-- Fix 2: Update alarms INSERT policy to require authentication
DROP POLICY IF EXISTS "System can insert alarms" ON public.alarms;

CREATE POLICY "Authenticated users can insert alarms"
  ON public.alarms
  FOR INSERT
  TO authenticated
  WITH CHECK (true);