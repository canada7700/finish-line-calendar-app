
import * as React from 'react';
import { Project } from '../types/project';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { useProjectAssignments } from '@/hooks/useProjectAssignments';
import { AssignmentTable } from './AssignmentTable';
import { Skeleton } from '@/components/ui/skeleton';

export const ProjectAssignmentManager = ({ project }: { project: Project }) => {
  const { teamMembers, isLoading: isLoadingTeamMembers } = useTeamMembers();
  const { data: projectAssignments, isLoading: isLoadingAssignments } = useProjectAssignments({ projectId: project.id });

  const isLoading = isLoadingTeamMembers || isLoadingAssignments;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Team Assignments</h3>
        <div className="text-sm text-muted-foreground">
          Assign team members to project phases
        </div>
      </div>
      
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : (
        <AssignmentTable
          project={project}
          assignments={projectAssignments || []}
          teamMembers={teamMembers || []}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};
