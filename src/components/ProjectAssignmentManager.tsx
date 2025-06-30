
import React from 'react';
import { Project } from '../types/project';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { useCapacityScheduler } from '../hooks/useCapacityScheduler';
import { useDailyPhaseCapacities } from '../hooks/useDailyCapacities';
import { useDailyPhaseAllocations } from '../hooks/useDailyPhaseAllocations';

interface ProjectAssignmentManagerProps {
  project: Project;
}

const ProjectAssignmentManager: React.FC<ProjectAssignmentManagerProps> = ({ project }) => {
  const { data: capacities = [] } = useDailyPhaseCapacities();
  const { data: existingAllocations = [] } = useDailyPhaseAllocations();
  const { scheduleProject, isScheduling } = useCapacityScheduler();

  const handleAutoSchedule = () => {
    scheduleProject({
      project,
      capacities,
      existingAllocations,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Capacity-Based Scheduling</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          This project will be automatically scheduled based on shop capacity constraints and working days.
        </p>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Millwork:</span> {project.millworkHrs}h
          </div>
          <div>
            <span className="font-medium">Box Construction:</span> {project.boxConstructionHrs}h
          </div>
          <div>
            <span className="font-medium">Stain:</span> {project.stainHrs}h
          </div>
          <div>
            <span className="font-medium">Install:</span> {project.installHrs}h
          </div>
        </div>

        <Button 
          onClick={handleAutoSchedule}
          disabled={isScheduling}
          className="w-full flex items-center gap-2"
        >
          <Calendar className="h-4 w-4" />
          {isScheduling ? 'Scheduling...' : 'Auto-Schedule to Calendar'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProjectAssignmentManager;
