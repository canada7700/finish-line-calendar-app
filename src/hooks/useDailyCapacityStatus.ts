
import { useMemo } from 'react';
import { useDailyHourAllocations } from './useDailyHourAllocations';
import { useDailyPhaseCapacities, useDayCapacityInfo } from './useDailyCapacities';
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
  
  // Get all allocations for the date range
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  
  // Create queries for each day (this could be optimized with a single range query)
  const allocationQueries = days.map(day => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { data: allocations = [] } = useDailyHourAllocations(day);
    return { date: format(day, 'yyyy-MM-dd'), allocations };
  });

  const capacityStatus = useMemo(() => {
    const statusMap = new Map<string, DailyCapacityStatus>();

    allocationQueries.forEach(({ date, allocations }) => {
      const dayDate = new Date(date);
      const { capacityInfo, hasOverAllocation, totalAllocated } = useDayCapacityInfo(dayDate, allocations, capacities);
      
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

      statusMap.set(date, {
        date,
        totalAllocated,
        totalCapacity,
        utilizationPercent,
        status,
        hasOverAllocation,
      });
    });

    return statusMap;
  }, [allocationQueries, capacities]);

  return capacityStatus;
};
