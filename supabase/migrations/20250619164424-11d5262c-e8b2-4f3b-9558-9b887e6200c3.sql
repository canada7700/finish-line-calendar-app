
-- Fix the double-booking vulnerability by updating the unique constraint
-- Remove the existing constraint that allows same team member to work multiple projects in same hour
ALTER TABLE public.daily_hour_allocations DROP CONSTRAINT daily_hour_allocations_unique_assignment;

-- Add a stricter constraint: prevent any team member from being booked for the same time slot on the same day
-- regardless of project or phase
ALTER TABLE public.daily_hour_allocations ADD CONSTRAINT daily_hour_allocations_no_double_booking 
UNIQUE(team_member_id, date, hour_block);
