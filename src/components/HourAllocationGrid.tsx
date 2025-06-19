
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

const HourAllocationGrid = ({ allocations, date, onDeleteAllocation, isDeleting }: HourAllocationGridProps) => {
  const { teamMembers } = useTeamMembers();
  
  // Create a map of allocations by team member
  const allocationsByMember = new Map<string, DailyHourAllocation[]>();
  
  allocations.forEach(allocation => {
    const memberId = allocation.teamMemberId;
    if (!allocationsByMember.has(memberId)) {
      allocationsByMember.set(memberId, []);
    }
    allocationsByMember.get(memberId)!.push(allocation);
  });

  // Sort allocations within each member by hour
  allocationsByMember.forEach((memberAllocations) => {
    memberAllocations.sort((a, b) => a.hourBlock - b.hourBlock);
  });

  // Get all active members (not just those with allocations)
  const activeMembers = teamMembers?.filter(member => member.isActive) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hour Allocation Grid - {format(date, 'MMMM d, yyyy')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${activeMembers.length}, 1fr)` }}>
          {activeMembers.map(member => {
            const memberAllocations = allocationsByMember.get(member.id) || [];
            
            return (
              <div key={member.id} className="space-y-3">
                {/* Team member name header */}
                <div className="text-center font-semibold p-3 bg-gray-100 rounded-lg border">
                  {member.name}
                </div>
                
                {/* Allocations for this member */}
                <div className="space-y-2">
                  {memberAllocations.length === 0 ? (
                    <div className="text-center text-muted-foreground text-sm py-4 border-2 border-dashed border-gray-200 rounded-lg">
                      No work scheduled
                    </div>
                  ) : (
                    memberAllocations.map(allocation => (
                      <div key={allocation.id} className="relative group">
                        <div
                          className={`
                            border rounded-lg p-3 transition-all duration-200
                            ${getPhaseColor(allocation.phase)}
                            hover:shadow-md hover:scale-105
                            relative
                          `}
                          title={`${allocation.hourBlock}:00 - ${allocation.project?.jobName} - ${allocation.phase.toUpperCase()}`}
                        >
                          {/* Hour block */}
                          <div className="text-xs font-bold text-gray-700 mb-1">
                            {allocation.hourBlock}:00
                          </div>
                          
                          {/* Project name */}
                          <div className="font-semibold text-sm leading-tight mb-1">
                            {allocation.project?.jobName}
                          </div>
                          
                          {/* Phase */}
                          <div className="text-xs font-medium uppercase tracking-wide opacity-80">
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
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default HourAllocationGrid;
