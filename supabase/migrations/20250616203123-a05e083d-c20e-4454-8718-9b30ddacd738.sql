
-- Add new columns for millwork and box construction capabilities
ALTER TABLE public.team_members 
ADD COLUMN can_do_millwork BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN can_do_boxes BOOLEAN NOT NULL DEFAULT true;

-- For existing team members, if they could do shop work, they can do both millwork and boxes
UPDATE public.team_members 
SET can_do_millwork = can_do_shop, 
    can_do_boxes = can_do_shop;

-- Remove the old can_do_shop column
ALTER TABLE public.team_members DROP COLUMN can_do_shop;
