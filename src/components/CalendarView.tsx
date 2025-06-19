
import { useState, useRef, useMemo } from 'react';
import { ProjectPhase } from '../types/project';
import { addMonths, subMonths } from 'date-fns';
import { useHolidays } from '@/hooks/useHolidays';
import { useProjectRescheduling } from '@/hooks/useProjectRescheduling';
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, Loader2 } from 'lucide-react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import MonthView from "./MonthView";
import { PhaseFilter } from "./PhaseFilter";

interface CalendarViewProps {
  phases: ProjectPhase[];
  onDragStateChange?: (isDragging: boolean) => void;
}

export const CalendarView = ({ phases, onDragStateChange }: CalendarViewProps) => {
  // Simple month management - just show 12 months starting from current month
  const [monthsToRender] = useState(() => {
    const months = [];
    const currentMonth = new Date();
    // Show 6 months before and 18 months after current month
    for (let i = -6; i <= 18; i++) {
      months.push(addMonths(currentMonth, i));
    }
    return months;
  });

  const [activePhase, setActivePhase] = useState<ProjectPhase | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [savedScrollPosition, setSavedScrollPosition] = useState<number | null>(null);
  const [selectedPhases, setSelectedPhases] = useState<string[]>(['all']);
  const [scrollLocked, setScrollLocked] = useState(false);
  
  const { holidays, isLoading: isLoadingHolidays } = useHolidays();
  const { rescheduleProject, isRescheduling } = useProjectRescheduling();

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Filter phases based on selected filters
  const filteredPhases = useMemo(() => {
    if (selectedPhases.includes('all') || selectedPhases.length === 0) {
      return phases;
    }
    return phases.filter(phase => selectedPhases.includes(phase.phase));
  }, [phases, selectedPhases]);

  const handleFilterChange = (newSelectedPhases: string[]) => {
    setSelectedPhases(newSelectedPhases);
  };

  const lockScrollPosition = () => {
    if (scrollContainerRef.current) {
      const currentPosition = scrollContainerRef.current.scrollTop;
      setSavedScrollPosition(currentPosition);
      setScrollLocked(true);
      console.log('Scroll locked at position:', currentPosition);
      
      // Prevent any scroll events during the lock
      const scrollHandler = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = currentPosition;
        }
      };
      
      scrollContainerRef.current.addEventListener('scroll', scrollHandler, { passive: false });
      
      // Store the handler to remove it later
      (scrollContainerRef.current as any)._lockHandler = scrollHandler;
    }
  };

  const unlockScrollPosition = () => {
    if (scrollContainerRef.current && scrollLocked) {
      const scrollHandler = (scrollContainerRef.current as any)._lockHandler;
      if (scrollHandler) {
        scrollContainerRef.current.removeEventListener('scroll', scrollHandler);
        delete (scrollContainerRef.current as any)._lockHandler;
      }
      
      if (savedScrollPosition !== null) {
        // Use multiple requestAnimationFrame calls for better timing
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              if (scrollContainerRef.current && savedScrollPosition !== null) {
                console.log('Restoring scroll position to:', savedScrollPosition);
                scrollContainerRef.current.scrollTop = savedScrollPosition;
                setSavedScrollPosition(null);
                setScrollLocked(false);
              }
            });
          });
        });
      } else {
        setScrollLocked(false);
      }
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    console.log('Drag start - locking scroll position');
    const { active } = event;
    
    // Lock the scroll position immediately
    lockScrollPosition();
    
    if (active.data.current?.type === 'project-phase') {
      setActivePhase(active.data.current.phase);
      setIsDragging(true);
      onDragStateChange?.(true);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    console.log('Drag end - preparing to restore scroll position');
    const { active, over } = event;
    
    setActivePhase(null);
    setIsDragging(false);
    onDragStateChange?.(false);

    // Delay any database operations until after scroll is restored
    const performReschedule = () => {
      if (!over || over.data.current?.type !== 'calendar-day') {
        return;
      }

      const dropDate = over.data.current.date;
      const isValidDropTarget = over.data.current.isValidDropTarget;

      if (!isValidDropTarget) {
        console.log('Cannot drop on non-working day');
        return;
      }

      if (active.data.current?.type === 'project-phase') {
        const phase = active.data.current.phase as ProjectPhase;
        
        // Only handle install phases (which are our drag handles)
        if (phase.phase === 'install') {
          // Find the project and reschedule it
          const projectPhases = phases.filter(p => p.projectId === phase.projectId);
          
          const project = {
            id: phase.projectId,
            jobName: phase.projectName,
            jobDescription: '',
            millworkHrs: projectPhases.filter(p => p.phase === 'millwork').reduce((sum, p) => sum + p.hours, 0),
            boxConstructionHrs: projectPhases.filter(p => p.phase === 'boxConstruction').reduce((sum, p) => sum + p.hours, 0),
            stainHrs: projectPhases.filter(p => p.phase === 'stain').reduce((sum, p) => sum + p.hours, 0),
            installHrs: projectPhases.filter(p => p.phase === 'install').reduce((sum, p) => sum + p.hours, 0),
            installDate: phase.startDate,
            status: 'planning' as const
          };

          rescheduleProject(project, dropDate);
        }
      }
    };

    // First restore scroll position, then perform the reschedule
    unlockScrollPosition();
    
    // Delay the reschedule operation to allow scroll restoration to complete
    setTimeout(() => {
      performReschedule();
    }, 100);
  };

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="h-full flex flex-col">
        <PhaseFilter phases={phases} onFilterChange={handleFilterChange} />
        
        <ScrollArea className="flex-1 p-4 md:p-6" ref={scrollContainerRef}>
          <div className="flex items-start gap-2 p-3 mb-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/30 rounded-md">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
            <div className="text-sm">
              <div className="font-medium text-yellow-800 dark:text-yellow-200">Scheduling Information</div>
              <div className="text-yellow-700 dark:text-yellow-300">
                Work is only scheduled on business days (Monday-Friday, excluding holidays). 
                Use the "Recalculate Dates" button on a project to ensure it follows this rule.
                <br />
                <strong>Drag install phases (marked with blue dots) to reschedule entire projects.</strong>
              </div>
            </div>
          </div>

          {isRescheduling && (
            <div className="flex items-center justify-center gap-2 p-3 mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-md">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                Rescheduling project...
              </div>
            </div>
          )}
          
          {!isLoadingHolidays ? (
            monthsToRender.map(month => (
              <div key={month.toISOString()}>
                <MonthView monthDate={month} phases={filteredPhases} holidays={holidays} />
              </div>
            ))
          ) : (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}
        </ScrollArea>
      </div>

      <DragOverlay>
        {activePhase && (
          <div className="bg-white dark:bg-gray-800 p-2 rounded shadow-lg border border-gray-200 dark:border-gray-700 max-w-48 opacity-90">
            <div className="text-sm font-medium">{activePhase.projectName}</div>
            <div className="text-xs text-gray-500">Moving entire project timeline</div>
            {isRescheduling && (
              <div className="flex items-center gap-1 mt-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="text-xs text-gray-600">Updating...</span>
              </div>
            )}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};
