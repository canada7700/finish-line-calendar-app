
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
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${hourBlocks.length}, 1fr)` }}>
          {/* Hour headers */}
          {hourBlocks.map(hour => (
            <div key={`header-${hour}`} className="text-center font-semibold p-2 bg-muted rounded-md">
              {hour}:00
            </div>
          ))}
          
          {/* Allocations for each hour */}
          {hourBlocks.map(hour => (
            <div key={`column-${hour}`} className="space-y-2">
              {membersWithAllocations.map(member => {
                const memberAllocations = allocationMap.get(member.id);
                const hourAllocations = memberAllocations?.get(hour) || [];
                
                return hourAllocations.map(allocation => (
                  <div key={allocation.id} className="relative group">
                    <div
                      className={`
                        border-2 rounded-lg p-3 cursor-pointer transition-all duration-200
                        ${getPhaseColor(allocation.phase)}
                        hover:shadow-md hover:scale-105
                        relative
                      `}
                      title={`${member.name} - ${allocation.project?.jobName} - ${allocation.phase.toUpperCase()}`}
                    >
                      <div className="text-xs font-medium text-gray-600 mb-1">
                        {member.name}
                      </div>
                      <div className="font-semibold text-sm leading-tight mb-1">
                        {allocation.project?.jobName}
                      </div>
                      <div className="text-xs opacity-80 font-medium uppercase tracking-wide">
                        {allocation.phase}
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity p-0 bg-white/90 hover:bg-white shadow-sm border rounded-full"
                        onClick={() => onDeleteAllocation(allocation.id)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ));
              })}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default HourAllocationGrid;
