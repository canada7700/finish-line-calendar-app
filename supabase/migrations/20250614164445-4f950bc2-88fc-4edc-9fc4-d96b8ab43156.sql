
-- Add new columns for millwork and box construction hours
ALTER TABLE public.projects ADD COLUMN millwork_hrs integer NOT NULL DEFAULT 0;
ALTER TABLE public.projects ADD COLUMN box_construction_hrs integer NOT NULL DEFAULT 0;

-- Distribute existing shop_hrs to the new columns, splitting them 50/50
UPDATE public.projects
SET
  millwork_hrs = floor(shop_hrs * 0.5),
  box_construction_hrs = ceil(shop_hrs * 0.5);

-- Add new columns for the start dates of the new phases
ALTER TABLE public.projects ADD COLUMN millwork_start_date date;
ALTER TABLE public.projects ADD COLUMN box_construction_start_date date;

-- Migrate existing shop_start_date to millwork_start_date
UPDATE public.projects SET millwork_start_date = shop_start_date;

-- Drop the old, now-replaced columns
ALTER TABLE public.projects DROP COLUMN shop_hrs;
ALTER TABLE public.projects DROP COLUMN shop_start_date;
