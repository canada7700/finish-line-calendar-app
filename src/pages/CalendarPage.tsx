
import { useState, useEffect } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { getProjectPhases } from '@/utils/projectScheduler';
import { CalendarView } from '@/components/CalendarView';
import { ProjectPhase } from '@/types/project';
import { Skeleton } from "@/components/ui/skeleton";

const CalendarPage = () => {
  const { projects, isLoading: isLoadingProjects } = useProjects();
  const [phases, setPhases] = useState<ProjectPhase[]>([]);
  const [isLoadingPhases, setIsLoadingPhases] = useState(true);

  useEffect(() => {
    if (projects && projects.length > 0) {
      setIsLoadingPhases(true);
      getProjectPhases(projects)
        .then(setPhases)
        .finally(() => setIsLoadingPhases(false));
    } else if (!isLoadingProjects) {
        setPhases([]);
        setIsLoadingPhases(false);
    }
  }, [projects, isLoadingProjects]);

  const isLoading = isLoadingProjects || isLoadingPhases;

  return (
    <div className="h-[calc(100vh-4rem)]">
      {isLoading ? (
        <div className="p-4 md:p-6 space-y-4">
          <Skeleton className="h-12 w-1/4" />
          <Skeleton className="h-[70vh] w-full" />
        </div>
      ) : (
        <CalendarView phases={phases} />
      )}
    </div>
  );
};

export default CalendarPage;
