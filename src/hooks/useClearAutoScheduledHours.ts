
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useClearAutoScheduledHours = () => {
  const queryClient = useQueryClient();

  const clearHoursMutation = useMutation({
    mutationFn: async ({ 
      projectId, 
      teamMemberId, 
      phase 
    }: { 
      projectId: string; 
      teamMemberId: string; 
      phase: string; 
    }) => {
      console.log(`🧹 Clearing auto-scheduled hours for ${phase} phase`);

      const { error } = await supabase
        .from('daily_hour_allocations')
        .delete()
        .eq('project_id', projectId)
        .eq('team_member_id', teamMemberId)
        .eq('phase', phase);

      if (error) {
        console.error('❌ Error clearing hours:', error);
        throw error;
      }

      console.log('✅ Successfully cleared auto-scheduled hours');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-hour-allocations'] });
      toast({
        title: "Hours Cleared",
        description: "Auto-scheduled hours have been removed from the calendar.",
      });
    },
    onError: (error: any) => {
      console.error('❌ Failed to clear hours:', error);
      toast({
        title: "Error",
        description: "Failed to clear scheduled hours from calendar.",
        variant: "destructive",
      });
    },
  });

  return {
    clearHours: clearHoursMutation.mutate,
    isClearing: clearHoursMutation.isPending,
  };
};
