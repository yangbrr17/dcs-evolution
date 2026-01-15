-- Create tag_history table for storing real historical data
CREATE TABLE public.tag_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  value NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tag_id, timestamp)
);

-- Index for efficient queries
CREATE INDEX idx_tag_history_lookup 
ON public.tag_history(tag_id, timestamp DESC);

-- Enable RLS
ALTER TABLE public.tag_history ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read
CREATE POLICY "Authenticated users can read tag history"
ON public.tag_history FOR SELECT TO authenticated USING (true);

-- Operators and admins can insert
CREATE POLICY "Operators and admins can insert tag history"
ON public.tag_history FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'operator'::app_role));

-- Admins can delete
CREATE POLICY "Admins can delete tag history"
ON public.tag_history FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update (for corrections)
CREATE POLICY "Admins can update tag history"
ON public.tag_history FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));