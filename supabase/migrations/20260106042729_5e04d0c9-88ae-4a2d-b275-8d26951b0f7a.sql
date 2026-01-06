-- Create table for alarm records
CREATE TABLE public.alarms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tag_id TEXT NOT NULL,
  tag_name TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('warning', 'alarm')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  acknowledged BOOLEAN NOT NULL DEFAULT false,
  acknowledged_by TEXT,
  acknowledged_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.alarms ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (DCS systems typically allow all operators to view)
CREATE POLICY "Anyone can view alarms" 
ON public.alarms 
FOR SELECT 
USING (true);

-- Create policy for public insert (system generates alarms)
CREATE POLICY "System can insert alarms" 
ON public.alarms 
FOR INSERT 
WITH CHECK (true);

-- Create policy for public update (operators can acknowledge)
CREATE POLICY "Anyone can update alarms" 
ON public.alarms 
FOR UPDATE 
USING (true);

-- Enable realtime for alarms table
ALTER PUBLICATION supabase_realtime ADD TABLE public.alarms;