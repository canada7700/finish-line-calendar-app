
import { useProjects } from '@/hooks/useProjects';
import { getProjectPhases } from '@/utils/projectScheduler';
import { CalendarView } from '@/components/CalendarView';
import { ProjectPhase } from '@/types/project';
import { Skeleton } from "@/components/ui/skeleton";

const CalendarPage = () => {
  const { projects, isLoading } = useProjects();
  
  const phases: ProjectPhase[] = projects ? getProjectPhases(projects) : [];

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
