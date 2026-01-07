-- Create storage bucket for process images
INSERT INTO storage.buckets (id, name, public)
VALUES ('process-images', 'process-images', true);

-- Storage RLS: Anyone can view public bucket images
CREATE POLICY "Anyone can view process images"
ON storage.objects FOR SELECT
USING (bucket_id = 'process-images');

-- Storage RLS: Only admins can upload
CREATE POLICY "Only admins can upload process images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'process-images' AND has_role(auth.uid(), 'admin'));

-- Storage RLS: Only admins can update
CREATE POLICY "Only admins can update process images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'process-images' AND has_role(auth.uid(), 'admin'));

-- Storage RLS: Only admins can delete
CREATE POLICY "Only admins can delete process images"
ON storage.objects FOR DELETE
USING (bucket_id = 'process-images' AND has_role(auth.uid(), 'admin'));

-- Create process_areas table
CREATE TABLE public.process_areas (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  tag_ids TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.process_areas ENABLE ROW LEVEL SECURITY;

-- RLS: All authenticated users can view
CREATE POLICY "Authenticated users can view process areas"
ON public.process_areas FOR SELECT
USING (true);

-- RLS: Only admins can insert
CREATE POLICY "Only admins can insert process areas"
ON public.process_areas FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS: Only admins can update
CREATE POLICY "Only admins can update process areas"
ON public.process_areas FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- RLS: Only admins can delete
CREATE POLICY "Only admins can delete process areas"
ON public.process_areas FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Add timestamp trigger
CREATE TRIGGER update_process_areas_updated_at
BEFORE UPDATE ON public.process_areas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default areas from mock data
INSERT INTO public.process_areas (id, name, description, tag_ids) VALUES
('reactor', '反应器区', '催化裂化反应器监控区域', ARRAY['TI-101', 'PI-101', 'FI-101', 'LI-101']),
('regenerator', '再生器区', '催化剂再生系统监控区域', ARRAY['TI-201', 'PI-201', 'AI-201']),
('fractionator', '分馏塔区', '产品分馏系统监控区域', ARRAY['TI-301', 'PI-301', 'FI-301']);