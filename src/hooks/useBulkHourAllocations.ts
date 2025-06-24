
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useRemoveMultipleHourAllocations = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ allocationIds }: { allocationIds: string[] }) => {
      console.log('Removing multiple hour allocations:', allocationIds);
      
      const { error } = await supabase
        .from('daily_hour_allocations')
        .delete()
        .in('id', allocationIds);

      if (error) {
        console.error('Error removing multiple hour allocations:', error);
        throw error;
      }
      
      console.log('Successfully removed multiple hour allocations');
      return allocationIds.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['daily-hour-allocations'] });
      toast({
        title: "Allocations Cleared",
        description: `Successfully removed ${count} hour allocations.`,
      });
    },
    onError: (error: any) => {
      console.error('Failed to remove multiple hour allocations:', error);
      toast({
        title: "Error",
        description: `Failed to clear allocations: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};

export const useClearDayAllocations = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ date }: { date: string }) => {
      console.log('Clearing all allocations for date:', date);
      
      const { error } = await supabase
        .from('daily_hour_allocations')
        .delete()
        .eq('date', date);

      if (error) {
        console.error('Error clearing day allocations:', error);
        throw error;
      }
      
      console.log('Successfully cleared all allocations for date');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-hour-allocations'] });
      toast({
        title: "Day Cleared",
        description: "All hour allocations for this day have been removed.",
      });
    },
    onError: (error: any) => {
      console.error('Failed to clear day allocations:', error);
      toast({
        title: "Error",
        description: `Failed to clear day: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};

export const useClearPersonDayAllocations = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ date, teamMemberId }: { date: string; teamMemberId: string }) => {
      console.log('Clearing allocations for person on date:', { date, teamMemberId });
      
      const { error } = await supabase
        .from('daily_hour_allocations')
        .delete()
        .eq('date', date)
        .eq('team_member_id', teamMemberId);

      if (error) {
        console.error('Error clearing person day allocations:', error);
        throw error;
      }
      
      console.log('Successfully cleared person day allocations');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-hour-allocations'] });
      toast({
        title: "Person's Day Cleared",
        description: "All hour allocations for this person have been removed.",
      });
    },
    onError: (error: any) => {
      console.error('Failed to clear person day allocations:', error);
      toast({
        title: "Error",
        description: `Failed to clear person's day: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};
