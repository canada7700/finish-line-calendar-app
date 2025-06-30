
import React from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trash2, Calendar } from 'lucide-react';
import { DailyPhaseAllocation } from '../types/project';
import { useDeletePhaseAllocation } from '../hooks/useDailyPhaseAllocations';

interface PhaseAllocationsViewProps {
  allocations: DailyPhaseAllocation[];
  date: Date;
  capacityInfo: Array<{
    phase: string;
    allocated: number;
    capacity: number;
    isOverAllocated: boolean;
  }>;
}

const getPhaseColor = (phase: string) => {
  switch (phase) {
    case 'millwork':
      return 'bg-purple-100 border-purple-300 text-purple-800';
    case 'boxConstruction':
      return 'bg-blue-100 border-blue-300 text-blue-800';
    case 'stain':
      return 'bg-amber-100 border-amber-300 text-amber-800';
    case 'install':
      return 'bg-green-100 border-green-300 text-green-800';
    default:
      return 'bg-gray-100 border-gray-300 text-gray-800';
  }
};

const PhaseAllocationsView: React.FC<PhaseAllocationsViewProps> = ({
  allocations,
  date,
  capacityInfo
}) => {
  const deleteAllocationMutation = useDeletePhaseAllocation();

  const handleDeleteAllocation = (allocationId: string) => {
    deleteAllocationMutation.mutate(allocationId);
  };

  // Group allocations by phase
  const allocationsByPhase = allocations.reduce((acc, allocation) => {
    if (!acc[allocation.phase]) {
      acc[allocation.phase] = [];
    }
    acc[allocation.phase].push(allocation);
    return acc;
  }, {} as Record<string, DailyPhaseAllocation[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Phase Allocations - {format(date, 'MMMM d, yyyy')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {allocations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No phase allocations for this day
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(allocationsByPhase).map(([phase, phaseAllocations]) => {
              const phaseCapacity = capacityInfo.find(info => info.phase === phase);
              const totalHours = phaseAllocations.reduce((sum, alloc) => sum + alloc.allocatedHours, 0);
              
              return (
                <div key={phase} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium capitalize">{phase}</h4>
                      <Badge variant={phaseCapacity?.isOverAllocated ? "destructive" : "secondary"}>
                        {totalHours}/{phaseCapacity?.capacity || 0}h
                      </Badge>
                    </div>
                    {phaseCapacity && (
                      <Progress 
                        value={(totalHours / phaseCapacity.capacity) * 100} 
                        className="w-24 h-2"
                      />
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    {phaseAllocations.map((allocation) => (
                      <div 
                        key={allocation.id} 
                        className={`flex items-center justify-between p-3 rounded-md border ${getPhaseColor(allocation.phase)}`}
                      >
                        <div>
                          <div className="font-medium">
                            {allocation.project?.jobName || 'Unknown Project'}
                          </div>
                          <div className="text-sm opacity-80">
                            {allocation.allocatedHours} hours allocated
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteAllocation(allocation.id)}
                          disabled={deleteAllocationMutation.isPending}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PhaseAllocationsView;
