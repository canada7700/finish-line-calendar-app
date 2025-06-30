
-- Remove individual team member tracking tables
DROP TABLE IF EXISTS project_assignments CASCADE;
DROP TABLE IF EXISTS daily_hour_allocations CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;

-- Create daily_phase_allocations table to track hours per project/phase/day (no team member reference)
CREATE TABLE public.daily_phase_allocations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  phase TEXT NOT NULL CHECK (phase IN ('millwork', 'boxConstruction', 'stain', 'install')),
  date DATE NOT NULL,
  allocated_hours INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, phase, date)
);

-- Create unscheduled_hours table to track hours that couldn't be auto-scheduled
CREATE TABLE public.unscheduled_hours (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  phase TEXT NOT NULL CHECK (phase IN ('millwork', 'boxConstruction', 'stain', 'install')),
  hours INTEGER NOT NULL DEFAULT 0,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, phase)
);

-- Create capacity_templates table for saving preset capacity profiles
CREATE TABLE public.capacity_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  millwork_hours INTEGER NOT NULL DEFAULT 24,
  box_construction_hours INTEGER NOT NULL DEFAULT 18,
  stain_hours INTEGER NOT NULL DEFAULT 12,
  install_hours INTEGER NOT NULL DEFAULT 18,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security for new tables
ALTER TABLE public.daily_phase_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unscheduled_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capacity_templates ENABLE ROW LEVEL SECURITY;

-- Create policies that allow everyone to read/write (since this is a company-wide tool)
CREATE POLICY "Allow public access on daily_phase_allocations" 
  ON public.daily_phase_allocations 
  FOR ALL 
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public access on unscheduled_hours" 
  ON public.unscheduled_hours 
  FOR ALL 
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public access on capacity_templates" 
  ON public.capacity_templates 
  FOR ALL 
  USING (true)
  WITH CHECK (true);

-- Update daily_phase_capacities with the new default values
UPDATE public.daily_phase_capacities SET max_hours = 24 WHERE phase = 'millwork';
UPDATE public.daily_phase_capacities SET max_hours = 18 WHERE phase = 'boxConstruction';
UPDATE public.daily_phase_capacities SET max_hours = 12 WHERE phase = 'stain';
UPDATE public.daily_phase_capacities SET max_hours = 18 WHERE phase = 'install';

-- Insert default capacity template
INSERT INTO public.capacity_templates (name, millwork_hours, box_construction_hours, stain_hours, install_hours)
VALUES ('Default Capacity', 24, 18, 12, 18);

-- Create indexes for better performance
CREATE INDEX idx_daily_phase_allocations_project_phase ON public.daily_phase_allocations(project_id, phase);
CREATE INDEX idx_daily_phase_allocations_date ON public.daily_phase_allocations(date);
CREATE INDEX idx_unscheduled_hours_project ON public.unscheduled_hours(project_id);
