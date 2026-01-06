-- Create shift_events table for storing major events during shifts
CREATE TABLE public.shift_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID REFERENCES public.shifts(id) ON DELETE CASCADE NOT NULL,
  operator_id UUID NOT NULL,
  operator_name TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'general',
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL DEFAULT 'info',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shift_events ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view all shift events
CREATE POLICY "Authenticated users can view shift events"
  ON public.shift_events
  FOR SELECT
  TO authenticated
  USING (true);

-- Operators and admins can insert shift events
CREATE POLICY "Operators and admins can insert shift events"
  ON public.shift_events
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'operator'));

-- Operators can update their own events, admins can update all
CREATE POLICY "Operators can update own shift events"
  ON public.shift_events
  FOR UPDATE
  TO authenticated
  USING (operator_id = auth.uid() OR has_role(auth.uid(), 'admin'));

-- Only admins can delete shift events
CREATE POLICY "Only admins can delete shift events"
  ON public.shift_events
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Enable realtime for shift_events
ALTER PUBLICATION supabase_realtime ADD TABLE public.shift_events;