
import * as React from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DailyPhaseAllocation } from '../types/project';
import { useDailyPhaseAllocations } from '../hooks/useDailyPhaseAllocations';
import { useDailyPhaseCapacities, useDayCapacityInfo } from '../hooks/useDailyCapacities';
import CapacityOverviewTab from './CapacityOverviewTab';
import PhaseAllocationsView from './PhaseAllocationsView';

interface CapacityManagementDialogProps {
  date: Date;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CapacityManagementDialog = ({ date, open, onOpenChange }: CapacityManagementDialogProps) => {
  const { data: allocations = [], isLoading: isLoadingAllocations } = useDailyPhaseAllocations({ 
    start: date, 
    end: date 
  });
  const { data: capacities = [], isLoading: isLoadingCapacities } = useDailyPhaseCapacities();

  // Filter allocations for the specific date
  const dateString = format(date, 'yyyy-MM-dd');
  const dayAllocations = allocations.filter(alloc => alloc.date === dateString);

  // Use resilient capacity info that handles failures gracefully
  const { capacityInfo, hasOverAllocation } = useDayCapacityInfo(date, dayAllocations, capacities);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Capacity Management - {format(date, 'MMMM d, yyyy')}</DialogTitle>
          <DialogDescription>
            Manage daily capacity and view phase allocations for this date.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Capacity Overview</TabsTrigger>
            <TabsTrigger value="allocations">Phase Allocations</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <CapacityOverviewTab
              capacityInfo={capacityInfo}
              hasOverAllocation={hasOverAllocation}
              isLoadingCapacities={isLoadingCapacities}
              date={date}
            />
          </TabsContent>

          <TabsContent value="allocations">
            <PhaseAllocationsView
              allocations={dayAllocations}
              date={date}
              capacityInfo={capacityInfo}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CapacityManagementDialog;
