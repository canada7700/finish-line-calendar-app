
-- Drop the existing constraint that doesn't include 'custom'
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_status_check;

-- Add the new constraint that includes 'custom' as a valid status
ALTER TABLE public.projects ADD CONSTRAINT projects_status_check 
  CHECK (status = ANY (ARRAY['planning'::text, 'shop'::text, 'stain'::text, 'install'::text, 'completed'::text, 'custom'::text]));
