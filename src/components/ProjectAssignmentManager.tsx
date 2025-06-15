
import * as React from 'react';
import { Project, ProjectAssignment, TeamMember } from '../types/project';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { useProjectAssignments, useAddProjectAssignment, useUpdateProjectAssignment, useDeleteProjectAssignment } from '@/hooks/useProjectAssignments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

type Phase = 'millwork' | 'boxConstruction' | 'stain' | 'install';

interface PhaseManagerProps {
  phase: Phase;
  title: string;
  totalHours: number;
  project: Project;
  assignments: ProjectAssignment[];
  teamMembers: TeamMember[];
  isLoading: boolean;
}

const PhaseManager: React.FC<PhaseManagerProps> = ({ phase, title, totalHours, project, assignments, teamMembers, isLoading }) => {
  const addAssignmentMutation = useAddProjectAssignment();
  const updateAssignmentMutation = useUpdateProjectAssignment();
  const deleteAssignmentMutation = useDeleteProjectAssignment();
  const [selectedMember, setSelectedMember] = React.useState<string>('');

  const assignedHours = assignments.reduce((acc, a) => acc + a.assignedHours, 0);
  const assignedMemberIds = new Set(assignments.map(a => a.teamMemberId));
  const availableMembers = teamMembers.filter(tm => !assignedMemberIds.has(tm.id));

  const handleAddMember = () => {
    if (!selectedMember) return;
    addAssignmentMutation.mutate({
      projectId: project.id,
      teamMemberId: selectedMember,
      phase: phase,
      assignedHours: 0,
    });
    setSelectedMember('');
  };

  const handleHourChange = (assignmentId: string, hours: number) => {
    updateAssignmentMutation.mutate({ id: assignmentId, assignedHours: hours });
  };

  const handleDelete = (assignmentId: string) => {
    deleteAssignmentMutation.mutate(assignmentId);
  };
  
  if (isLoading) {
    return <Skeleton className="h-48 w-full" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {assignedHours} / {totalHours} hours assigned
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {assignments.map(assignment => {
            const member = teamMembers.find(tm => tm.id === assignment.teamMemberId);
            return (
              <div key={assignment.id} className="flex items-center gap-2">
                <Label className="flex-1">{member?.name || 'Unknown Member'}</Label>
                <Input
                  type="number"
                  className="w-24"
                  value={assignment.assignedHours}
                  onChange={e => handleHourChange(assignment.id, parseInt(e.target.value) || 0)}
                  disabled={updateAssignmentMutation.isPending}
                />
                <Button variant="ghost" size="icon" onClick={() => handleDelete(assignment.id)} disabled={deleteAssignmentMutation.isPending}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-2 pt-2 border-t">
          <Select value={selectedMember} onValueChange={setSelectedMember}>
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
          <Button onClick={handleAddMember} disabled={!selectedMember || addAssignmentMutation.isPending}>
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export const ProjectAssignmentManager = ({ project }: { project: Project }) => {
  const { teamMembers, isLoading: isLoadingTeamMembers } = useTeamMembers();
  const { projectAssignments, isLoading: isLoadingAssignments } = useProjectAssignments({ projectId: project.id });

  const phases: { key: Phase; title: string; hours: number }[] = [
    { key: 'millwork', title: 'Millwork', hours: project.millworkHrs },
    { key: 'boxConstruction', title: 'Box Construction', hours: project.boxConstructionHrs },
    { key: 'stain', title: 'Stain', hours: project.stainHrs },
    { key: 'install', title: 'Install', hours: project.installHrs },
  ];
  
  const isLoading = isLoadingTeamMembers || isLoadingAssignments;

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">Manage Assignments</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {phases.map(phaseInfo => (
          <PhaseManager
            key={phaseInfo.key}
            phase={phaseInfo.key}
            title={phaseInfo.title}
            totalHours={phaseInfo.hours}
            project={project}
            assignments={projectAssignments?.filter(a => a.phase === phaseInfo.key) || []}
            teamMembers={teamMembers || []}
            isLoading={isLoading}
          />
        ))}
      </div>
    </div>
  );
};
