
-- Remove the unique constraint that prevents multiple team members from working the same hour block
ALTER TABLE public.daily_hour_allocations DROP CONSTRAINT daily_hour_allocations_team_member_id_date_hour_block_key;

-- Add a new constraint to prevent duplicate assignments for the same team member, project, phase, and hour block on the same day
-- This allows multiple people to work the same hour block, but prevents double-booking the same person
ALTER TABLE public.daily_hour_allocations ADD CONSTRAINT daily_hour_allocations_unique_assignment 
UNIQUE(team_member_id, project_id, phase, date, hour_block);
