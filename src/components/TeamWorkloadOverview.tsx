
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Users, Clock } from 'lucide-react';
import { useTeamMembers } from '../hooks/useTeamMembers';
import { useAllProjectAssignments } from '../hooks/useProjectAssignments';
import { Skeleton } from './ui/skeleton';

const TeamWorkloadOverview = () => {
  const { teamMembers, isLoading: isLoadingTeamMembers } = useTeamMembers();
  const { data: assignments, isLoading: isLoadingAssignments } = useAllProjectAssignments();

  const calculateMemberWorkload = (memberId: string, weeklyHours: number) => {
    if (!assignments) return { totalAssignedHours: 0, utilizationPercentage: 0, assignmentCount: 0 };
    
    const memberAssignments = assignments.filter(assignment => assignment.teamMemberId === memberId);
    const totalAssignedHours = memberAssignments.reduce((sum, assignment) => sum + assignment.assignedHours, 0);
    
    const utilizationPercentage = weeklyHours > 0 ? Math.min((totalAssignedHours / weeklyHours) * 100, 100) : 0;
    
    return {
      totalAssignedHours,
      utilizationPercentage,
      assignmentCount: memberAssignments.length
    };
  };

  const getUtilizationColor = (percentage: number) => {
    if (percentage < 50) return 'text-green-600';
    if (percentage < 80) return 'text-amber-600';
    return 'text-red-600';
  };

  const getUtilizationBadge = (percentage: number) => {
    if (percentage < 50) return { variant: 'secondary' as const, label: 'Available' };
    if (percentage < 80) return { variant: 'default' as const, label: 'Busy' };
    return { variant: 'destructive' as const, label: 'Overloaded' };
  };

  const isLoading = isLoadingTeamMembers || isLoadingAssignments;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Workload Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!teamMembers || teamMembers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Workload Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No team members found. Add team members to see workload overview.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team Workload Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {teamMembers.map(member => {
          const workload = calculateMemberWorkload(member.id, member.weeklyHours);
          const badge = getUtilizationBadge(workload.utilizationPercentage);
          
          return (
            <div key={member.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{member.name}</span>
                  <Badge variant={badge.variant} className="text-xs">
                    {badge.label}
                  </Badge>
                </div>
                <div className={`text-sm font-medium ${getUtilizationColor(workload.utilizationPercentage)}`}>
                  {Math.round(workload.utilizationPercentage)}%
                </div>
              </div>
              
              <Progress 
                value={workload.utilizationPercentage} 
                className="h-2"
              />
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {workload.totalAssignedHours}h assigned / {member.weeklyHours}h capacity
                </div>
                <div>
                  {workload.assignmentCount} project assignment{workload.assignmentCount !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default TeamWorkloadOverview;
