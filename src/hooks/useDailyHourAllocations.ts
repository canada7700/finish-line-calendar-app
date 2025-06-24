
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DailyHourAllocation } from '../types/project';
import { toast } from '@/hooks/use-toast';

export const useDailyHourAllocations = (date?: Date) => {
  return useQuery({
    queryKey: ['daily-hour-allocations', date?.toISOString()],
    queryFn: async (): Promise<DailyHourAllocation[]> => {
      let query = supabase
        .from('daily_hour_allocations')
        .select(`
          *,
          team_members (*),
          projects (id, job_name)
        `)
        .order('hour_block', { ascending: true });

      if (date) {
        const dateString = date.toISOString().split('T')[0];
        query = query.eq('date', dateString);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching hour allocations:', error);
        toast({ title: "Error fetching hour allocations", description: error.message, variant: 'destructive' });
        throw new Error(error.message);
      }
      
      return data.map((d: any) => ({
        id: d.id,
        projectId: d.project_id,
        teamMemberId: d.team_member_id,
        phase: d.phase,
        date: d.date,
        hourBlock: d.hour_block,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
        teamMember: d.team_members ? {
          id: d.team_members.id,
          name: d.team_members.name,
          email: d.team_members.email,
          weeklyHours: d.team_members.weekly_hours,
          hourlyRate: d.team_members.hourly_rate,
          canDoMillwork: d.team_members.can_do_millwork,
          canDoBoxes: d.team_members.can_do_boxes,
          canDoStain: d.team_members.can_do_stain,
          canDoInstall: d.team_members.can_do_install,
          isActive: d.team_members.is_active,
          createdAt: d.team_members.created_at,
          updatedAt: d.team_members.updated_at,
        } : undefined,
        project: d.projects ? {
          id: d.projects.id,
          jobName: d.projects.job_name,
        } : undefined,
      }));
    },
  });
};

export const useAddHourAllocation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (allocationData: Omit<DailyHourAllocation, 'id' | 'createdAt' | 'updatedAt' | 'teamMember' | 'project'>) => {
      console.log('Adding hour allocation:', allocationData);
      
      const { data, error } = await supabase
        .from('daily_hour_allocations')
        .insert({
          project_id: allocationData.projectId,
          team_member_id: allocationData.teamMemberId,
          phase: allocationData.phase,
          date: allocationData.date,
          hour_block: allocationData.hourBlock,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding hour allocation:', error);
        throw error;
      }
      
      console.log('Successfully added hour allocation:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-hour-allocations'] });
      toast({
        title: "Hour Allocated",
        description: "Hour block has been assigned successfully.",
      });
    },
    onError: (error: any) => {
      console.error('Failed to allocate hour:', error);
      toast({
        title: "Error",
        description: `Failed to allocate hour: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};

export const useAddHourAllocationSilent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (allocationData: Omit<DailyHourAllocation, 'id' | 'createdAt' | 'updatedAt' | 'teamMember' | 'project'>) => {
      console.log('Adding silent hour allocation:', allocationData);
      
      const { data, error } = await supabase
        .from('daily_hour_allocations')
        .insert({
          project_id: allocationData.projectId,
          team_member_id: allocationData.teamMemberId,
          phase: allocationData.phase,
          date: allocationData.date,
          hour_block: allocationData.hourBlock,
        })
        .select()
        .single();

      if (error) {
        console.error('Error in silent allocation:', error);
        throw error;
      }
      
      console.log('Successfully added silent allocation:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-hour-allocations'] });
      // No toast notification for silent operations
    },
    onError: (error: any) => {
      console.error('Silent allocation error:', error);
      throw error;
    },
  });
};

export const useRemoveHourAllocation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (allocationId: string) => {
      console.log('Removing hour allocation:', allocationId);
      
      const { error } = await supabase
        .from('daily_hour_allocations')
        .delete()
        .eq('id', allocationId);

      if (error) {
        console.error('Error removing hour allocation:', error);
        throw error;
      }
      
      console.log('Successfully removed hour allocation');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-hour-allocations'] });
      toast({
        title: "Hour Removed",
        description: "Hour allocation has been removed successfully.",
      });
    },
    onError: (error: any) => {
      console.error('Failed to remove hour allocation:', error);
      toast({
        title: "Error",
        description: `Failed to remove hour allocation: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};
