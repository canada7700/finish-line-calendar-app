
import React from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
      return 'bg-purple-100 border-purple-300 text-purple-800 hover:bg-purple-200';
    case 'boxConstruction':
      return 'bg-blue-100 border-blue-300 text-blue-800 hover:bg-blue-200';
    case 'stain':
      return 'bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200';
    case 'install':
      return 'bg-green-100 border-green-300 text-green-800 hover:bg-green-200';
    default:
      return 'bg-gray-100 border-gray-300 text-gray-800 hover:bg-gray-200';
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
                <th className="text-left p-2 border-b font-medium sticky left-0 bg-background min-w-[120px] text-sm">
                  Team Member
                </th>
                {hourBlocks.map(hour => (
                  <th key={hour} className="text-center p-2 border-b font-medium min-w-[80px] text-sm">
                    {hour}:00
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {membersWithAllocations.map(member => {
                const memberAllocations = allocationMap.get(member.id);
                return (
                  <tr key={member.id} className="border-b hover:bg-muted/30">
                    <td className="p-2 font-medium sticky left-0 bg-background border-r text-sm">
                      {member.name}
                    </td>
                    {hourBlocks.map(hour => {
                      const hourAllocations = memberAllocations?.get(hour) || [];
                      return (
                        <td key={hour} className="p-1 text-center align-top">
                          {hourAllocations.length > 0 && (
                            <div className="space-y-1">
                              {hourAllocations.map(allocation => (
                                <div key={allocation.id} className="relative group">
                                  <div
                                    className={`
                                      border rounded-md px-2 py-1.5 cursor-pointer transition-all duration-200
                                      ${getPhaseColor(allocation.phase)}
                                      hover:shadow-sm
                                      text-xs font-medium
                                      min-h-[2.5rem]
                                      flex flex-col justify-center
                                      relative
                                    `}
                                    title={`${allocation.project?.jobName} - ${allocation.phase.toUpperCase()}`}
                                  >
                                    <div className="truncate text-xs font-semibold leading-tight">
                                      {allocation.project?.jobName}
                                    </div>
                                    <div className="text-[10px] opacity-80 font-medium uppercase tracking-wide mt-0.5">
                                      {allocation.phase}
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="absolute -top-1 -right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity p-0 bg-white/90 hover:bg-white shadow-sm border"
                                      onClick={() => onDeleteAllocation(allocation.id)}
                                      disabled={isDeleting}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
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
