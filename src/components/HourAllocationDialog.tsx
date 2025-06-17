
import * as React from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge'; 
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, Plus, AlertTriangle, Wand2, CheckSquare, Square, Users, Grid3X3, List, Loader2, RefreshCw, X } from 'lucide-react';
import { ProjectPhase } from '../types/project';
import { useTeamMembers } from '../hooks/useTeamMembers';
import { useAllProjectAssignments } from '../hooks/useProjectAssignments';
import { useDailyHourAllocations, useAddHourAllocation, useAddHourAllocationSilent, useRemoveHourAllocation } from '../hooks/useDailyHourAllocations';
import { useDailyPhaseCapacities, useDayCapacityInfo } from '../hooks/useDailyCapacities';
import { toast } from '@/hooks/use-toast';
import HourAllocationGrid from './HourAllocationGrid';

interface HourAllocationDialogProps {
  date: Date;
  phases: ProjectPhase[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const HourAllocationDialog = ({ date, phases, open, onOpenChange }: HourAllocationDialogProps) => {
  const [selectedProject, setSelectedProject] = React.useState<string>('');
  const [selectedPhase, setSelectedPhase] = React.useState<string>('');
  const [selectedTeamMembers, setSelectedTeamMembers] = React.useState<string[]>([]);
  const [selectedHourBlocks, setSelectedHourBlocks] = React.useState<number[]>([]);
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');
  const [isAutoFilling, setIsAutoFilling] = React.useState(false);
  const [autoFillProgress, setAutoFillProgress] = React.useState(0);
  const [autoFillTotal, setAutoFillTotal] = React.useState(0);

  const { teamMembers, isLoading: isLoadingTeamMembers } = useTeamMembers();
  const { data: assignments } = useAllProjectAssignments();
  const { data: allocations = [], isLoading: isLoadingAllocations, refetch: refetchAllocations } = useDailyHourAllocations(date);
  const { data: capacities = [], isLoading: isLoadingCapacities, refetch: refetchCapacities } = useDailyPhaseCapacities();
  const addAllocationMutation = useAddHourAllocation();
  const addAllocationSilentMutation = useAddHourAllocationSilent();
  const removeAllocationMutation = useRemoveHourAllocation();

  const { capacityInfo, hasOverAllocation } = useDayCapacityInfo(date, allocations, capacities);

  // Force refresh capacity data when dialog opens
  React.useEffect(() => {
    if (open) {
      console.log('🔄 Dialog opened, refreshing capacity data...');
      refetchCapacities();
      refetchAllocations();
    }
  }, [open, refetchCapacities, refetchAllocations]);

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

  const getAvailableHourBlocks = React.useCallback(() => {
    if (selectedTeamMembers.length === 0) return [];
    
    // Extended to 9 hours: 8 AM to 5 PM
    const hourBlocks = Array.from({ length: 9 }, (_, i) => i + 8);
    
    return hourBlocks.map(hour => {
      // Check if any of the selected team members are already allocated for this hour on this project/phase
      const isAlreadyAllocated = selectedTeamMembers.some(teamMemberId =>
        allocations.some(alloc => 
          alloc.hourBlock === hour && 
          alloc.teamMemberId === teamMemberId &&
          alloc.projectId === selectedProject &&
          alloc.phase === selectedPhase
        )
      );
      
      return {
        hour,
        isAlreadyAllocated,
        label: `${hour}:00 - ${hour + 1}:00`
      };
    });
  }, [allocations, selectedTeamMembers, selectedProject, selectedPhase]);

  const handleTeamMemberToggle = (memberId: string, checked: boolean) => {
    setSelectedTeamMembers(prev => 
      checked 
        ? [...prev, memberId]
        : prev.filter(id => id !== memberId)
    );
  };

  const handleSelectAllEligibleMembers = () => {
    if (!selectedPhase) return;
    const eligibleMembers = getEligibleTeamMembers(selectedPhase);
    const eligibleMemberIds = eligibleMembers.map(member => member.id);
    setSelectedTeamMembers(eligibleMemberIds);
  };

  const handleClearTeamMemberSelection = () => {
    setSelectedTeamMembers([]);
  };

  const handleRemoveTeamMember = (memberId: string) => {
    setSelectedTeamMembers(prev => prev.filter(id => id !== memberId));
  };

  const handleHourBlockToggle = (hour: number, checked: boolean) => {
    setSelectedHourBlocks(prev => 
      checked 
        ? [...prev, hour].sort()
        : prev.filter(h => h !== hour)
    );
  };

  const handleSelectAllAvailable = () => {
    const availableBlocks = getAvailableHourBlocks()
      .filter(block => !block.isAlreadyAllocated)
      .map(block => block.hour);
    setSelectedHourBlocks(availableBlocks);
  };

  const handleClearSelection = () => {
    setSelectedHourBlocks([]);
  };

  const handleRefreshCapacities = async () => {
    console.log('🔄 Manually refreshing capacity data...');
    await Promise.all([refetchCapacities(), refetchAllocations()]);
    toast({
      title: "Data Refreshed",
      description: "Capacity and allocation data has been refreshed.",
    });
  };

  const handleAutoFill = async () => {
    if (!selectedProject || !selectedPhase) {
      toast({ title: "Missing Information", description: "Please select project and phase first", variant: "destructive" });
      return;
    }

    const eligibleMembers = getEligibleTeamMembers(selectedPhase);
    const phaseCapacity = capacities.find(c => c.phase === selectedPhase);
    
    if (eligibleMembers.length === 0) {
      toast({ title: "No Eligible Members", description: "No team members are eligible for this phase", variant: "destructive" });
      return;
    }

    if (!phaseCapacity) {
      toast({ title: "No Capacity Set", description: "No capacity limit set for this phase", variant: "destructive" });
      return;
    }

    // Get current allocations for this phase
    const currentPhaseAllocations = allocations.filter(alloc => 
      alloc.phase === selectedPhase && alloc.projectId === selectedProject
    ).length;

    const remainingCapacity = phaseCapacity.maxHours - currentPhaseAllocations;
    
    if (remainingCapacity <= 0) {
      toast({ title: "Capacity Full", description: "Phase capacity is already at maximum", variant: "destructive" });
      return;
    }

    setIsAutoFilling(true);
    setAutoFillProgress(0);
    setAutoFillTotal(remainingCapacity);

    try {
      const dateString = format(date, 'yyyy-MM-dd');
      let allocationsAdded = 0;
      
      // Get current allocations count per member for this date and phase
      const memberAllocationCounts = eligibleMembers.map(member => ({
        member,
        currentAllocations: allocations.filter(alloc => 
          alloc.teamMemberId === member.id && 
          alloc.phase === selectedPhase &&
          alloc.projectId === selectedProject
        ).length
      }));

      // Sort by current allocations (ascending) to distribute workload evenly
      memberAllocationCounts.sort((a, b) => a.currentAllocations - b.currentAllocations);

      // Fill hour blocks until capacity is reached
      // Extended to 9 hours: 8 AM to 5 PM
      const hourBlocks = Array.from({ length: 9 }, (_, i) => i + 8);
      
      for (const hour of hourBlocks) {
        if (allocationsAdded >= remainingCapacity) break;
        
        for (const memberData of memberAllocationCounts) {
          if (allocationsAdded >= remainingCapacity) break;
          if (memberData.currentAllocations >= 9) continue; // Don't exceed 9 hours per person
          
          // Check if this member is already allocated for this hour/project/phase
          const isAlreadyAllocated = allocations.some(alloc => 
            alloc.hourBlock === hour && 
            alloc.teamMemberId === memberData.member.id &&
            alloc.projectId === selectedProject &&
            alloc.phase === selectedPhase
          );
          
          if (!isAlreadyAllocated) {
            await addAllocationSilentMutation.mutateAsync({
              projectId: selectedProject,
              teamMemberId: memberData.member.id,
              phase: selectedPhase as 'millwork' | 'boxConstruction' | 'stain' | 'install',
              date: dateString,
              hourBlock: hour,
            });

            memberData.currentAllocations++;
            allocationsAdded++;
            setAutoFillProgress(allocationsAdded);
          }
        }
      }

      toast({
        title: "Auto-Fill Complete",
        description: `Added ${allocationsAdded} hour allocations (${currentPhaseAllocations + allocationsAdded}/${phaseCapacity.maxHours} capacity)`,
      });

      // Reset form
      setSelectedProject('');
      setSelectedPhase('');
      setSelectedTeamMembers([]);
      setSelectedHourBlocks([]);
    } catch (error) {
      toast({
        title: "Auto-Fill Error",
        description: "Failed to complete auto-fill operation",
        variant: "destructive",
      });
      console.error('Auto-fill error:', error);
    } finally {
      setIsAutoFilling(false);
      setAutoFillProgress(0);
      setAutoFillTotal(0);
    }
  };

  const handleAddAllocations = async () => {
    if (!selectedProject || !selectedPhase || selectedTeamMembers.length === 0 || selectedHourBlocks.length === 0) {
      toast({ title: "Missing Information", description: "Please fill in all fields and select at least one team member and hour block", variant: "destructive" });
      return;
    }

    try {
      const dateString = format(date, 'yyyy-MM-dd');
      
      for (const teamMemberId of selectedTeamMembers) {
        for (const hourBlock of selectedHourBlocks) {
          // Check if this specific allocation already exists
          const existingAllocation = allocations.find(alloc => 
            alloc.hourBlock === hourBlock && 
            alloc.teamMemberId === teamMemberId &&
            alloc.projectId === selectedProject &&
            alloc.phase === selectedPhase
          );
          
          if (!existingAllocation) {
            await addAllocationMutation.mutateAsync({
              projectId: selectedProject,
              teamMemberId: teamMemberId,
              phase: selectedPhase as 'millwork' | 'boxConstruction' | 'stain' | 'install',
              date: dateString,
              hourBlock: hourBlock,
            });
          }
        }
      }
      
      // Reset form
      setSelectedProject('');
      setSelectedPhase('');
      setSelectedTeamMembers([]);
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

  const isLoading = isLoadingTeamMembers || isLoadingAllocations || isLoadingCapacities;
  const hourBlockOccupancy = getHourBlockOccupancy();
  const availableHourBlocks = getAvailableHourBlocks();
  const eligibleMembers = selectedPhase ? getEligibleTeamMembers(selectedPhase) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1200px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Hour Allocations for {format(date, 'MMMM d, yyyy')}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshCapacities}
              disabled={isLoadingCapacities}
              className="ml-2"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingCapacities ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </DialogTitle>
          <DialogDescription>
            Assign team members to specific hour blocks for different project phases. Work day is 8 AM to 5 PM.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="assign">Assign Hours</TabsTrigger>
            <TabsTrigger value="allocations">Current Allocations</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
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
                      <div className="text-sm font-medium">{block.label}</div>
                      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {block.uniqueTeamMembers} people
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assign" className="space-y-4">
            {/* Auto-Fill Section */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Auto-Fill</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Project</label>
                    <Select value={selectedProject} onValueChange={setSelectedProject} disabled={isAutoFilling}>
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
                    <Select value={selectedPhase} onValueChange={setSelectedPhase} disabled={!selectedProject || isAutoFilling}>
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
                  disabled={!selectedProject || !selectedPhase || eligibleMembers.length === 0 || isAutoFilling}
                  className="w-full"
                >
                  {isAutoFilling ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Auto-Filling... ({autoFillProgress}/{autoFillTotal})
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Auto-Fill to Phase Capacity with Eligible Members
                    </>
                  )}
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
                </div>
                
                {/* Multi-Select Team Members */}
                {selectedPhase && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium">Team Members</label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleSelectAllEligibleMembers}
                          disabled={eligibleMembers.length === 0}
                        >
                          <CheckSquare className="h-3 w-3 mr-1" />
                          Select All Eligible
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleClearTeamMemberSelection}
                          disabled={selectedTeamMembers.length === 0}
                        >
                          <Square className="h-3 w-3 mr-1" />
                          Clear Selection
                        </Button>
                      </div>
                    </div>
                    
                    {/* Selected Team Members Display */}
                    {selectedTeamMembers.length > 0 && (
                      <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="text-sm font-medium mb-2">
                          Selected ({selectedTeamMembers.length} members):
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedTeamMembers.map((memberId) => {
                            const member = teamMembers?.find(m => m.id === memberId);
                            return (
                              <Badge key={memberId} variant="secondary" className="flex items-center gap-1">
                                {member?.name}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveTeamMember(memberId)}
                                  className="h-4 w-4 p-0 hover:bg-transparent"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* Team Member Checkboxes */}
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                      {teamMembers?.filter(member => member.isActive).map((member) => {
                        const isEligible = eligibleMembers.some(em => em.id === member.id);
                        const isSelected = selectedTeamMembers.includes(member.id);
                        
                        return (
                          <div key={member.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`member-${member.id}`}
                              checked={isSelected}
                              onCheckedChange={(checked) => handleTeamMemberToggle(member.id, checked as boolean)}
                              disabled={!isEligible}
                            />
                            <label
                              htmlFor={`member-${member.id}`}
                              className={`text-sm cursor-pointer ${
                                !isEligible ? 'text-muted-foreground' : ''
                              }`}
                            >
                              {member.name} {!isEligible && '(Not eligible)'}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {selectedTeamMembers.length > 0 && selectedProject && selectedPhase && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium">Hour Blocks</label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleSelectAllAvailable}
                          disabled={availableHourBlocks.every(block => block.isAlreadyAllocated)}
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
                    
                    <div className="grid grid-cols-3 gap-2">
                      {availableHourBlocks.map((block) => (
                        <div key={block.hour} className="flex items-center space-x-2">
                          <Checkbox
                            id={`hour-${block.hour}`}
                            checked={selectedHourBlocks.includes(block.hour)}
                            onCheckedChange={(checked) => handleHourBlockToggle(block.hour, checked as boolean)}
                            disabled={block.isAlreadyAllocated}
                          />
                          <label
                            htmlFor={`hour-${block.hour}`}
                            className={`text-sm ${block.isAlreadyAllocated ? 'text-muted-foreground line-through' : 'cursor-pointer'}`}
                          >
                            {block.label} {block.isAlreadyAllocated && '(Conflicts exist)'}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <Button 
                  onClick={handleAddAllocations} 
                  disabled={!selectedProject || !selectedPhase || selectedTeamMembers.length === 0 || selectedHourBlocks.length === 0 || addAllocationMutation.isPending}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Selected Allocations ({selectedTeamMembers.length} members × {selectedHourBlocks.length} hours)
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="allocations" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Current Allocations</h3>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="h-4 w-4 mr-2" />
                  Grid View
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4 mr-2" />
                  List View
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div>Loading allocations...</div>
            ) : viewMode === 'grid' ? (
              <HourAllocationGrid
                allocations={allocations}
                date={date}
                onDeleteAllocation={handleDeleteAllocation}
                isDeleting={removeAllocationMutation.isPending}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Detailed List View</CardTitle>
                </CardHeader>
                <CardContent>
                  {allocations.length === 0 ? (
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
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default HourAllocationDialog;
