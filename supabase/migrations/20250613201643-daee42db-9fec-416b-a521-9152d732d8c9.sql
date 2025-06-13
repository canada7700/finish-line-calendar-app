
-- Create the projects table with all required fields
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_name TEXT NOT NULL,
  job_description TEXT NOT NULL,
  shop_hrs INTEGER NOT NULL DEFAULT 0,
  stain_hrs INTEGER NOT NULL DEFAULT 0,
  install_hrs INTEGER NOT NULL DEFAULT 0,
  install_date DATE NOT NULL,
  material_order_date DATE,
  box_toekick_assembly_date DATE,
  milling_fillers_date DATE,
  stain_lacquer_date DATE,
  shop_start_date DATE,
  stain_start_date DATE,
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'shop', 'stain', 'install', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS) - making it public for now since this is a company-wide tool
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Create policy that allows everyone to read all projects
CREATE POLICY "Allow public read access on projects" 
  ON public.projects 
  FOR SELECT 
  USING (true);

-- Create policy that allows everyone to insert projects
CREATE POLICY "Allow public insert access on projects" 
  ON public.projects 
  FOR INSERT 
  WITH CHECK (true);

-- Create policy that allows everyone to update projects
CREATE POLICY "Allow public update access on projects" 
  ON public.projects 
  FOR UPDATE 
  USING (true);

-- Create policy that allows everyone to delete projects
CREATE POLICY "Allow public delete access on projects" 
  ON public.projects 
  FOR DELETE 
  USING (true);

-- Insert the sample data from your app
INSERT INTO public.projects (
  job_name, 
  job_description, 
  shop_hrs, 
  stain_hrs, 
  install_hrs, 
  install_date,
  material_order_date,
  box_toekick_assembly_date,
  milling_fillers_date,
  stain_lacquer_date,
  status
) VALUES 
(
  'RACHEL WARKENTIN',
  'CABINETS',
  183,
  80,
  102,
  '2025-08-15',
  '2025-06-16',
  '2025-07-29',
  '2025-07-07',
  '2025-07-26',
  'shop'
),
(
  'ANDREA ENG',
  'CABINETS',
  65,
  70,
  68,
  '2025-08-27',
  '2025-06-28',
  '2025-08-21',
  '2025-08-03',
  '2025-08-09',
  'planning'
);
