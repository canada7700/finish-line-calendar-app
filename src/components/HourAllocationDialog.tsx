import * as React from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge'; 
import { Progress } from '@/components/ui/progress';
import { Trash2, Plus, AlertTriangle } from 'lucide-react';
import { ProjectPhase } from '../types/project';
import { useTeamMembers } from '../hooks/useTeamMembers';
import { useAllProjectAssignments } from '../hooks/useProjectAssignments';
import { useDailyHourAllocations, useAddHourAllocation, useRemoveHourAllocation } from '../hooks/useDailyHourAllocations';
import { useDailyPhaseCapacities, useDayCapacityInfo } from '../hooks/useDailyCapacities';
import { toast } from '@/hooks/use-toast';

interface HourAllocationDialogProps {
  date: Date;
  phases: ProjectPhase[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const HourAllocationDialog = ({ date, phases, open, onOpenChange }: HourAllocationDialogProps) => {
  const [selectedProject, setSelectedProject] = React.useState<string>('');
  const [selectedPhase, setSelectedPhase] = React.useState<string>('');
  const [selectedTeamMember, setSelectedTeamMember] = React.useState<string>('');
  const [selectedHourBlock, setSelectedHourBlock] = React.useState<string>('');

  const { teamMembers, isLoading: isLoadingTeamMembers } = useTeamMembers();
  const { data: assignments } = useAllProjectAssignments();
  const { data: allocations = [], isLoading: isLoadingAllocations } = useDailyHourAllocations(date);
  const { data: capacities = [] } = useDailyPhaseCapacities();
  const addAllocationMutation = useAddHourAllocation();
  const removeAllocationMutation = useRemoveHourAllocation();

  const { capacityInfo, hasOverAllocation } = useDayCapacityInfo(date, allocations, capacities);

  const availableProjects = React.useMemo(() => {
    return Array.from(new Map(phases.map(p => [p.projectId, { id: p.projectId, name: p.projectName }])).values());
  }, [phases]);

  const availablePhases = React.useMemo(() => {
    if (!selectedProject) return [];
    return phases.filter(p => p.projectId === selectedProject).map(p => p.phase);
  }, [phases, selectedProject]);

  const handleAddAllocation = async () => {
    if (!selectedProject || !selectedPhase || !selectedTeamMember || !selectedHourBlock) {
      toast({ title: "Missing Information", description: "Please fill in all fields", variant: "destructive" });
      return;
    }

    try {
      await addAllocationMutation.mutateAsync({
        projectId: selectedProject,
        teamMemberId: selectedTeamMember,
        phase: selectedPhase as 'millwork' | 'boxConstruction' | 'stain' | 'install',
        date: format(date, 'yyyy-MM-dd'),
        hourBlock: parseInt(selectedHourBlock),
      });
      
      // Reset form
      setSelectedProject('');
      setSelectedPhase('');
      setSelectedTeamMember('');
      setSelectedHourBlock('');
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleDeleteAllocation = async (allocationId: string) => {
    try {
      await removeAllocationMutation.mutateAsync(allocationId);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const hourBlocks = Array.from({ length: 8 }, (_, i) => i + 8); // 8 AM to 3 PM (8 hour blocks)

  if (!open) return null;

  const isLoading = isLoadingTeamMembers || isLoadingAllocations;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Hour Allocations for {format(date, 'MMMM d, yyyy')}</DialogTitle>
          <DialogDescription>
            Assign team members to specific hour blocks for different project phases.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Capacity Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Daily Capacity Overview
                {hasOverAllocation && <AlertTriangle className="h-5 w-5 text-red-500" />}
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

          {/* Add New Allocation */}
          <Card>
            <CardHeader>
              <CardTitle>Add Hour Allocation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Project</label>
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProjects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Phase</label>
                  <Select value={selectedPhase} onValueChange={setSelectedPhase} disabled={!selectedProject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select phase" />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePhases.map((phase) => (
                        <SelectItem key={phase} value={phase}>
                          {phase.charAt(0).toUpperCase() + phase.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Team Member</label>
                  <Select value={selectedTeamMember} onValueChange={setSelectedTeamMember}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select team member" />
                    </SelectTrigger>
                    <SelectContent>
                      {teamMembers?.filter(member => member.isActive).map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Hour Block</label>
                  <Select value={selectedHourBlock} onValueChange={setSelectedHourBlock}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select hour" />
                    </SelectTrigger>
                    <SelectContent>
                      {hourBlocks.map((hour) => {
                        const isOccupied = allocations.some(alloc => alloc.hourBlock === hour);
                        return (
                          <SelectItem key={hour} value={hour.toString()} disabled={isOccupied}>
                            {hour}:00 - {hour + 1}:00 {isOccupied ? '(Occupied)' : ''}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button 
                onClick={handleAddAllocation} 
                disabled={!selectedProject || !selectedPhase || !selectedTeamMember || !selectedHourBlock || addAllocationMutation.isPending}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Hour Allocation
              </Button>
            </CardContent>
          </Card>

          {/* Current Allocations */}
          <Card>
            <CardHeader>
              <CardTitle>Current Hour Allocations</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div>Loading allocations...</div>
              ) : allocations.length === 0 ? (
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
                          onClick={() => handleDeleteAllocation(allocation.id)}
                          disabled={removeAllocationMutation.isPending}
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
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HourAllocationDialog;
