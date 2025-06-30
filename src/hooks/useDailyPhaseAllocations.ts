
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DailyPhaseAllocation } from '../types/project';
import { toast } from '@/hooks/use-toast';

export const useDailyPhaseAllocations = (dateRange?: { start: Date; end: Date }) => {
  return useQuery({
    queryKey: ['daily-phase-allocations', dateRange],
    queryFn: async (): Promise<DailyPhaseAllocation[]> => {
      let query = supabase
        .from('daily_phase_allocations')
        .select(`
          *,
          project:projects(id, job_name)
        `)
        .order('date', { ascending: true });

      if (dateRange) {
        query = query
          .gte('date', dateRange.start.toISOString().split('T')[0])
          .lte('date', dateRange.end.toISOString().split('T')[0]);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching daily phase allocations:', error);
        throw error;
      }

      return data.map((d: any) => ({
        id: d.id,
        projectId: d.project_id,
        phase: d.phase,
        date: d.date,
        allocatedHours: d.allocated_hours,
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

export const useCreatePhaseAllocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (allocation: Omit<DailyPhaseAllocation, 'id' | 'createdAt' | 'updatedAt' | 'project'>) => {
      const { data, error } = await supabase
        .from('daily_phase_allocations')
        .insert({
          project_id: allocation.projectId,
          phase: allocation.phase,
          date: allocation.date,
          allocated_hours: allocation.allocatedHours,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-phase-allocations'] });
      toast({
        title: "Hours Scheduled",
        description: "Phase hours have been allocated to the calendar.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to schedule hours: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};

export const useUpdatePhaseAllocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, allocatedHours }: { id: string; allocatedHours: number }) => {
      const { data, error } = await supabase
        .from('daily_phase_allocations')
        .update({ allocated_hours: allocatedHours })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-phase-allocations'] });
      toast({
        title: "Hours Updated",
        description: "Phase allocation has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to update hours: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};

export const useDeletePhaseAllocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('daily_phase_allocations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-phase-allocations'] });
      toast({
        title: "Hours Removed",
        description: "Phase allocation has been removed from the calendar.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to remove hours: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};
