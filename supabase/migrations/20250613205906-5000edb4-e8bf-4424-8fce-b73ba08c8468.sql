
-- Create holidays table to store holiday dates and names
CREATE TABLE public.holidays (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  date DATE NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create settings table to store working hours and other configuration
CREATE TABLE public.settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS) for both tables
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Create policies that allow everyone to read/write (since this is a company-wide tool)
CREATE POLICY "Allow public access on holidays" 
  ON public.holidays 
  FOR ALL 
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public access on settings" 
  ON public.settings 
  FOR ALL 
  USING (true)
  WITH CHECK (true);

-- Insert default holidays
INSERT INTO public.holidays (name, date) VALUES 
('New Year''s Day', '2025-01-01'),
('Christmas Day', '2025-12-25');

-- Insert default settings for working hours
INSERT INTO public.settings (key, value) VALUES 
('shop_hours_per_day', '8'),
('stain_hours_per_day', '6');
