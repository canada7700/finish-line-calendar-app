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
}

export const CalendarView = ({ phases }: CalendarViewProps) => {
  const [monthsToRender, setMonthsToRender] = useState([new Date()]);
  const [activePhase, setActivePhase] = useState<ProjectPhase | null>(null);
  const { holidays, isLoading: isLoadingHolidays } = useHolidays();
  const { rescheduleProject } = useProjectRescheduling();

  const observer = useRef<IntersectionObserver>();
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const currentMonthRef = useRef<HTMLDivElement>(null);
  const hasScrolledToCurrentMonth = useRef(false);

  const loadPrevious = useCallback(() => {
    setMonthsToRender(prev => [subMonths(prev[0], 1), ...prev]);
  }, []);

  const loadNext = useCallback(() => {
    setMonthsToRender(prev => [...prev, addMonths(prev[prev.length - 1], 1)]);
  }, []);

  useEffect(() => {
    const currentObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
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
  }, [loadPrevious, loadNext]);

  useEffect(() => {
    if (!isLoadingHolidays && currentMonthRef.current && !hasScrolledToCurrentMonth.current) {
        currentMonthRef.current.scrollIntoView({ block: 'start' });
        hasScrolledToCurrentMonth.current = true;
    }
  }, [isLoadingHolidays, monthsToRender]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === 'project-phase') {
      setActivePhase(active.data.current.phase);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActivePhase(null);

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
          <div className="bg-white dark:bg-gray-800 p-2 rounded shadow-lg border border-gray-200 dark:border-gray-700 max-w-48">
            <div className="text-sm font-medium">{activePhase.projectName}</div>
            <div className="text-xs text-gray-500">Moving entire project timeline</div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};
