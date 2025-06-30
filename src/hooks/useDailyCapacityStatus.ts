
import { useMemo } from 'react';
import { useDailyPhaseAllocations } from './useDailyPhaseAllocations';
import { useDailyPhaseCapacities, calculateDayCapacityInfo } from './useDailyCapacities';
import { format, eachDayOfInterval } from 'date-fns';

export interface DailyCapacityStatus {
  date: string;
  totalAllocated: number;
  totalCapacity: number;
  utilizationPercent: number;
  status: 'fully-staffed' | 'partially-staffed' | 'under-staffed' | 'over-allocated' | 'no-work';
  hasOverAllocation: boolean;
}

export const useDailyCapacityStatus = (startDate: Date, endDate: Date) => {
  const { data: capacities = [] } = useDailyPhaseCapacities();
  
  // Get all allocations for the entire date range in one query
  const { data: allAllocations = [] } = useDailyPhaseAllocations({ start: startDate, end: endDate });
  
  // Get all days in the range
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const capacityStatus = useMemo(() => {
    const statusMap = new Map<string, DailyCapacityStatus>();

    days.forEach(day => {
      const dateString = format(day, 'yyyy-MM-dd');
      
      // Filter allocations for this specific date
      const dayAllocations = allAllocations.filter(alloc => alloc.date === dateString);
      
      const { capacityInfo, hasOverAllocation, totalAllocated } = calculateDayCapacityInfo(day, dayAllocations, capacities);
      
      const totalCapacity = capacityInfo.reduce((sum, info) => sum + info.capacity, 0);
      
      let status: DailyCapacityStatus['status'] = 'no-work';
      let utilizationPercent = 0;
      
      if (totalCapacity > 0) {
        utilizationPercent = Math.round((totalAllocated / totalCapacity) * 100);
        
        if (hasOverAllocation) {
          status = 'over-allocated';
        } else if (utilizationPercent >= 100) {
          status = 'fully-staffed';
        } else if (utilizationPercent >= 50) {
          status = 'partially-staffed';
        } else if (totalAllocated > 0) {
          status = 'under-staffed';
        } else {
          status = 'no-work';
        }
      }

      statusMap.set(dateString, {
        date: dateString,
        totalAllocated,
        totalCapacity,
        utilizationPercent,
        status,
        hasOverAllocation,
      });
    });

    return statusMap;
  }, [days, allAllocations, capacities]);

  return capacityStatus;
};
