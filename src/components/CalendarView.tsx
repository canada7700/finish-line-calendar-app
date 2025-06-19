
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

export const CalendarView = ({ phases, onDragStateChange }: CalendarViewProps) => {
  const [monthsToRender, setMonthsToRender] = useState([new Date()]);
  const [activePhase, setActivePhase] = useState<ProjectPhase | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hasUserNavigated, setHasUserNavigated] = useState(false);
  const [hasCompletedInitialScroll, setHasCompletedInitialScroll] = useState(false);
  const { holidays, isLoading: isLoadingHolidays } = useHolidays();
  const { rescheduleProject, isRescheduling } = useProjectRescheduling();

  const observer = useRef<IntersectionObserver>();
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const currentMonthRef = useRef<HTMLDivElement>(null);
  const scrollPosition = useRef<number>(0);

  const loadPrevious = useCallback(() => {
    setMonthsToRender(prev => [subMonths(prev[0], 1), ...prev]);
    setHasUserNavigated(true);
  }, []);

  const loadNext = useCallback(() => {
    setMonthsToRender(prev => [...prev, addMonths(prev[prev.length - 1], 1)]);
    setHasUserNavigated(true);
  }, []);

  // Save scroll position before updates
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      const handleScroll = () => {
        scrollPosition.current = scrollContainer.scrollTop;
        // Mark as user navigated if they scroll significantly
        if (!hasUserNavigated && scrollContainer.scrollTop > 100) {
          setHasUserNavigated(true);
        }
      };
      
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, [hasUserNavigated]);

  // Restore scroll position after updates (but not during/after drag operations)
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer && hasCompletedInitialScroll && !isDragging && !isRescheduling) {
      // Small delay to ensure DOM has updated
      const timeoutId = setTimeout(() => {
        scrollContainer.scrollTop = scrollPosition.current;
      }, 50);
      
      return () => clearTimeout(timeoutId);
    }
  }, [phases, isDragging, isRescheduling, hasCompletedInitialScroll]);

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

  // Only scroll to current month on initial load - NEVER after any user interaction
  useEffect(() => {
    if (!isLoadingHolidays && 
        currentMonthRef.current && 
        !hasCompletedInitialScroll && 
        !hasUserNavigated && 
        !isDragging && 
        !isRescheduling) {
      console.log('Scrolling to current month - initial load only');
      currentMonthRef.current.scrollIntoView({ block: 'start' });
      setHasCompletedInitialScroll(true);
    }
  }, [isLoadingHolidays, hasUserNavigated, hasCompletedInitialScroll, isDragging, isRescheduling]);

  const handleDragStart = (event: DragStartEvent) => {
    console.log('Drag start - preventing calendar reset');
    const { active } = event;
    if (active.data.current?.type === 'project-phase') {
      setActivePhase(active.data.current.phase);
      setIsDragging(true);
      setHasUserNavigated(true);
      
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
            const isCurrent = isSameMonth(month, new Date());
            return (
              <div key={month.toISOString()} ref={isCurrent ? currentMonthRef : null}>
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
