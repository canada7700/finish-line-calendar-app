
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface DailyCapacityOverride {
  id: string;
  date: string;
  phase: string;
  adjustedCapacity: number;
  reason?: string;
  createdAt: string;
  updatedAt: string;
}

export const useDailyCapacityOverrides = (date: Date) => {
  const dateString = date.toISOString().split('T')[0];
  
  return useQuery({
    queryKey: ['daily-capacity-overrides', dateString],
    queryFn: async (): Promise<DailyCapacityOverride[]> => {
      const { data, error } = await supabase
        .from('daily_phase_capacity_overrides')
        .select('*')
        .eq('date', dateString)
        .order('phase', { ascending: true });

      if (error) {
        toast({ title: "Error fetching capacity overrides", description: error.message, variant: 'destructive' });
        throw new Error(error.message);
      }
      
      return data.map((d: any) => ({
        id: d.id,
        date: d.date,
        phase: d.phase,
        adjustedCapacity: d.adjusted_capacity,
        reason: d.reason,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      }));
    },
  });
};

export const useSetCapacityOverride = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ date, phase, adjustedCapacity, reason }: { 
      date: string; 
      phase: string; 
      adjustedCapacity: number; 
      reason?: string;
    }) => {
      const { data, error } = await supabase
        .from('daily_phase_capacity_overrides')
        .upsert({
          date,
          phase,
          adjusted_capacity: adjustedCapacity,
          reason: reason || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['daily-capacity-overrides'] });
      queryClient.invalidateQueries({ queryKey: ['daily-phase-capacities'] });
      toast({
        title: "Capacity Adjusted",
        description: `${data.phase} capacity set to ${data.adjusted_capacity} hours for ${data.date}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to adjust capacity: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};

export const useRemoveCapacityOverride = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ date, phase }: { date: string; phase: string }) => {
      const { error } = await supabase
        .from('daily_phase_capacity_overrides')
        .delete()
        .eq('date', date)
        .eq('phase', phase);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-capacity-overrides'] });
      queryClient.invalidateQueries({ queryKey: ['daily-phase-capacities'] });
      toast({
        title: "Capacity Reset",
        description: "Capacity has been reset to default value",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to reset capacity: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};
