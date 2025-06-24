
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { TeamMember } from '../../types/project';
import TeamMemberSelector from './TeamMemberSelector';
import HourBlockSelector from './HourBlockSelector';

interface ManualAssignmentCardProps {
  selectedProject: string;
  selectedPhase: string;
  selectedTeamMembers: string[];
  selectedHourBlocks: number[];
  availableProjects: Array<{ id: string; name: string }>;
  availablePhases: string[];
  eligibleMembers: TeamMember[];
  teamMembers: TeamMember[] | undefined;
  availableHourBlocks: Array<{
    hour: number;
    isAlreadyAllocated: boolean;
    label: string;
  }>;
  isAddingAllocations: boolean;
  onProjectChange: (value: string) => void;
  onPhaseChange: (value: string) => void;
  onTeamMemberToggle: (memberId: string, checked: boolean) => void;
  onSelectAllEligibleMembers: () => void;
  onClearTeamMemberSelection: () => void;
  onRemoveTeamMember: (memberId: string) => void;
  onHourBlockToggle: (hour: number, checked: boolean) => void;
  onSelectAllAvailable: () => void;
  onClearSelection: () => void;
  onAddAllocations: () => void;
}

const ManualAssignmentCard: React.FC<ManualAssignmentCardProps> = ({
  selectedProject,
  selectedPhase,
  selectedTeamMembers,
  selectedHourBlocks,
  availableProjects,
  availablePhases,
  eligibleMembers,
  teamMembers,
  availableHourBlocks,
  isAddingAllocations,
  onProjectChange,
  onPhaseChange,
  onTeamMemberToggle,
  onSelectAllEligibleMembers,
  onClearTeamMemberSelection,
  onRemoveTeamMember,
  onHourBlockToggle,
  onSelectAllAvailable,
  onClearSelection,
  onAddAllocations
}) => {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle>Manual Hour Allocation</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col flex-1">
        <div className="flex-1 space-y-4">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Project</label>
              <Select value={selectedProject} onValueChange={onProjectChange}>
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
              <Select value={selectedPhase} onValueChange={onPhaseChange} disabled={!selectedProject}>
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
            <TeamMemberSelector
              selectedTeamMembers={selectedTeamMembers}
              eligibleMembers={eligibleMembers}
              teamMembers={teamMembers}
              onTeamMemberToggle={onTeamMemberToggle}
              onSelectAllEligibleMembers={onSelectAllEligibleMembers}
              onClearTeamMemberSelection={onClearTeamMemberSelection}
              onRemoveTeamMember={onRemoveTeamMember}
            />
          )}
          
          {selectedTeamMembers.length > 0 && selectedProject && selectedPhase && (
            <HourBlockSelector
              selectedHourBlocks={selectedHourBlocks}
              availableHourBlocks={availableHourBlocks}
              onHourBlockToggle={onHourBlockToggle}
              onSelectAllAvailable={onSelectAllAvailable}
              onClearSelection={onClearSelection}
            />
          )}
        </div>
        
        <div className="mt-4">
          <Button 
            onClick={onAddAllocations} 
            disabled={!selectedProject || !selectedPhase || selectedTeamMembers.length === 0 || selectedHourBlocks.length === 0 || isAddingAllocations}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Allocations ({selectedTeamMembers.length} × {selectedHourBlocks.length})
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ManualAssignmentCard;
