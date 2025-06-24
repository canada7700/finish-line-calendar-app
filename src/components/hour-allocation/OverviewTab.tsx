
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Users, Loader2 } from 'lucide-react';
import { DailyHourAllocation } from '../../types/project';

interface OverviewTabProps {
  capacityInfo: Array<{
    phase: string;
    allocated: number;
    capacity: number;
    isOverAllocated: boolean;
  }>;
  hasOverAllocation: boolean;
  allocations: DailyHourAllocation[];
  isLoadingCapacities: boolean;
}

const OverviewTab: React.FC<OverviewTabProps> = ({
  capacityInfo,
  hasOverAllocation,
  allocations,
  isLoadingCapacities
}) => {
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

  const hourBlockOccupancy = getHourBlockOccupancy();

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
                <span className="font-medium capitalize">{info.phase}</span>
                <Badge variant={info.isOverAllocated ? "destructive" : "secondary"}>
                  {info.allocated}/{info.capacity} hours
                </Badge>
              </div>
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
    </div>
  );
};

export default OverviewTab;
