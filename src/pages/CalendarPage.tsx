
import { useState, useEffect, useMemo } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { getProjectPhases } from '@/utils/projectScheduler';
import { CalendarView } from '@/components/CalendarView';
import { ProjectPhase } from '@/types/project';
import { Skeleton } from "@/components/ui/skeleton";

const CalendarPage = () => {
  const { projects, isLoading: isLoadingProjects } = useProjects();
  const [phases, setPhases] = useState<ProjectPhase[]>([]);
  const [isLoadingPhases, setIsLoadingPhases] = useState(true);

  // Memoize projects to prevent unnecessary phase recalculations
  const memoizedProjects = useMemo(() => projects, [projects]);

  useEffect(() => {
    if (memoizedProjects && memoizedProjects.length > 0) {
      setIsLoadingPhases(true);
      getProjectPhases(memoizedProjects)
        .then((newPhases) => {
          // Only update phases if they're actually different to prevent unnecessary re-renders
          setPhases(prevPhases => {
            const phasesChanged = JSON.stringify(prevPhases) !== JSON.stringify(newPhases);
            return phasesChanged ? newPhases : prevPhases;
          });
        })
        .finally(() => setIsLoadingPhases(false));
    } else if (!isLoadingProjects) {
        setPhases([]);
        setIsLoadingPhases(false);
    }
  }, [memoizedProjects, isLoadingProjects]);

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
