
import React, { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Grid3X3, List, Trash2, CalendarX } from 'lucide-react';
import { DailyHourAllocation } from '../../types/project';
import { useClearDayAllocations } from '../../hooks/useBulkHourAllocations';
import HourAllocationGrid from '../HourAllocationGrid';
import ClearAllocationsDialog from './ClearAllocationsDialog';

interface AllocationsTabProps {
  allocations: DailyHourAllocation[];
  date: Date;
  viewMode: 'grid' | 'list';
  isLoading: boolean;
  isDeleting: boolean;
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onDeleteAllocation: (allocationId: string) => void;
}

const AllocationsTab: React.FC<AllocationsTabProps> = ({
  allocations,
  date,
  viewMode,
  isLoading,
  isDeleting,
  onViewModeChange,
  onDeleteAllocation
}) => {
  const clearDayMutation = useClearDayAllocations();
  const [clearDayDialog, setClearDayDialog] = useState(false);

  const handleClearDay = async () => {
    const dateString = format(date, 'yyyy-MM-dd');
    await clearDayMutation.mutateAsync({ date: dateString });
    setClearDayDialog(false);
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Current Allocations</h3>
          <div className="flex items-center gap-2">
            {allocations.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setClearDayDialog(true)}
                disabled={clearDayMutation.isPending}
                className="text-destructive hover:text-destructive"
              >
                <CalendarX className="h-4 w-4 mr-2" />
                Clear All Day
              </Button>
            )}
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onViewModeChange('grid')}
            >
              <Grid3X3 className="h-4 w-4 mr-2" />
              Grid View
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onViewModeChange('list')}
            >
              <List className="h-4 w-4 mr-2" />
              List View
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div>Loading allocations...</div>
        ) : viewMode === 'grid' ? (
          <HourAllocationGrid
            allocations={allocations}
            date={date}
            onDeleteAllocation={onDeleteAllocation}
            isDeleting={isDeleting}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Detailed List View</CardTitle>
            </CardHeader>
            <CardContent>
              {allocations.length === 0 ? (
                <p className="text-muted-foreground">No hour allocations for this day.</p>
              ) : (
                <div className="space-y-2">
                  {allocations
                    .sort((a, b) => a.hourBlock - b.hourBlock)
                    .map((allocation) => (
                      <div key={allocation.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="font-medium">
                            {allocation.hourBlock}:00 - {allocation.hourBlock + 1}:00
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {allocation.teamMember?.name} - {allocation.project?.jobName} ({allocation.phase})
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDeleteAllocation(allocation.id)}
                          disabled={isDeleting}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <ClearAllocationsDialog
        open={clearDayDialog}
        onOpenChange={setClearDayDialog}
        onConfirm={handleClearDay}
        title="Clear All Day Allocations"
        description={`Are you sure you want to remove all ${allocations.length} hour allocations for ${format(date, 'MMMM d, yyyy')}? This action cannot be undone.`}
        isLoading={clearDayMutation.isPending}
      />
    </>
  );
};

export default AllocationsTab;
