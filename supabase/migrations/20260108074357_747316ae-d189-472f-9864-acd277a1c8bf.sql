-- 故障树配置表
CREATE TABLE public.fault_trees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  image_url TEXT,
  top_event_tag_id TEXT,
  area_id TEXT NOT NULL,
  position JSONB DEFAULT '{"x": 10, "y": 60}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Bow-Tie配置表
CREATE TABLE public.bow_ties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  area_id TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 启用RLS
ALTER TABLE public.fault_trees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bow_ties ENABLE ROW LEVEL SECURITY;

-- fault_trees RLS 策略
CREATE POLICY "Authenticated users can view fault trees"
ON public.fault_trees FOR SELECT
USING (true);

CREATE POLICY "Admins can insert fault trees"
ON public.fault_trees FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update fault trees"
ON public.fault_trees FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete fault trees"
ON public.fault_trees FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- bow_ties RLS 策略
CREATE POLICY "Authenticated users can view bow ties"
ON public.bow_ties FOR SELECT
USING (true);

CREATE POLICY "Admins can insert bow ties"
ON public.bow_ties FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update bow ties"
ON public.bow_ties FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete bow ties"
ON public.bow_ties FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- 更新时间触发器
CREATE TRIGGER update_fault_trees_updated_at
BEFORE UPDATE ON public.fault_trees
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bow_ties_updated_at
BEFORE UPDATE ON public.bow_ties
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 启用实时
ALTER PUBLICATION supabase_realtime ADD TABLE public.fault_trees;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bow_ties;