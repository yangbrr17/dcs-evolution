-- Add display_order column to process_areas for controlling tab order
ALTER TABLE public.process_areas ADD COLUMN display_order INTEGER DEFAULT 0;

-- Set the correct display order: Overview -> Reactor -> Regenerator -> Fractionator
UPDATE public.process_areas SET display_order = 0 WHERE id = 'overview';
UPDATE public.process_areas SET display_order = 1 WHERE id = 'reactor';
UPDATE public.process_areas SET display_order = 2 WHERE id = 'regenerator';
UPDATE public.process_areas SET display_order = 3 WHERE id = 'fractionator';