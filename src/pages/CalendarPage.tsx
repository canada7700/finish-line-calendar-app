
import { useState, useEffect, useMemo } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { useHolidays } from '@/hooks/useHolidays';
import { getProjectPhases, ProjectScheduler } from '@/utils/projectScheduler';
import { CalendarView } from '@/components/CalendarView';
import { ProjectPhase } from '@/types/project';
import { Skeleton } from "@/components/ui/skeleton";

const CalendarPage = () => {
  const { projects, isLoading: isLoadingProjects } = useProjects();
  const { holidays, isLoading: isLoadingHolidays } = useHolidays();
  const [phases, setPhases] = useState<ProjectPhase[]>([]);
  const [isLoadingPhases, setIsLoadingPhases] = useState(true);

  const memoizedProjects = useMemo(() => projects, [projects]);
  const memoizedHolidays = useMemo(() => holidays, [holidays]);

  // Calculate phases when projects OR holidays change
  useEffect(() => {
    const calculatePhases = async () => {
      // Wait for both projects and holidays to be loaded
      if (!isLoadingProjects && !isLoadingHolidays && memoizedProjects && memoizedHolidays) {
        console.log('=== STARTING PHASE CALCULATION ===');
        console.log('Projects loaded:', memoizedProjects.length);
        console.log('Holidays loaded:', memoizedHolidays.length);
        
        setIsLoadingPhases(true);
        
        try {
          // Set holidays in ProjectScheduler BEFORE calculating phases
          const holidayDates = memoizedHolidays.map(h => h.date);
          ProjectScheduler.setHolidays(holidayDates);
          
          // Now calculate phases with holidays properly set
          const newPhases = await getProjectPhases(memoizedProjects);
          setPhases(newPhases);
          console.log('Phases calculated successfully:', newPhases.length);
        } catch (error) {
          console.error('Error calculating phases:', error);
        } finally {
          setIsLoadingPhases(false);
        }
      } else {
        console.log('Waiting for data to load...', {
          projectsLoading: isLoadingProjects,
          holidaysLoading: isLoadingHolidays,
          hasProjects: !!memoizedProjects,
          hasHolidays: !!memoizedHolidays
        });
        
        if (!isLoadingProjects && !isLoadingHolidays) {
          setPhases([]);
          setIsLoadingPhases(false);
        }
      }
    };

    calculatePhases();
  }, [memoizedProjects, memoizedHolidays, isLoadingProjects, isLoadingHolidays]);

  const isLoading = isLoadingProjects || isLoadingHolidays || isLoadingPhases;

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
