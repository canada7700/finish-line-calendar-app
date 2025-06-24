import * as React from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw } from 'lucide-react';
import { ProjectPhase } from '../types/project';
import { useTeamMembers } from '../hooks/useTeamMembers';
import { useDailyHourAllocations, useAddHourAllocation, useAddHourAllocationSilent, useRemoveHourAllocation } from '../hooks/useDailyHourAllocations';
import { useDailyPhaseCapacities, useDayCapacityInfo } from '../hooks/useDailyCapacities';
import { toast } from '@/hooks/use-toast';
import OverviewTab from './hour-allocation/OverviewTab';
import AutoFillCard from './hour-allocation/AutoFillCard';
import ManualAssignmentCard from './hour-allocation/ManualAssignmentCard';
import AllocationsTab from './hour-allocation/AllocationsTab';

interface HourAllocationDialogProps {
  date: Date;
  phases: ProjectPhase[];
  initialProjectPhase?: ProjectPhase | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const HourAllocationDialog = ({ date, phases, initialProjectPhase, open, onOpenChange }: HourAllocationDialogProps) => {
  const [selectedProject, setSelectedProject] = React.useState<string>('');
  const [selectedPhase, setSelectedPhase] = React.useState<string>('');
  const [selectedTeamMembers, setSelectedTeamMembers] = React.useState<string[]>([]);
  const [selectedHourBlocks, setSelectedHourBlocks] = React.useState<number[]>([]);
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');
  const [isAutoFilling, setIsAutoFilling] = React.useState(false);
  const [autoFillProgress, setAutoFillProgress] = React.useState(0);
  const [autoFillTotal, setAutoFillTotal] = React.useState(0);
  const [isInitialDataLoaded, setIsInitialDataLoaded] = React.useState(false);

  const { teamMembers, isLoading: isLoadingTeamMembers } = useTeamMembers();
  const { data: allocations = [], isLoading: isLoadingAllocations, refetch: refetchAllocations } = useDailyHourAllocations(date);
  const { data: capacities = [], isLoading: isLoadingCapacities, refetch: refetchCapacities } = useDailyPhaseCapacities();
  const addAllocationMutation = useAddHourAllocation();
  const addAllocationSilentMutation = useAddHourAllocationSilent();
  const removeAllocationMutation = useRemoveHourAllocation();

  const { capacityInfo, hasOverAllocation } = useDayCapacityInfo(date, allocations, capacities);

  // Track when initial data has loaded to prevent premature dialog closure
  React.useEffect(() => {
    if (!isLoadingTeamMembers && !isLoadingAllocations && !isLoadingCapacities) {
      setIsInitialDataLoaded(true);
    }
  }, [isLoadingTeamMembers, isLoadingAllocations, isLoadingCapacities]);

  // Set initial values when dialog opens with selected phase context
  React.useEffect(() => {
    if (open && initialProjectPhase && isInitialDataLoaded) {
      setSelectedProject(initialProjectPhase.projectId);
      setSelectedPhase(initialProjectPhase.phase);
    } else if (!open) {
      // Reset form when dialog closes
      setSelectedProject('');
      setSelectedPhase('');
      setSelectedTeamMembers([]);
      setSelectedHourBlocks([]);
      setIsInitialDataLoaded(false);
    }
  }, [open, initialProjectPhase, isInitialDataLoaded]);

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

  const getAvailableHourBlocks = React.useCallback(() => {
    if (selectedTeamMembers.length === 0) return [];
    
    // Extended to 9 hours: 8 AM to 5 PM
    const hourBlocks = Array.from({ length: 9 }, (_, i) => i + 8);
    
    return hourBlocks.map(hour => {
      // Check if ANY of the selected team members are already allocated for this hour (any project/phase)
      const isAlreadyAllocated = selectedTeamMembers.some(teamMemberId =>
        allocations.some(alloc => 
          alloc.hourBlock === hour && 
          alloc.teamMemberId === teamMemberId
        )
      );
      
      return {
        hour,
        isAlreadyAllocated,
        label: `${hour}:00 - ${hour + 1}:00`
      };
    });
  }, [allocations, selectedTeamMembers]);

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
    console.log('🚀 Starting auto-fill process...');
    
    if (!selectedProject || !selectedPhase) {
      console.log('❌ Auto-fill failed: Missing project or phase');
      toast({ title: "Missing Information", description: "Please select project and phase first", variant: "destructive" });
      return;
    }

    const eligibleMembers = getEligibleTeamMembers(selectedPhase);
    const phaseCapacity = capacities.find(c => c.phase === selectedPhase);
    
    console.log('📋 Auto-fill setup:', {
      eligibleMembers: eligibleMembers.length,
      phaseCapacity: phaseCapacity?.maxHours,
      selectedProject,
      selectedPhase
    });
    
    if (eligibleMembers.length === 0) {
      console.log('❌ Auto-fill failed: No eligible members');
      toast({ title: "No Eligible Members", description: "No team members are eligible for this phase", variant: "destructive" });
      return;
    }

    if (!phaseCapacity) {
      console.log('❌ Auto-fill failed: No capacity set');
      toast({ title: "No Capacity Set", description: "No capacity limit set for this phase", variant: "destructive" });
      return;
    }

    // Get current allocations for this phase
    const currentPhaseAllocations = allocations.filter(alloc => 
      alloc.phase === selectedPhase && alloc.projectId === selectedProject
    ).length;

    const remainingCapacity = phaseCapacity.maxHours - currentPhaseAllocations;
    
    console.log('📊 Capacity analysis:', {
      currentAllocations: currentPhaseAllocations,
      maxCapacity: phaseCapacity.maxHours,
      remainingCapacity
    });
    
    if (remainingCapacity <= 0) {
      console.log('❌ Auto-fill failed: Capacity full');
      toast({ title: "Capacity Full", description: "Phase capacity is already at maximum", variant: "destructive" });
      return;
    }

    setIsAutoFilling(true);
    setAutoFillProgress(0);
    setAutoFillTotal(remainingCapacity);

    try {
      const dateString = format(date, 'yyyy-MM-dd');
      let allocationsAdded = 0;
      
      // Extended to 9 hours: 8 AM to 5 PM
      const hourBlocks = Array.from({ length: 9 }, (_, i) => i + 8);

      console.log('⏰ Available hour blocks:', hourBlocks);

      // Fill one person completely before moving to the next
      for (const member of eligibleMembers) {
        if (allocationsAdded >= remainingCapacity) break;
        
        console.log(`👤 Processing member: ${member.name}`);
        
        // Get current allocations for this member on this date (any project/phase)
        let memberCurrentAllocations = allocations.filter(alloc => 
          alloc.teamMemberId === member.id
        ).length;
        
        console.log(`📝 Member ${member.name} current allocations: ${memberCurrentAllocations}`);
        
        // Fill this member's day (up to 9 hours max) before moving to next member
        for (const hour of hourBlocks) {
          if (allocationsAdded >= remainingCapacity) break;
          if (memberCurrentAllocations >= 9) break; // Don't exceed 9 hours per person
          
          // Check if this member is already allocated for this hour (ANY project/phase)
          const isAlreadyAllocated = allocations.some(alloc => 
            alloc.hourBlock === hour && 
            alloc.teamMemberId === member.id
          );
          
          if (!isAlreadyAllocated) {
            try {
              console.log(`⏱️ Allocating hour ${hour} to ${member.name}`);
              
              await addAllocationSilentMutation.mutateAsync({
                projectId: selectedProject,
                teamMemberId: member.id,
                phase: selectedPhase as 'millwork' | 'boxConstruction' | 'stain' | 'install',
                date: dateString,
                hourBlock: hour,
              });

              memberCurrentAllocations++;
              allocationsAdded++;
              setAutoFillProgress(allocationsAdded);
              
              console.log(`✅ Successfully allocated hour ${hour} to ${member.name} (${allocationsAdded}/${remainingCapacity})`);
            } catch (error: any) {
              console.error(`❌ Failed to allocate hour ${hour} to ${member.name}:`, error);
              
              // If we hit a double-booking constraint error, skip this allocation
              if (error.message?.includes('duplicate key value') || error.message?.includes('unique constraint')) {
                console.warn(`⚠️ Skipping double-booking for ${member.name} at hour ${hour}`);
                continue;
              }
              throw error;
            }
          } else {
            console.log(`⏭️ Skipping hour ${hour} for ${member.name} - already allocated`);
          }
        }
      }

      console.log(`🎉 Auto-fill completed: ${allocationsAdded} allocations added`);

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
      console.error('💥 Auto-fill error:', error);
      toast({
        title: "Auto-Fill Error",
        description: "Failed to complete auto-fill operation. Please check the console for details.",
        variant: "destructive",
      });
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
      let successCount = 0;
      let conflictCount = 0;
      
      for (const teamMemberId of selectedTeamMembers) {
        for (const hourBlock of selectedHourBlocks) {
          // Check if this member is already allocated for this hour (ANY project/phase)
          const existingAllocation = allocations.find(alloc => 
            alloc.hourBlock === hourBlock && 
            alloc.teamMemberId === teamMemberId
          );
          
          if (!existingAllocation) {
            try {
              await addAllocationMutation.mutateAsync({
                projectId: selectedProject,
                teamMemberId: teamMemberId,
                phase: selectedPhase as 'millwork' | 'boxConstruction' | 'stain' | 'install',
                date: dateString,
                hourBlock: hourBlock,
              });
              successCount++;
            } catch (error: any) {
              if (error.message?.includes('duplicate key value') || error.message?.includes('unique constraint')) {
                conflictCount++;
                console.warn(`Double-booking prevented for team member ${teamMemberId} at hour ${hourBlock}`);
              } else {
                throw error;
              }
            }
          } else {
            conflictCount++;
          }
        }
      }
      
      if (conflictCount > 0) {
        toast({
          title: "Partial Success",
          description: `Added ${successCount} allocations. ${conflictCount} conflicts were prevented (team members already assigned during those hours).`,
          variant: "default",
        });
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
  const availableHourBlocks = getAvailableHourBlocks();
  const eligibleMembers = selectedPhase ? getEligibleTeamMembers(selectedPhase) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
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
            Assign team members to specific hour blocks for different project phases. Work day is 8 AM to 5 PM. Team members cannot be double-booked.
            {initialProjectPhase && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                <strong>Selected:</strong> {initialProjectPhase.projectName} - {initialProjectPhase.phase.toUpperCase()}
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="assign">Assign Hours</TabsTrigger>
            <TabsTrigger value="allocations">Current Allocations</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <OverviewTab
              capacityInfo={capacityInfo}
              hasOverAllocation={hasOverAllocation}
              allocations={allocations}
              isLoadingCapacities={isLoadingCapacities}
              date={date}
            />
          </TabsContent>

          <TabsContent value="assign" className="space-y-4">
            {/* Side-by-side layout for Auto-Fill and Manual Assignment */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AutoFillCard
                selectedProject={selectedProject}
                selectedPhase={selectedPhase}
                availableProjects={availableProjects}
                availablePhases={availablePhases}
                eligibleMembers={eligibleMembers}
                isAutoFilling={isAutoFilling}
                autoFillProgress={autoFillProgress}
                autoFillTotal={autoFillTotal}
                onProjectChange={setSelectedProject}
                onPhaseChange={setSelectedPhase}
                onAutoFill={handleAutoFill}
              />

              <ManualAssignmentCard
                selectedProject={selectedProject}
                selectedPhase={selectedPhase}
                selectedTeamMembers={selectedTeamMembers}
                selectedHourBlocks={selectedHourBlocks}
                availableProjects={availableProjects}
                availablePhases={availablePhases}
                eligibleMembers={eligibleMembers}
                teamMembers={teamMembers}
                availableHourBlocks={availableHourBlocks}
                isAddingAllocations={addAllocationMutation.isPending}
                onProjectChange={setSelectedProject}
                onPhaseChange={setSelectedPhase}
                onTeamMemberToggle={handleTeamMemberToggle}
                onSelectAllEligibleMembers={handleSelectAllEligibleMembers}
                onClearTeamMemberSelection={handleClearTeamMemberSelection}
                onRemoveTeamMember={handleRemoveTeamMember}
                onHourBlockToggle={handleHourBlockToggle}
                onSelectAllAvailable={handleSelectAllAvailable}
                onClearSelection={handleClearSelection}
                onAddAllocations={handleAddAllocations}
              />
            </div>
          </TabsContent>

          <TabsContent value="allocations" className="space-y-4">
            <AllocationsTab
              allocations={allocations}
              date={date}
              viewMode={viewMode}
              isLoading={isLoading}
              isDeleting={removeAllocationMutation.isPending}
              onViewModeChange={setViewMode}
              onDeleteAllocation={handleDeleteAllocation}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default HourAllocationDialog;
