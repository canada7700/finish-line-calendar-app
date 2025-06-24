
import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DailyCapacityStatus } from '@/hooks/useDailyCapacityStatus';

interface CapacityStatusIndicatorProps {
  status: DailyCapacityStatus;
  phases?: Array<{ phase: string; allocated: number; capacity: number }>;
}

const CapacityStatusIndicator = ({ status, phases = [] }: CapacityStatusIndicatorProps) => {
  const getIndicatorColor = () => {
    switch (status.status) {
      case 'fully-staffed':
        return 'bg-green-500';
      case 'partially-staffed':
        return 'bg-yellow-500';
      case 'under-staffed':
        return 'bg-orange-500';
      case 'over-allocated':
        return 'bg-red-500';
      case 'no-work':
      default:
        return 'bg-gray-300';
    }
  };

  const getStatusText = () => {
    switch (status.status) {
      case 'fully-staffed':
        return 'Fully Staffed';
      case 'partially-staffed':
        return 'Partially Staffed';
      case 'under-staffed':
        return 'Under Staffed';
      case 'over-allocated':
        return 'Over Allocated';
      case 'no-work':
      default:
        return 'No Work Scheduled';
    }
  };

  if (status.totalCapacity === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`w-3 h-3 rounded-full ${getIndicatorColor()} border border-white shadow-sm`}
            aria-label={`Capacity status: ${getStatusText()}`}
          />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-64">
          <div className="space-y-1">
            <div className="font-medium">{getStatusText()}</div>
            <div className="text-sm">
              Total: {status.totalAllocated}/{status.totalCapacity} hours ({status.utilizationPercent}%)
            </div>
            {phases.length > 0 && (
              <div className="text-xs space-y-1 pt-1 border-t">
                {phases.map((phase) => (
                  <div key={phase.phase} className="flex justify-between">
                    <span className="capitalize">{phase.phase}:</span>
                    <span>{phase.allocated}/{phase.capacity}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default CapacityStatusIndicator;
