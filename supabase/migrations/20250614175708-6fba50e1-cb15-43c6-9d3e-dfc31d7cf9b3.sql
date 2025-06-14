
-- Table to store general notes for a specific date
CREATE TABLE public.daily_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security and allow public access
ALTER TABLE public.daily_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access to daily notes" ON public.daily_notes FOR ALL TO public USING (true) WITH CHECK (true);
