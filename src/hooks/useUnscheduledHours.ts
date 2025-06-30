
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { UnscheduledHours } from '../types/project';
import { toast } from '@/hooks/use-toast';

export const useUnscheduledHours = () => {
  return useQuery({
    queryKey: ['unscheduled-hours'],
    queryFn: async (): Promise<UnscheduledHours[]> => {
      const { data, error } = await supabase
        .from('unscheduled_hours')
        .select(`
          *,
          project:projects(id, job_name)
        `)
        .gt('hours', 0)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching unscheduled hours:', error);
        throw error;
      }

      return data.map((d: any) => ({
        id: d.id,
        projectId: d.project_id,
        phase: d.phase,
        hours: d.hours,
        reason: d.reason,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
        project: d.project ? {
          id: d.project.id,
          jobName: d.project.job_name,
        } : undefined,
      }));
    },
  });
};

export const useCreateUnscheduledHours = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (unscheduled: Omit<UnscheduledHours, 'id' | 'createdAt' | 'updatedAt' | 'project'>) => {
      const { data, error } = await supabase
        .from('unscheduled_hours')
        .upsert({
          project_id: unscheduled.projectId,
          phase: unscheduled.phase,
          hours: unscheduled.hours,
          reason: unscheduled.reason,
        }, {
          onConflict: 'project_id,phase'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unscheduled-hours'] });
    },
    onError: (error: any) => {
      console.error('Failed to create unscheduled hours:', error);
    },
  });
};

export const useClearUnscheduledHours = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, phase }: { projectId: string; phase: string }) => {
      const { error } = await supabase
        .from('unscheduled_hours')
        .delete()
        .eq('project_id', projectId)
        .eq('phase', phase);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unscheduled-hours'] });
    },
    onError: (error: any) => {
      console.error('Failed to clear unscheduled hours:', error);
    },
  });
};
