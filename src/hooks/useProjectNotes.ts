
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProjectNote } from '../types/project';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export const useProjectNotes = (startDate: Date, endDate: Date) => {
  return useQuery({
    queryKey: ['project_notes', format(startDate, 'yyyy-MM'), format(endDate, 'yyyy-MM')],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_notes')
        .select('*')
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'));
      
      if (error) {
        console.error('Error fetching project notes:', error);
        throw error;
      }
      return data as ProjectNote[];
    },
  });
};

export const useUpsertNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (note: Pick<ProjectNote, 'project_id' | 'date' | 'note'>) => {
      const { data, error } = await supabase
        .from('project_notes')
        .upsert({
          project_id: note.project_id,
          date: note.date,
          note: note.note,
        }, { onConflict: 'project_id, date' })
        .select()
        .single();
      
      if (error) {
        console.error('Error upserting note:', error);
        toast({ title: 'Error', description: 'Failed to save note.', variant: 'destructive' });
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project_notes'] });
      toast({ title: 'Note Saved', description: 'Your note has been saved.' });
    },
  });
};
