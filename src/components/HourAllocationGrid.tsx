
import React from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { DailyHourAllocation } from '../types/project';
import { useTeamMembers } from '../hooks/useTeamMembers';

interface HourAllocationGridProps {
  allocations: DailyHourAllocation[];
  date: Date;
  onDeleteAllocation: (allocationId: string) => void;
  isDeleting: boolean;
}

const getPhaseColor = (phase: string) => {
  switch (phase) {
    case 'millwork':
      return 'bg-purple-500 text-white hover:bg-purple-600';
    case 'boxConstruction':
      return 'bg-blue-500 text-white hover:bg-blue-600';
    case 'stain':
      return 'bg-amber-500 text-white hover:bg-amber-600';
    case 'install':
      return 'bg-green-500 text-white hover:bg-green-600';
    default:
      return 'bg-gray-500 text-white hover:bg-gray-600';
  }
};

const HourAllocationGrid = ({ allocations, date, onDeleteAllocation, isDeleting }: HourAllocationGridProps) => {
  const { teamMembers } = useTeamMembers();
  
  // Generate hour blocks from 8 AM to 5 PM (9 hours total)
  const hourBlocks = Array.from({ length: 9 }, (_, i) => i + 8);
  
  // Create a map of allocations by team member and hour
  const allocationMap = new Map<string, Map<number, DailyHourAllocation[]>>();
  
  allocations.forEach(allocation => {
    const memberId = allocation.teamMemberId;
    if (!allocationMap.has(memberId)) {
      allocationMap.set(memberId, new Map());
    }
    const memberMap = allocationMap.get(memberId)!;
    if (!memberMap.has(allocation.hourBlock)) {
      memberMap.set(allocation.hourBlock, []);
    }
    memberMap.get(allocation.hourBlock)!.push(allocation);
  });

  const activeMembers = teamMembers?.filter(member => member.isActive) || [];
  const membersWithAllocations = activeMembers.filter(member => 
    allocationMap.has(member.id)
  );

  if (allocations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Hour Allocation Grid - {format(date, 'MMMM d, yyyy')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No hour allocations for this day.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hour Allocation Grid - {format(date, 'MMMM d, yyyy')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="text-left p-1 border-b font-medium sticky left-0 bg-background min-w-[100px] text-xs">
                  Team Member
                </th>
                {hourBlocks.map(hour => (
                  <th key={hour} className="text-center p-1 border-b font-medium min-w-[70px] text-xs">
                    {hour}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {membersWithAllocations.map(member => {
                const memberAllocations = allocationMap.get(member.id);
                return (
                  <tr key={member.id} className="border-b hover:bg-muted/50">
                    <td className="p-1 font-medium sticky left-0 bg-background border-r text-xs">
                      {member.name}
                    </td>
                    {hourBlocks.map(hour => {
                      const hourAllocations = memberAllocations?.get(hour) || [];
                      return (
                        <td key={hour} className="p-0.5 text-center align-top">
                          {hourAllocations.length > 0 && (
                            <div className="space-y-0.5">
                              {hourAllocations.map(allocation => (
                                <div key={allocation.id} className="relative group">
                                  <Badge
                                    className={`text-[10px] px-1 py-0.5 block cursor-pointer ${getPhaseColor(allocation.phase)}`}
                                    title={`${allocation.project?.jobName} - ${allocation.phase.toUpperCase()}`}
                                  >
                                    <div className="truncate max-w-[60px]">
                                      {allocation.project?.jobName}
                                    </div>
                                    <div className="text-[8px] opacity-75">
                                      {allocation.phase.slice(0, 3).toUpperCase()}
                                    </div>
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute -top-0.5 -right-0.5 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity p-0"
                                    onClick={() => onDeleteAllocation(allocation.id)}
                                    disabled={isDeleting}
                                  >
                                    <Trash2 className="h-2 w-2" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default HourAllocationGrid;
