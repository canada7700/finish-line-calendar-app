
import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { useDailyHourAllocations, useAddHourAllocation, useRemoveHourAllocation } from '@/hooks/useDailyHourAllocations';
import { useDailyPhaseCapacities, useDayCapacityInfo } from '@/hooks/useDailyCapacities';
import { ProjectPhase, TeamMember, DailyHourAllocation } from '@/types/project';

interface HourAllocationDialogProps {
  date: Date | null;
  phases: ProjectPhase[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const HourAllocationDialog = ({ date, phases, open, onOpenChange }: HourAllocationDialogProps) => {
  const [selectedProject, setSelectedProject] = React.useState('');
  const [selectedPhase, setSelectedPhase] = React.useState<'millwork' | 'boxConstruction' | 'stain' | 'install'>('millwork');
  const [selectedTeamMember, setSelectedTeamMember] = React.useState('');
  const [selectedHourBlock, setSelectedHourBlock] = React.useState(8);

  const { data: teamMembers = [] } = useTeamMembers();
  const { data: allocations = [] } = useDailyHourAllocations(date || undefined);
  const { data: capacities = [] } = useDailyPhaseCapacities();
  const addAllocationMutation = useAddHourAllocation();
  const removeAllocationMutation = useRemoveHourAllocation();

  const capacityInfo = date ? useDayCapacityInfo(date, allocations, capacities) : null;

  const projectsOnDay = Array.from(new Map(phases.map(p => [p.projectId, p])).values());
  const availableHourBlocks = Array.from({ length: 24 }, (_, i) => i);
  const occupiedBlocks = new Set(allocations.map(a => a.hourBlock));

  const getEligibleTeamMembers = (phase: string): TeamMember[] => {
    return teamMembers.filter(member => {
      if (!member.isActive) return false;
      switch (phase) {
        case 'millwork': return member.canDoMillwork;
        case 'boxConstruction': return member.canDoBoxes;
        case 'stain': return member.canDoStain;
        case 'install': return member.canDoInstall;
        default: return false;
      }
    });
  };

  const handleAddAllocation = async () => {
    if (!date || !selectedProject || !selectedTeamMember) return;

    await addAllocationMutation.mutateAsync({
      projectId: selectedProject,
      teamMemberId: selectedTeamMember,
      phase: selectedPhase,
      date: format(date, 'yyyy-MM-dd'),
      hourBlock: selectedHourBlock,
    });

    // Reset form
    setSelectedProject('');
    setSelectedTeamMember('');
    setSelectedHourBlock(8);
  };

  const handleRemoveAllocation = async (allocationId: string) => {
    await removeAllocationMutation.mutateAsync(allocationId);
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'millwork': return 'bg-blue-500';
      case 'boxConstruction': return 'bg-green-500';
      case 'stain': return 'bg-purple-500';
      case 'install': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  if (!date) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Hour Allocations for {format(date, 'MMMM d, yyyy')}</DialogTitle>
          <DialogDescription>
            Manage team member assignments by hour blocks for this day.
          </DialogDescription>
        </DialogHeader>

        {/* Capacity Overview */}
        {capacityInfo && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Daily Capacity Overview
                {capacityInfo.hasOverAllocation && <AlertTriangle className="h-5 w-5 text-red-500" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {capacityInfo.capacityInfo.map(info => (
                  <div key={info.phase} className="text-center">
                    <div className={`text-sm font-medium mb-1 ${info.isOverAllocated ? 'text-red-600' : 'text-gray-600'}`}>
                      {info.phase.toUpperCase()}
                    </div>
                    <Badge variant={info.isOverAllocated ? 'destructive' : 'secondary'}>
                      {info.allocated}/{info.capacity}h
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add New Allocation */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Add Hour Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="Project" />
                </SelectTrigger>
                <SelectContent>
                  {projectsOnDay.map(project => (
                    <SelectItem key={project.projectId} value={project.projectId}>
                      {project.projectName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedPhase} onValueChange={(value: any) => setSelectedPhase(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Phase" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="millwork">Millwork</SelectItem>
                  <SelectItem value="boxConstruction">Boxes</SelectItem>
                  <SelectItem value="stain">Stain</SelectItem>
                  <SelectItem value="install">Install</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedTeamMember} onValueChange={setSelectedTeamMember}>
                <SelectTrigger>
                  <SelectValue placeholder="Team Member" />
                </SelectTrigger>
                <SelectContent>
                  {getEligibleTeamMembers(selectedPhase).map(member => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedHourBlock.toString()} onValueChange={(value) => setSelectedHourBlock(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Hour" />
                </SelectTrigger>
                <SelectContent>
                  {availableHourBlocks.map(hour => (
                    <SelectItem 
                      key={hour} 
                      value={hour.toString()}
                      disabled={occupiedBlocks.has(hour)}
                    >
                      {hour}:00 {occupiedBlocks.has(hour) ? '(Occupied)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button 
                onClick={handleAddAllocation}
                disabled={!selectedProject || !selectedTeamMember || addAllocationMutation.isPending}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Current Allocations */}
        <Card>
          <CardHeader>
            <CardTitle>Current Hour Allocations ({allocations.length} hours)</CardTitle>
          </CardHeader>
          <CardContent>
            {allocations.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No hours allocated for this day.</p>
            ) : (
              <div className="space-y-2">
                {allocations
                  .sort((a, b) => a.hourBlock - b.hourBlock)
                  .map(allocation => (
                    <div key={allocation.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge className="min-w-[60px]">{allocation.hourBlock}:00</Badge>
                        <div className={`h-3 w-3 rounded-full ${getPhaseColor(allocation.phase)}`}></div>
                        <span className="font-medium">{allocation.phase.toUpperCase()}</span>
                        <span className="text-muted-foreground">-</span>
                        <span>{allocation.teamMember?.name}</span>
                        <span className="text-muted-foreground">on</span>
                        <span className="font-medium">{allocation.project?.jobName}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveAllocation(allocation.id)}
                        disabled={removeAllocationMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default HourAllocationDialog;
