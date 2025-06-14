
-- Table to store notes for a project on a specific date
CREATE TABLE public.project_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security and allow public access since there are no users yet
ALTER TABLE public.project_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access to project notes" ON public.project_notes FOR ALL TO public USING (true) WITH CHECK (true);

-- Table to store exceptions (days to skip) for a project phase
CREATE TABLE public.project_phase_exceptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  phase TEXT NOT NULL, -- e.g., 'millwork', 'stain'
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security and allow public access
ALTER TABLE public.project_phase_exceptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access to phase exceptions" ON public.project_phase_exceptions FOR ALL TO public USING (true) WITH CHECK (true);
