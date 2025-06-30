
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

const TeamWorkloadOverview = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team Workload Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Team workload tracking has been replaced with capacity-based scheduling. 
          Check the Calendar page to view capacity utilization across different phases.
        </p>
      </CardContent>
    </Card>
  );
};

export default TeamWorkloadOverview;
