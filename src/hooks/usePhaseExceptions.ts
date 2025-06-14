
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ProjectPhase } from '../types/project';

export interface PhaseException {
  id: string;
  project_id: string;
  phase: ProjectPhase['phase'];
  date: string; // YYYY-MM-DD
  created_at: string;
}

// Fetch all phase exceptions
export const usePhaseExceptions = () => {
  return useQuery({
    queryKey: ['phase_exceptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_phase_exceptions')
        .select('*');
      
      if (error) {
        console.error('Error fetching phase exceptions:', error);
        throw error;
      }
      return data as PhaseException[];
    },
  });
};

// Add a phase exception (i.e., "delete" a phase for a day)
export const useAddPhaseException = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (exception: Pick<PhaseException, 'project_id' | 'phase' | 'date'>) => {
      const { data, error } = await supabase
        .from('project_phase_exceptions')
        .insert(exception)
        .select()
        .single();
      
      if (error) {
        console.error('Error adding phase exception:', error);
        toast({ title: 'Error', description: 'Could not remove phase day.', variant: 'destructive' });
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase_exceptions'] });
      toast({ title: 'Phase Day Removed', description: 'The phase has been removed from this day.' });
    },
  });
};
