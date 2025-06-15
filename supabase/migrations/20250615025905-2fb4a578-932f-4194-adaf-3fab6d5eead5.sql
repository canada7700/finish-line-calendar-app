
-- Drop the existing CHECK constraint on the phase column.
-- NOTE: This change is necessary to distinguish between millwork and box construction phases.
-- If you have existing assignments with the 'shop' phase, they will need to be updated manually after this migration.
ALTER TABLE public.project_assignments DROP CONSTRAINT project_assignments_phase_check;

-- Add a new CHECK constraint to allow for more granular phase tracking.
ALTER TABLE public.project_assignments ADD CONSTRAINT project_assignments_phase_check
CHECK (phase IN ('millwork', 'boxConstruction', 'stain', 'install'));

-- Add a column to track actual hours spent, for performance analysis.
-- This column can be filled in later as work is completed.
ALTER TABLE public.project_assignments ADD COLUMN actual_hours INTEGER;
