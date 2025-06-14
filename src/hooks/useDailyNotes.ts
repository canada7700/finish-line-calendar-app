
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DailyNote } from '../types/project';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export const useDailyNotes = (startDate: Date, endDate: Date) => {
  return useQuery({
    queryKey: ['daily_notes', format(startDate, 'yyyy-MM'), format(endDate, 'yyyy-MM')],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_notes')
        .select('*')
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'));
      
      if (error) {
        console.error('Error fetching daily notes:', error);
        throw error;
      }
      return data as DailyNote[];
    },
  });
};

export const useUpsertDailyNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (note: Pick<DailyNote, 'date' | 'note'>) => {
      const { data, error } = await supabase
        .from('daily_notes')
        .upsert({
          date: note.date,
          note: note.note,
        }, { onConflict: 'date' })
        .select()
        .single();
      
      if (error) {
        console.error('Error upserting daily note:', error);
        toast({ title: 'Error', description: 'Failed to save daily note.', variant: 'destructive' });
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily_notes'] });
      toast({ title: 'Note Saved', description: 'Your daily note has been saved.' });
    },
    onError: () => {
      // The general error is handled in the mutationFn, but we can add more specific UI feedback here if needed.
    }
  });
};
