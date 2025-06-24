
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Users, Loader2, Settings, RotateCcw } from 'lucide-react';
import { DailyHourAllocation } from '../../types/project';
import { useSetCapacityOverride, useRemoveCapacityOverride } from '../../hooks/useDailyCapacityOverrides';
import CapacityAdjustmentDialog from './CapacityAdjustmentDialog';

interface OverviewTabProps {
  capacityInfo: Array<{
    phase: string;
    allocated: number;
    capacity: number;
    defaultCapacity?: number;
    isOverAllocated: boolean;
    hasOverride?: boolean;
    overrideReason?: string;
  }>;
  hasOverAllocation: boolean;
  allocations: DailyHourAllocation[];
  isLoadingCapacities: boolean;
  date: Date;
}

const OverviewTab: React.FC<OverviewTabProps> = ({
  capacityInfo,
  hasOverAllocation,
  allocations,
  isLoadingCapacities,
  date
}) => {
  const [selectedPhase, setSelectedPhase] = React.useState<string | null>(null);
  const setCapacityOverride = useSetCapacityOverride();
  const removeCapacityOverride = useRemoveCapacityOverride();

  const getHourBlockOccupancy = React.useCallback(() => {
    // Extended to 9 hours: 8 AM to 5 PM
    const hourBlocks = Array.from({ length: 9 }, (_, i) => i + 8);
    
    return hourBlocks.map(hour => {
      const allocationsForHour = allocations.filter(alloc => alloc.hourBlock === hour);
      const teamMemberIds = allocationsForHour.map(alloc => alloc.teamMemberId);
      const uniqueTeamMembers = new Set(teamMemberIds).size;
      
      return {
        hour,
        allocationsCount: allocationsForHour.length,
        uniqueTeamMembers,
        label: `${hour}:00 - ${hour + 1}:00`,
        allocations: allocationsForHour
      };
    });
  }, [allocations]);

  const handleAdjustCapacity = (phase: string) => {
    setSelectedPhase(phase);
  };

  const handleCapacityAdjustment = async (adjustedCapacity: number, reason?: string) => {
    if (!selectedPhase) return;
    
    const dateString = date.toISOString().split('T')[0];
    await setCapacityOverride.mutateAsync({
      date: dateString,
      phase: selectedPhase,
      adjustedCapacity,
      reason,
    });
  };

  const handleCapacityReset = async () => {
    if (!selectedPhase) return;
    
    const dateString = date.toISOString().split('T')[0];
    await removeCapacityOverride.mutateAsync({
      date: dateString,
      phase: selectedPhase,
    });
  };

  const hourBlockOccupancy = getHourBlockOccupancy();
  const selectedPhaseInfo = selectedPhase ? capacityInfo.find(info => info.phase === selectedPhase) : null;

  return (
    <div className="space-y-4">
      {/* Capacity Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Daily Capacity Overview
            {hasOverAllocation && <AlertTriangle className="h-5 w-5 text-red-500" />}
            {isLoadingCapacities && <Loader2 className="h-4 w-4 animate-spin" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {capacityInfo.map((info) => (
            <div key={info.phase} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="font-medium capitalize">{info.phase}</span>
                  {info.hasOverride && (
                    <Badge variant="outline" className="text-xs">
                      Adjusted
                      {info.defaultCapacity && ` (was ${info.defaultCapacity})`}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={info.isOverAllocated ? "destructive" : "secondary"}>
                    {info.allocated}/{info.capacity} hours
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAdjustCapacity(info.phase)}
                    className="h-8 px-2"
                  >
                    <Settings className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              {info.overrideReason && (
                <div className="text-xs text-muted-foreground italic">
                  {info.overrideReason}
                </div>
              )}
              <Progress 
                value={(info.allocated / info.capacity) * 100} 
                className={`h-2 ${info.isOverAllocated ? 'bg-red-100' : ''}`}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Hour Block Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Hour Block Occupancy (8 AM - 5 PM)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {hourBlockOccupancy.map((block) => (
              <div key={block.hour} className="p-2 border rounded text-center">
                <div className="text-sm font-medium">{block.hour}:00</div>
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  {block.uniqueTeamMembers}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Capacity Adjustment Dialog */}
      {selectedPhase && selectedPhaseInfo && (
        <CapacityAdjustmentDialog
          open={!!selectedPhase}
          onOpenChange={(open) => !open && setSelectedPhase(null)}
          date={date}
          phase={selectedPhase}
          currentCapacity={selectedPhaseInfo.capacity}
          defaultCapacity={selectedPhaseInfo.defaultCapacity || selectedPhaseInfo.capacity}
          currentAllocated={selectedPhaseInfo.allocated}
          currentOverride={selectedPhaseInfo.hasOverride ? {
            adjustedCapacity: selectedPhaseInfo.capacity,
            reason: selectedPhaseInfo.overrideReason
          } : undefined}
          onAdjustCapacity={handleCapacityAdjustment}
          onResetCapacity={handleCapacityReset}
          isLoading={setCapacityOverride.isPending || removeCapacityOverride.isPending}
        />
      )}
    </div>
  );
};

export default OverviewTab;
