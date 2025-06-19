
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { getProjectPhases } from '@/utils/projectScheduler';
import { CalendarView } from '@/components/CalendarView';
import { ProjectPhase } from '@/types/project';
import { Skeleton } from "@/components/ui/skeleton";

const CalendarPage = () => {
  const { projects, isLoading: isLoadingProjects } = useProjects();
  const [phases, setPhases] = useState<ProjectPhase[]>([]);
  const [isLoadingPhases, setIsLoadingPhases] = useState(true);
  const [isDragInProgress, setIsDragInProgress] = useState(false);
  
  // Use ref to track the latest phases to avoid stale closures
  const phasesRef = useRef<ProjectPhase[]>([]);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();

  // Memoize projects to prevent unnecessary phase recalculations
  const memoizedProjects = useMemo(() => projects, [projects]);

  // Improved phase comparison function
  const phasesAreEqual = useCallback((oldPhases: ProjectPhase[], newPhases: ProjectPhase[]) => {
    if (oldPhases.length !== newPhases.length) return false;
    
    for (let i = 0; i < oldPhases.length; i++) {
      const oldPhase = oldPhases[i];
      const newPhase = newPhases[i];
      
      if (oldPhase.id !== newPhase.id ||
          oldPhase.startDate !== newPhase.startDate ||
          oldPhase.endDate !== newPhase.endDate ||
          oldPhase.projectId !== newPhase.projectId) {
        return false;
      }
    }
    return true;
  }, []);

  // Debounced phase update function
  const updatePhasesDebounced = useCallback((newProjects: typeof projects) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      if (newProjects && newProjects.length > 0) {
        console.log('Updating phases after debounce');
        setIsLoadingPhases(true);
        try {
          const newPhases = await getProjectPhases(newProjects);
          
          // Only update if phases actually changed
          if (!phasesAreEqual(phasesRef.current, newPhases)) {
            console.log('Phases changed, updating state');
            setPhases(newPhases);
            phasesRef.current = newPhases;
          } else {
            console.log('Phases unchanged, skipping update');
          }
        } finally {
          setIsLoadingPhases(false);
        }
      } else if (!isLoadingProjects) {
        setPhases([]);
        phasesRef.current = [];
        setIsLoadingPhases(false);
      }
    }, isDragInProgress ? 1000 : 100); // Longer delay during drag operations
  }, [phasesAreEqual, isLoadingProjects, isDragInProgress]);

  useEffect(() => {
    // Skip phase recalculation if drag is in progress
    if (isDragInProgress) {
      console.log('Skipping phase update - drag in progress');
      return;
    }

    updatePhasesDebounced(memoizedProjects);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [memoizedProjects, updatePhasesDebounced, isDragInProgress]);

  // Handle drag state changes from CalendarView
  const handleDragStateChange = useCallback((dragging: boolean) => {
    console.log('Drag state changed:', dragging);
    setIsDragInProgress(dragging);
  }, []);

  const isLoading = isLoadingProjects || isLoadingPhases;

  return (
    <div className="h-[calc(100vh-4rem)]">
      {isLoading ? (
        <div className="p-4 md:p-6 space-y-4">
          <Skeleton className="h-12 w-1/4" />
          <Skeleton className="h-[70vh] w-full" />
        </div>
      ) : (
        <CalendarView 
          phases={phases} 
          onDragStateChange={handleDragStateChange}
        />
      )}
    </div>
  );
};

export default CalendarPage;
