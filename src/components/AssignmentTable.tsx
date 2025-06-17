import * as React from 'react';
import { Project, ProjectAssignment, TeamMember } from '../types/project';
import { useProjectAssignments } from '@/hooks/useProjectAssignments';
import { useAddProjectAssignment, useUpdateProjectAssignment, useDeleteProjectAssignment } from '@/hooks/useProjectAssignmentMutations';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Trash2, Plus } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

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

  const [newAssignments, setNewAssignments] = React.useState<{ [key: string]: { memberId: string; hours: number } }>({});

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

  const handleAddMember = (phase: Phase) => {
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

  const handleHourChange = (assignmentId: string, hours: number) => {
    updateAssignmentMutation.mutate({ id: assignmentId, assignedHours: hours });
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

  const getProgressColor = (assigned: number, total: number) => {
    if (assigned === 0) return 'bg-gray-200';
    if (assigned >= total) return 'bg-green-500';
    return 'bg-blue-500';
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
        const progressPercentage = phase.hours > 0 ? (assignedHours / phase.hours) * 100 : 0;

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
              <div className="flex items-center gap-2 pt-2 border-t">
                <Select 
                  value={newAssignments[phase.key]?.memberId || ''} 
                  onValueChange={value => updateNewAssignment(phase.key, 'memberId', value)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select team member" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMembers.map(member => (
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
                  value={newAssignments[phase.key]?.hours || ''}
                  onChange={e => updateNewAssignment(phase.key, 'hours', parseInt(e.target.value) || 0)}
                  className="w-24"
                />
                <Button 
                  onClick={() => handleAddMember(phase.key)} 
                  disabled={!newAssignments[phase.key]?.memberId || addAssignmentMutation.isPending}
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
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
