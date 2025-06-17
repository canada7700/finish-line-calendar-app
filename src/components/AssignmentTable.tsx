
import * as React from 'react';
import { Project, ProjectAssignment, TeamMember } from '../types/project';
import { useProjectAssignments } from '@/hooks/useProjectAssignments';
import { useAddProjectAssignment, useUpdateProjectAssignment, useDeleteProjectAssignment } from '@/hooks/useProjectAssignmentMutations';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, Users, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

type Phase = 'millwork' | 'boxConstruction' | 'stain' | 'install';

interface AssignmentTableProps {
  project: Project;
  assignments: ProjectAssignment[];
  teamMembers: TeamMember[];
  isLoading: boolean;
}

export const AssignmentTable: React.FC<AssignmentTableProps> = ({ 
  project, 
  assignments, 
  teamMembers, 
  isLoading 
}) => {
  const addAssignmentMutation = useAddProjectAssignment();
  const updateAssignmentMutation = useUpdateProjectAssignment();
  const deleteAssignmentMutation = useDeleteProjectAssignment();

  const [newAssignments, setNewAssignments] = React.useState<{ [key: string]: { memberIds: string[]; hours: number } }>({});

  const phases: { key: Phase; title: string; hours: number; colorClass: string }[] = [
    { key: 'millwork', title: 'Millwork', hours: project.millworkHrs, colorClass: 'bg-blue-50 border-blue-200' },
    { key: 'boxConstruction', title: 'Box Construction', hours: project.boxConstructionHrs, colorClass: 'bg-green-50 border-green-200' },
    { key: 'stain', title: 'Stain', hours: project.stainHrs, colorClass: 'bg-orange-50 border-orange-200' },
    { key: 'install', title: 'Install', hours: project.installHrs, colorClass: 'bg-purple-50 border-purple-200' },
  ];

  const getPhaseAssignments = (phase: Phase) => {
    return assignments.filter(a => a.phase === phase);
  };

  const getAssignedHours = (phase: Phase) => {
    return getPhaseAssignments(phase).reduce((acc, a) => acc + a.assignedHours, 0);
  };

  const getAvailableMembers = (phase: Phase) => {
    const assignedMemberIds = new Set(getPhaseAssignments(phase).map(a => a.teamMemberId));
    return teamMembers.filter(tm => !assignedMemberIds.has(tm.id));
  };

  const getEligibleMembers = (phase: Phase) => {
    const availableMembers = getAvailableMembers(phase);
    return availableMembers.filter(member => {
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
  };

  const handleAddMembers = (phase: Phase) => {
    const newAssignment = newAssignments[phase];
    if (!newAssignment?.memberIds?.length) return;

    // Add assignments for all selected members
    newAssignment.memberIds.forEach(memberId => {
      addAssignmentMutation.mutate({
        projectId: project.id,
        teamMemberId: memberId,
        phase: phase,
        assignedHours: newAssignment.hours || 0,
      });
    });

    setNewAssignments(prev => ({ ...prev, [phase]: { memberIds: [], hours: 0 } }));
  };

  const handleHourChange = (assignmentId: string, hours: number) => {
    updateAssignmentMutation.mutate({ id: assignmentId, assignedHours: hours });
  };

  const handleDelete = (assignmentId: string) => {
    deleteAssignmentMutation.mutate(assignmentId);
  };

  const updateNewAssignment = (phase: Phase, field: 'memberIds' | 'hours', value: string[] | number) => {
    setNewAssignments(prev => ({
      ...prev,
      [phase]: { ...prev[phase], [field]: value }
    }));
  };

  const toggleMemberSelection = (phase: Phase, memberId: string) => {
    const currentSelection = newAssignments[phase]?.memberIds || [];
    const isSelected = currentSelection.includes(memberId);
    
    if (isSelected) {
      updateNewAssignment(phase, 'memberIds', currentSelection.filter(id => id !== memberId));
    } else {
      updateNewAssignment(phase, 'memberIds', [...currentSelection, memberId]);
    }
  };

  const selectAllEligibleMembers = (phase: Phase) => {
    const eligibleMembers = getEligibleMembers(phase);
    updateNewAssignment(phase, 'memberIds', eligibleMembers.map(m => m.id));
  };

  const clearMemberSelection = (phase: Phase) => {
    updateNewAssignment(phase, 'memberIds', []);
  };

  const removeMemberFromSelection = (phase: Phase, memberId: string) => {
    const currentSelection = newAssignments[phase]?.memberIds || [];
    updateNewAssignment(phase, 'memberIds', currentSelection.filter(id => id !== memberId));
  };

  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 h-64 rounded-lg" />;
  }

  return (
    <div className="space-y-6">
      {phases.map(phase => {
        const phaseAssignments = getPhaseAssignments(phase.key);
        const assignedHours = getAssignedHours(phase.key);
        const availableMembers = getAvailableMembers(phase.key);
        const eligibleMembers = getEligibleMembers(phase.key);
        const progressPercentage = phase.hours > 0 ? (assignedHours / phase.hours) * 100 : 0;
        const selectedMemberIds = newAssignments[phase.key]?.memberIds || [];

        return (
          <div key={phase.key} className={`border rounded-lg p-4 space-y-4 ${phase.colorClass}`}>
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold">{phase.title}</h4>
              <div className="text-sm text-muted-foreground">
                {assignedHours} / {phase.hours} hours
              </div>
            </div>
            
            <Progress 
              value={Math.min(progressPercentage, 100)} 
              className="h-2"
            />

            {phaseAssignments.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team Member</TableHead>
                    <TableHead className="w-32">Assigned Hours</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {phaseAssignments.map(assignment => {
                    const member = teamMembers.find(tm => tm.id === assignment.teamMemberId);
                    return (
                      <TableRow key={assignment.id}>
                        <TableCell className="font-medium">
                          {member?.name || 'Unknown Member'}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            value={assignment.assignedHours}
                            onChange={e => handleHourChange(assignment.id, parseInt(e.target.value) || 0)}
                            disabled={updateAssignmentMutation.isPending}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDelete(assignment.id)} 
                            disabled={deleteAssignmentMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
            
            {availableMembers.length > 0 && (
              <div className="pt-2 border-t space-y-3">
                {/* Selected Members Display */}
                {selectedMemberIds.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        {selectedMemberIds.length} member{selectedMemberIds.length !== 1 ? 's' : ''} selected
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {selectedMemberIds.map(memberId => {
                        const member = teamMembers.find(tm => tm.id === memberId);
                        return (
                          <Badge key={memberId} variant="secondary" className="flex items-center gap-1">
                            {member?.name}
                            <X 
                              className="h-3 w-3 cursor-pointer hover:text-destructive" 
                              onClick={() => removeMemberFromSelection(phase.key, memberId)}
                            />
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Team Member Selection */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Select Team Members</span>
                    <div className="flex gap-2">
                      {eligibleMembers.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => selectAllEligibleMembers(phase.key)}
                          disabled={selectedMemberIds.length === eligibleMembers.length}
                        >
                          Select All Eligible ({eligibleMembers.length})
                        </Button>
                      )}
                      {selectedMemberIds.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => clearMemberSelection(phase.key)}
                        >
                          Clear Selection
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                    {availableMembers.map(member => {
                      const isEligible = eligibleMembers.some(em => em.id === member.id);
                      const isSelected = selectedMemberIds.includes(member.id);
                      
                      return (
                        <div
                          key={member.id}
                          className={`flex items-center space-x-2 p-2 rounded border cursor-pointer hover:bg-gray-50 ${
                            isSelected ? 'bg-blue-50 border-blue-200' : ''
                          } ${!isEligible ? 'opacity-50' : ''}`}
                          onClick={() => toggleMemberSelection(phase.key, member.id)}
                        >
                          <Checkbox
                            checked={isSelected}
                            onChange={() => {}}
                          />
                          <span className="text-sm flex-1">
                            {member.name}
                            {!isEligible && (
                              <span className="text-xs text-muted-foreground ml-1">(not eligible)</span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Hours Input and Add Button */}
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    placeholder="Hours"
                    value={newAssignments[phase.key]?.hours || ''}
                    onChange={e => updateNewAssignment(phase.key, 'hours', parseInt(e.target.value) || 0)}
                    className="w-24"
                  />
                  <Button 
                    onClick={() => handleAddMembers(phase.key)} 
                    disabled={!selectedMemberIds.length || addAssignmentMutation.isPending}
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add {selectedMemberIds.length > 1 ? `${selectedMemberIds.length} Members` : 'Member'}
                  </Button>
                </div>
              </div>
            )}
            
            {availableMembers.length === 0 && phaseAssignments.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                No team members available for this phase
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
