
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Users, Clock } from 'lucide-react';
import { useTeamMembers } from '../hooks/useTeamMembers';
import { useProjectAssignments } from '../hooks/useProjectAssignments';

const TeamWorkloadOverview = () => {
  const { teamMembers } = useTeamMembers();
  const { assignments } = useProjectAssignments();

  const calculateMemberWorkload = (memberId: string, weeklyHours: number) => {
    const memberAssignments = assignments.filter(assignment => assignment.teamMemberId === memberId);
    const totalAssignedHours = memberAssignments.reduce((sum, assignment) => sum + assignment.assignedHours, 0);
    
    // Rough calculation assuming assignments are spread over weeks
    const utilizationPercentage = Math.min((totalAssignedHours / weeklyHours) * 100, 100);
    
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

  if (teamMembers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Workload Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No team members found. Add team members in Settings to see workload overview.</p>
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
                  {workload.assignmentCount} project{workload.assignmentCount !== 1 ? 's' : ''}
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
