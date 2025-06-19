
import { useState, useEffect, useRef, useCallback } from 'react';
import { ProjectPhase } from '../types/project';
import { addMonths, subMonths, isSameMonth, format } from 'date-fns';
import { useHolidays } from '@/hooks/useHolidays';
import { useProjectRescheduling } from '@/hooks/useProjectRescheduling';
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, Loader2 } from 'lucide-react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import MonthView from "./MonthView";

interface CalendarViewProps {
  phases: ProjectPhase[];
  onDragStateChange?: (isDragging: boolean) => void;
}

const MONTHS_STATE_KEY = 'calendar-months-state';
const CURRENT_MONTH_KEY = 'calendar-current-month';

export const CalendarView = ({ phases, onDragStateChange }: CalendarViewProps) => {
  // Initialize monthsToRender from localStorage or default to current month
  const [monthsToRender, setMonthsToRender] = useState(() => {
    try {
      const saved = localStorage.getItem(MONTHS_STATE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((dateStr: string) => new Date(dateStr));
      }
    } catch (e) {
      console.log('Could not restore months state:', e);
    }
    return [new Date()];
  });

  // Track the current month the user is viewing
  const [currentViewMonth, setCurrentViewMonth] = useState(() => {
    try {
      const saved = localStorage.getItem(CURRENT_MONTH_KEY);
      if (saved) {
        return new Date(saved);
      }
    } catch (e) {
      console.log('Could not restore current month:', e);
    }
    return new Date();
  });

  const [activePhase, setActivePhase] = useState<ProjectPhase | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hasCompletedInitialScroll, setHasCompletedInitialScroll] = useState(() => {
    return sessionStorage.getItem('calendar-initial-scroll-done') === 'true';
  });
  
  const { holidays, isLoading: isLoadingHolidays } = useHolidays();
  const { rescheduleProject, isRescheduling } = useProjectRescheduling();

  const observer = useRef<IntersectionObserver>();
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const monthRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Save monthsToRender to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(MONTHS_STATE_KEY, JSON.stringify(monthsToRender.map(m => m.toISOString())));
    } catch (e) {
      console.log('Could not save months state:', e);
    }
  }, [monthsToRender]);

  // Save current view month to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(CURRENT_MONTH_KEY, currentViewMonth.toISOString());
    } catch (e) {
      console.log('Could not save current month:', e);
    }
  }, [currentViewMonth]);

  const loadPrevious = useCallback(() => {
    console.log('Loading previous month');
    setMonthsToRender(prev => [subMonths(prev[0], 1), ...prev]);
  }, []);

  const loadNext = useCallback(() => {
    console.log('Loading next month');
    setMonthsToRender(prev => [...prev, addMonths(prev[prev.length - 1], 1)]);
  }, []);

  // Intersection observer to track which months are visible and detect current view month
  useEffect(() => {
    const monthObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
          // Find which month this element represents
          const monthKey = entry.target.getAttribute('data-month');
          if (monthKey) {
            const month = new Date(monthKey);
            console.log('Month in view:', format(month, 'MMMM yyyy'));
            setCurrentViewMonth(month);
          }
        }
      });
    }, { threshold: [0.5] });

    // Observe all month elements
    monthRefs.current.forEach((element) => {
      monthObserver.observe(element);
    });

    return () => monthObserver.disconnect();
  }, [monthsToRender]);

  // Scroll to specific month
  const scrollToMonth = useCallback((targetMonth: Date) => {
    const monthKey = targetMonth.toISOString();
    const monthElement = monthRefs.current.get(monthKey);
    
    if (monthElement && scrollContainerRef.current) {
      console.log('Scrolling to month:', format(targetMonth, 'MMMM yyyy'));
      monthElement.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }
  }, []);

  // Restore view to current month after phases update (but not during drag or initial load)
  useEffect(() => {
    if (!isDragging && !isRescheduling && hasCompletedInitialScroll) {
      console.log('Restoring view to current month after phases update');
      // Small delay to ensure DOM has updated
      setTimeout(() => {
        scrollToMonth(currentViewMonth);
      }, 100);
    }
  }, [phases, isDragging, isRescheduling, hasCompletedInitialScroll, currentViewMonth, scrollToMonth]);

  useEffect(() => {
    const currentObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !isDragging && !isRescheduling) {
          if (entry.target === topSentinelRef.current) {
            loadPrevious();
          } else if (entry.target === bottomSentinelRef.current) {
            loadNext();
          }
        }
      });
    });
    observer.current = currentObserver;

    if (topSentinelRef.current) currentObserver.observe(topSentinelRef.current);
    if (bottomSentinelRef.current) currentObserver.observe(bottomSentinelRef.current);

    return () => currentObserver.disconnect();
  }, [loadPrevious, loadNext, isDragging, isRescheduling]);

  // Only scroll to current month on VERY FIRST load - never again
  useEffect(() => {
    if (!isLoadingHolidays && !hasCompletedInitialScroll && !isDragging && !isRescheduling) {
      console.log('Performing INITIAL scroll to current month - this should only happen once per session');
      
      const currentMonth = new Date();
      // Check if current month is in our monthsToRender, if not add it
      const hasCurrentMonth = monthsToRender.some(month => isSameMonth(month, currentMonth));
      
      if (!hasCurrentMonth) {
        console.log('Adding current month to rendered months');
        setMonthsToRender(prev => [...prev, currentMonth].sort((a, b) => a.getTime() - b.getTime()));
      }
      
      setTimeout(() => {
        scrollToMonth(currentMonth);
        setCurrentViewMonth(currentMonth);
        setHasCompletedInitialScroll(true);
        sessionStorage.setItem('calendar-initial-scroll-done', 'true');
      }, 200);
    }
  }, [isLoadingHolidays, hasCompletedInitialScroll, isDragging, isRescheduling, monthsToRender, scrollToMonth]);

  const handleDragStart = (event: DragStartEvent) => {
    console.log('Drag start - preventing calendar reset');
    const { active } = event;
    if (active.data.current?.type === 'project-phase') {
      setActivePhase(active.data.current.phase);
      setIsDragging(true);
      
      // Notify parent component about drag state
      onDragStateChange?.(true);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    console.log('Drag end - maintaining calendar position');
    const { active, over } = event;
    setActivePhase(null);
    setIsDragging(false);
    
    // Notify parent component about drag state
    onDragStateChange?.(false);

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

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <ScrollArea className="h-full p-4 md:p-6" ref={scrollContainerRef}>
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
        
        <div ref={topSentinelRef} className="h-1" />
        
        {!isLoadingHolidays ? (
          monthsToRender.map(month => {
            const monthKey = month.toISOString();
            return (
              <div 
                key={monthKey} 
                ref={(el) => {
                  if (el) {
                    monthRefs.current.set(monthKey, el);
                  } else {
                    monthRefs.current.delete(monthKey);
                  }
                }}
                data-month={monthKey}
              >
                <MonthView monthDate={month} phases={phases} holidays={holidays} />
              </div>
            );
          })
        ) : (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}

        <div ref={bottomSentinelRef} className="h-1"/>
      </ScrollArea>

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
