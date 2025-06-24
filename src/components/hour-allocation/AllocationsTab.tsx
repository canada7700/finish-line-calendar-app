
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Grid3X3, List, Trash2 } from 'lucide-react';
import { DailyHourAllocation } from '../../types/project';
import HourAllocationGrid from '../HourAllocationGrid';

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
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Current Allocations</h3>
        <div className="flex items-center gap-2">
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
  );
};

export default AllocationsTab;
