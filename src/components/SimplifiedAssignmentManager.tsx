
import * as React from 'react';
import { Project, ProjectAssignment, TeamMember } from '../types/project';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { useProjectAssignments } from '@/hooks/useProjectAssignments';
import { useAddProjectAssignment, useUpdateProjectAssignment, useDeleteProjectAssignment } from '@/hooks/useProjectAssignmentMutations';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, AlertTriangle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

type Phase = 'millwork' | 'boxConstruction' | 'stain' | 'install';

interface SimplifiedAssignmentManagerProps {
  project: Project;
}

export const SimplifiedAssignmentManager: React.FC<SimplifiedAssignmentManagerProps> = ({ project }) => {
  const { teamMembers, isLoading: isLoadingTeamMembers } = useTeamMembers();
  const { data: assignments, isLoading: isLoadingAssignments } = useProjectAssignments({ projectId: project.id });
  
  const addAssignmentMutation = useAddProjectAssignment();
  const updateAssignmentMutation = useUpdateProjectAssignment();
  const deleteAssignmentMutation = useDeleteProjectAssignment();

  const [newAssignments, setNewAssignments] = React.useState<{ [key: string]: { memberId: string; hours: number } }>({});
  const [editingHours, setEditingHours] = React.useState<{ [assignmentId: string]: string }>({});

  const phases: { key: Phase; title: string; hours: number; colorClass: string }[] = [
    { key: 'millwork', title: 'Millwork', hours: project.millworkHrs, colorClass: 'bg-blue-50' },
    { key: 'boxConstruction', title: 'Box Construction', hours: project.boxConstructionHrs, colorClass: 'bg-green-50' },
    { key: 'stain', title: 'Stain', hours: project.stainHrs, colorClass: 'bg-orange-50' },
    { key: 'install', title: 'Install', hours: project.installHrs, colorClass: 'bg-purple-50' },
  ];

  const getPhaseAssignments = (phase: Phase) => {
    return assignments?.filter(a => a.phase === phase) || [];
  };

  const getAssignedHours = (phase: Phase) => {
    const phaseAssignments = getPhaseAssignments(phase);
    return phaseAssignments.reduce((acc, a) => acc + a.assignedHours, 0);
  };

  const getTotalHours = (phase: Phase) => {
    const phaseAssignments = getPhaseAssignments(phase);
    return phaseAssignments.reduce((acc, a) => {
      const hours = editingHours[a.id] ? (parseInt(editingHours[a.id]) || 0) : a.assignedHours;
      return acc + hours;
    }, 0);
  };

  const getAvailableMembers = (phase: Phase) => {
    const assignedMemberIds = new Set(getPhaseAssignments(phase).map(a => a.teamMemberId));
    return teamMembers?.filter(tm => !assignedMemberIds.has(tm.id)) || [];
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

  const handleAddAssignment = (phase: Phase) => {
    const newAssignment = newAssignments[phase];
    if (!newAssignment?.memberId) return;

    addAssignmentMutation.mutate({
      projectId: project.id,
      teamMemberId: newAssignment.memberId,
      phase: phase,
      assignedHours: newAssignment.hours || 0,
    });

    setNewAssignments(prev => ({ ...prev, [phase]: { memberId: '', hours: 0 } }));
  };

  const handleHourUpdate = (assignmentId: string, hours: number) => {
    updateAssignmentMutation.mutate({ id: assignmentId, assignedHours: hours });
    setEditingHours(prev => {
      const newState = { ...prev };
      delete newState[assignmentId];
      return newState;
    });
  };

  const handleHourInputChange = (assignmentId: string, value: string) => {
    setEditingHours(prev => ({ ...prev, [assignmentId]: value }));
  };

  const handleHourInputBlur = (assignmentId: string) => {
    const value = editingHours[assignmentId];
    if (value !== undefined) {
      const hours = parseInt(value) || 0;
      const assignment = assignments?.find(a => a.id === assignmentId);
      if (assignment && assignment.assignedHours !== hours) {
        handleHourUpdate(assignmentId, hours);
      }
    }
  };

  const handleDelete = (assignmentId: string) => {
    deleteAssignmentMutation.mutate(assignmentId);
  };

  const updateNewAssignment = (phase: Phase, field: 'memberId' | 'hours', value: string | number) => {
    setNewAssignments(prev => ({
      ...prev,
      [phase]: { ...prev[phase], [field]: value }
    }));
  };

  if (isLoadingTeamMembers || isLoadingAssignments) {
    return <div className="animate-pulse bg-gray-200 h-64 rounded-lg" />;
  }

  return (
    <div className="space-y-4">
      {phases.map(phase => {
        const phaseAssignments = getPhaseAssignments(phase.key);
        const assignedHours = getAssignedHours(phase.key);
        const totalHours = getTotalHours(phase.key);
        const eligibleMembers = getEligibleMembers(phase.key);
        const progressPercentage = phase.hours > 0 ? (assignedHours / phase.hours) * 100 : 0;
        const isOverage = totalHours > phase.hours;
        const selectedMemberId = newAssignments[phase.key]?.memberId || '';
        const selectedHours = newAssignments[phase.key]?.hours || 0;

        return (
          <div key={phase.key} className={`border rounded-lg p-3 ${phase.colorClass}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h4 className="font-medium">{phase.title}</h4>
                {isOverage && (
                  <div className="flex items-center gap-1 text-red-600">
                    <AlertTriangle className="h-3 w-3" />
                    <span className="text-xs">Over</span>
                  </div>
                )}
              </div>
              <div className={`text-xs ${isOverage ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                {assignedHours} / {phase.hours}h
              </div>
            </div>
            
            <Progress value={Math.min(progressPercentage, 100)} className="h-1 mb-3" />

            {/* Assignments Table */}
            {phaseAssignments.length > 0 && (
              <div className="mb-3">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="py-2">Member</TableHead>
                      <TableHead className="py-2 w-24">Hours</TableHead>
                      <TableHead className="py-2 w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {phaseAssignments.map(assignment => {
                      const member = teamMembers?.find(tm => tm.id === assignment.teamMemberId);
                      const displayValue = editingHours[assignment.id] !== undefined 
                        ? editingHours[assignment.id] 
                        : assignment.assignedHours.toString();
                      
                      return (
                        <TableRow key={assignment.id}>
                          <TableCell className="py-2 text-sm">{member?.name || 'Unknown'}</TableCell>
                          <TableCell className="py-2">
                            <Input
                              type="number"
                              min="0"
                              value={displayValue}
                              onChange={e => handleHourInputChange(assignment.id, e.target.value)}
                              onBlur={() => handleHourInputBlur(assignment.id)}
                              className="w-20 h-8 text-xs"
                            />
                          </TableCell>
                          <TableCell className="py-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDelete(assignment.id)}
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
            
            {/* Add New Assignment */}
            {eligibleMembers.length > 0 && (
              <div className="flex items-center gap-2 pt-2 border-t">
                <Select
                  value={selectedMemberId}
                  onValueChange={value => updateNewAssignment(phase.key, 'memberId', value)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select member" />
                  </SelectTrigger>
                  <SelectContent>
                    {eligibleMembers.map(member => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min="0"
                  placeholder="Hours"
                  value={selectedHours || ''}
                  onChange={e => updateNewAssignment(phase.key, 'hours', parseInt(e.target.value) || 0)}
                  className="w-24 h-8 text-xs"
                />
                <Button 
                  onClick={() => handleAddAssignment(phase.key)} 
                  disabled={!selectedMemberId || addAssignmentMutation.isPending}
                  size="sm"
                  className="h-8 px-2"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              </div>
            )}
            
            {eligibleMembers.length === 0 && phaseAssignments.length === 0 && (
              <div className="text-center py-2 text-xs text-muted-foreground">
                No eligible team members for this phase
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
