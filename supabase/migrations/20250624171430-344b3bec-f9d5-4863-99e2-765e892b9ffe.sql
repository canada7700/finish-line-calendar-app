
-- Create table for daily phase capacity overrides
CREATE TABLE public.daily_phase_capacity_overrides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  phase TEXT NOT NULL,
  adjusted_capacity INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(date, phase)
);

-- Add trigger for updated_at
CREATE TRIGGER update_daily_phase_capacity_overrides_updated_at 
  BEFORE UPDATE ON public.daily_phase_capacity_overrides 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for efficient querying
CREATE INDEX idx_daily_phase_capacity_overrides_date_phase 
  ON public.daily_phase_capacity_overrides(date, phase);
