
-- Create team_members table to store individual team members with their weekly capacity
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  weekly_hours INTEGER NOT NULL DEFAULT 40,
  hourly_rate DECIMAL(10,2),
  can_do_shop BOOLEAN NOT NULL DEFAULT true,
  can_do_stain BOOLEAN NOT NULL DEFAULT true,
  can_do_install BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project_assignments table to track which team members are assigned to which project phases
CREATE TABLE public.project_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  team_member_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  phase TEXT NOT NULL CHECK (phase IN ('shop', 'stain', 'install')),
  assigned_hours INTEGER NOT NULL DEFAULT 0,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, team_member_id, phase)
);

-- Enable Row Level Security for both tables
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies that allow everyone to read/write (since this is a company-wide tool)
CREATE POLICY "Allow public access on team_members" 
  ON public.team_members 
  FOR ALL 
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public access on project_assignments" 
  ON public.project_assignments 
  FOR ALL 
  USING (true)
  WITH CHECK (true);

-- Insert sample team members based on client's example
INSERT INTO public.team_members (name, email, weekly_hours, can_do_shop, can_do_stain, can_do_install) VALUES 
('Jesse', 'jesse@company.com', 20, true, true, true),
('Dan', 'dan@company.com', 40, true, true, true),
('Dirk', 'dirk@company.com', 40, true, true, true);

-- Create indexes for better performance
CREATE INDEX idx_project_assignments_project_id ON public.project_assignments(project_id);
CREATE INDEX idx_project_assignments_team_member_id ON public.project_assignments(team_member_id);
CREATE INDEX idx_project_assignments_phase ON public.project_assignments(phase);
CREATE INDEX idx_team_members_active ON public.team_members(is_active) WHERE is_active = true;
