
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DailyPhaseCapacity, DayCapacityInfo, DailyHourAllocation } from '../types/project';
import { toast } from '@/hooks/use-toast';
import { useDailyCapacityOverrides } from './useDailyCapacityOverrides';

export const useDailyPhaseCapacities = () => {
  return useQuery({
    queryKey: ['daily-phase-capacities'],
    queryFn: async (): Promise<DailyPhaseCapacity[]> => {
      const { data, error } = await supabase
        .from('daily_phase_capacities')
        .select('*')
        .order('phase', { ascending: true });

      if (error) {
        toast({ title: "Error fetching phase capacities", description: error.message, variant: 'destructive' });
        throw new Error(error.message);
      }
      
      return data.map((d: any) => ({
        id: d.id,
        phase: d.phase,
        maxHours: d.max_hours,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      }));
    },
  });
};

export const useUpdatePhaseCapacity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ phase, maxHours }: { phase: string; maxHours: number }) => {
      const { data, error } = await supabase
        .from('daily_phase_capacities')
        .update({ max_hours: maxHours })
        .eq('phase', phase)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-phase-capacities'] });
      toast({
        title: "Capacity Updated",
        description: "Phase capacity has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to update capacity: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};

export const useDayCapacityInfo = (date: Date, allocations: DailyHourAllocation[], capacities: DailyPhaseCapacity[]) => {
  // Use a more resilient approach for capacity overrides - don't fail if they can't be loaded
  const { data: overrides = [], error: overridesError } = useDailyCapacityOverrides(date);
  const dateString = date.toISOString().split('T')[0];
  
  // Log override errors but don't break the flow
  if (overridesError) {
    console.warn('Failed to load capacity overrides, using default capacities:', overridesError);
  }
  
  const capacityInfo: DayCapacityInfo[] = capacities.map(capacity => {
    const allocated = allocations.filter(
      allocation => allocation.date === dateString && allocation.phase === capacity.phase
    ).length;

    // Check if there's an override for this phase on this date, but handle gracefully if overrides failed
    let override = null;
    try {
      override = overrides?.find(o => o.phase === capacity.phase) || null;
    } catch (error) {
      console.warn('Error processing capacity override:', error);
      override = null;
    }
    
    const effectiveCapacity = override ? override.adjustedCapacity : capacity.maxHours;

    return {
      phase: capacity.phase,
      allocated,
      capacity: effectiveCapacity,
      defaultCapacity: capacity.maxHours,
      isOverAllocated: allocated > effectiveCapacity,
      hasOverride: !!override,
      overrideReason: override?.reason,
    };
  });

  const hasOverAllocation = capacityInfo.some(info => info.isOverAllocated);
  const totalAllocated = capacityInfo.reduce((sum, info) => sum + info.allocated, 0);

  return {
    capacityInfo,
    hasOverAllocation,
    totalAllocated,
    overrides: overrides || [], // Ensure overrides is always an array
  };
};
