
-- Create table for daily hour allocations (1-hour time blocks)
CREATE TABLE public.daily_hour_allocations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  team_member_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  phase TEXT NOT NULL,
  date DATE NOT NULL,
  hour_block INTEGER NOT NULL CHECK (hour_block >= 0 AND hour_block <= 23),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure unique allocation per team member per hour block per day
  UNIQUE(team_member_id, date, hour_block)
);

-- Create table for daily phase capacities (max hours per phase per day)
CREATE TABLE public.daily_phase_capacities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phase TEXT NOT NULL,
  max_hours INTEGER NOT NULL DEFAULT 8,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure unique capacity setting per phase
  UNIQUE(phase)
);

-- Insert default capacity values for each phase
INSERT INTO public.daily_phase_capacities (phase, max_hours) VALUES
  ('millwork', 36),
  ('boxConstruction', 12),
  ('stain', 8),
  ('install', 18);

-- Add indexes for better performance
CREATE INDEX idx_daily_hour_allocations_date ON public.daily_hour_allocations(date);
CREATE INDEX idx_daily_hour_allocations_project_date ON public.daily_hour_allocations(project_id, date);
CREATE INDEX idx_daily_hour_allocations_team_member_date ON public.daily_hour_allocations(team_member_id, date);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_daily_hour_allocations_updated_at 
  BEFORE UPDATE ON public.daily_hour_allocations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_phase_capacities_updated_at 
  BEFORE UPDATE ON public.daily_phase_capacities 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (though we'll keep it permissive for now)
ALTER TABLE public.daily_hour_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_phase_capacities ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for now (can be tightened later if auth is added)
CREATE POLICY "Allow all operations on daily_hour_allocations" ON public.daily_hour_allocations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on daily_phase_capacities" ON public.daily_phase_capacities FOR ALL USING (true) WITH CHECK (true);
