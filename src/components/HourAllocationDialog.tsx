
import * as React from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge'; 
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus, AlertTriangle, Wand2, CheckSquare, Square } from 'lucide-react';
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
  const [selectedHourBlocks, setSelectedHourBlocks] = React.useState<number[]>([]);

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

  const getEligibleTeamMembers = React.useCallback((phase: string) => {
    if (!teamMembers) return [];
    
    return teamMembers.filter(member => {
      if (!member.isActive) return false;
      
      switch (phase) {
        case 'millwork':
          return member.canDoMillwork;
        case 'boxConstruction':
          return member.canDoBoxes;
        case 'stain':
          return member.canDoStain;
        case 'install':
          return member.canDoInstall;
        default:
          return true;
      }
    });
  }, [teamMembers]);

  const getAvailableHourBlocks = React.useCallback(() => {
    const hourBlocks = Array.from({ length: 8 }, (_, i) => i + 8); // 8 AM to 3 PM
    const occupiedBlocks = new Set(allocations.map(alloc => alloc.hourBlock));
    
    return hourBlocks.map(hour => ({
      hour,
      isOccupied: occupiedBlocks.has(hour),
      label: `${hour}:00 - ${hour + 1}:00`
    }));
  }, [allocations]);

  const handleHourBlockToggle = (hour: number, checked: boolean) => {
    setSelectedHourBlocks(prev => 
      checked 
        ? [...prev, hour].sort()
        : prev.filter(h => h !== hour)
    );
  };

  const handleSelectAllAvailable = () => {
    const availableBlocks = getAvailableHourBlocks()
      .filter(block => !block.isOccupied)
      .map(block => block.hour);
    setSelectedHourBlocks(availableBlocks);
  };

  const handleClearSelection = () => {
    setSelectedHourBlocks([]);
  };

  const handleAutoFill = async () => {
    if (!selectedProject || !selectedPhase) {
      toast({ title: "Missing Information", description: "Please select project and phase first", variant: "destructive" });
      return;
    }

    const eligibleMembers = getEligibleTeamMembers(selectedPhase);
    const availableBlocks = getAvailableHourBlocks().filter(block => !block.isOccupied);
    
    if (eligibleMembers.length === 0) {
      toast({ title: "No Eligible Members", description: "No team members are eligible for this phase", variant: "destructive" });
      return;
    }

    if (availableBlocks.length === 0) {
      toast({ title: "No Available Slots", description: "All hour blocks are already occupied", variant: "destructive" });
      return;
    }

    // Get current allocations count per member for this date
    const memberAllocationCounts = eligibleMembers.map(member => ({
      member,
      currentAllocations: allocations.filter(alloc => alloc.teamMemberId === member.id).length
    }));

    // Sort by current allocations (ascending) to distribute workload evenly
    memberAllocationCounts.sort((a, b) => a.currentAllocations - b.currentAllocations);

    try {
      const dateString = format(date, 'yyyy-MM-dd');
      
      for (const block of availableBlocks) {
        // Find the first member who hasn't reached 9 hours yet
        const selectedMember = memberAllocationCounts.find(member => member.currentAllocations < 9);
        
        if (!selectedMember) {
          // All eligible members have reached 9 hours, stop allocation
          break;
        }
        
        await addAllocationMutation.mutateAsync({
          projectId: selectedProject,
          teamMemberId: selectedMember.member.id,
          phase: selectedPhase as 'millwork' | 'boxConstruction' | 'stain' | 'install',
          date: dateString,
          hourBlock: block.hour,
        });

        // Update the count for this member
        selectedMember.currentAllocations++;
      }

      toast({
        title: "Auto-Fill Complete",
        description: `Assigned ${availableBlocks.length} hour blocks to eligible team members`,
      });

      // Reset form
      setSelectedProject('');
      setSelectedPhase('');
      setSelectedTeamMember('');
      setSelectedHourBlocks([]);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleAddAllocations = async () => {
    if (!selectedProject || !selectedPhase || !selectedTeamMember || selectedHourBlocks.length === 0) {
      toast({ title: "Missing Information", description: "Please fill in all fields and select at least one hour block", variant: "destructive" });
      return;
    }

    try {
      const dateString = format(date, 'yyyy-MM-dd');
      
      for (const hourBlock of selectedHourBlocks) {
        await addAllocationMutation.mutateAsync({
          projectId: selectedProject,
          teamMemberId: selectedTeamMember,
          phase: selectedPhase as 'millwork' | 'boxConstruction' | 'stain' | 'install',
          date: dateString,
          hourBlock: hourBlock,
        });
      }
      
      // Reset form
      setSelectedProject('');
      setSelectedPhase('');
      setSelectedTeamMember('');
      setSelectedHourBlocks([]);
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

  if (!open) return null;

  const isLoading = isLoadingTeamMembers || isLoadingAllocations;
  const availableHourBlocks = getAvailableHourBlocks();
  const eligibleMembers = selectedPhase ? getEligibleTeamMembers(selectedPhase) : [];

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

          {/* Auto-Fill Section */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Auto-Fill</CardTitle>
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
              </div>
              
              {selectedPhase && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-sm font-medium mb-2">
                    Eligible Team Members ({eligibleMembers.length})
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {eligibleMembers.map(member => member.name).join(', ') || 'None available'}
                  </div>
                </div>
              )}
              
              <Button 
                onClick={handleAutoFill} 
                disabled={!selectedProject || !selectedPhase || eligibleMembers.length === 0 || addAllocationMutation.isPending}
                className="w-full"
              >
                <Wand2 className="h-4 w-4 mr-2" />
                Auto-Fill Available Slots with Eligible Members
              </Button>
            </CardContent>
          </Card>

          {/* Manual Assignment */}
          <Card>
            <CardHeader>
              <CardTitle>Manual Hour Allocation</CardTitle>
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
                
                <div className="col-span-2">
                  <label className="text-sm font-medium">Team Member</label>
                  <Select value={selectedTeamMember} onValueChange={setSelectedTeamMember}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select team member" />
                    </SelectTrigger>
                    <SelectContent>
                      {teamMembers?.filter(member => member.isActive).map((member) => {
                        const isEligible = selectedPhase ? getEligibleTeamMembers(selectedPhase).some(em => em.id === member.id) : true;
                        return (
                          <SelectItem key={member.id} value={member.id} disabled={!isEligible}>
                            {member.name} {!isEligible && '(Not eligible for this phase)'}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium">Hour Blocks</label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAllAvailable}
                      disabled={availableHourBlocks.every(block => block.isOccupied)}
                    >
                      <CheckSquare className="h-3 w-3 mr-1" />
                      Select All Available
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleClearSelection}
                      disabled={selectedHourBlocks.length === 0}
                    >
                      <Square className="h-3 w-3 mr-1" />
                      Clear Selection
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  {availableHourBlocks.map((block) => (
                    <div key={block.hour} className="flex items-center space-x-2">
                      <Checkbox
                        id={`hour-${block.hour}`}
                        checked={selectedHourBlocks.includes(block.hour)}
                        onCheckedChange={(checked) => handleHourBlockToggle(block.hour, checked as boolean)}
                        disabled={block.isOccupied}
                      />
                      <label
                        htmlFor={`hour-${block.hour}`}
                        className={`text-sm ${block.isOccupied ? 'text-muted-foreground line-through' : 'cursor-pointer'}`}
                      >
                        {block.label} {block.isOccupied && '(Occupied)'}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              <Button 
                onClick={handleAddAllocations} 
                disabled={!selectedProject || !selectedPhase || !selectedTeamMember || selectedHourBlocks.length === 0 || addAllocationMutation.isPending}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Selected Hour Allocations ({selectedHourBlocks.length})
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
