
import React, { useState, useMemo } from 'react';
import { ProjectPhase } from '@/types/project';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, isSameDay } from 'date-fns';
import { Holiday } from '@/hooks/useHolidays';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import DraggableProjectPhase from './DraggableProjectPhase';
import DroppableCalendarDay from './DroppableCalendarDay';

interface GanttChartProps {
  phases: ProjectPhase[];
  holidays: Holiday[];
  onDragStateChange?: (isDragging: boolean) => void;
}

export const GanttChart = ({ phases, holidays, onDragStateChange }: GanttChartProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Create holiday map for quick lookup
  const holidayMap = useMemo(() => {
    const map = new Map<string, string>();
    holidays.forEach(holiday => {
      map.set(holiday.date, holiday.name);
    });
    return map;
  }, [holidays]);

  // Generate days for the current month
  const monthDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Group phases by project
  const projectGroups = useMemo(() => {
    const groups = new Map<string, ProjectPhase[]>();
    phases.forEach(phase => {
      const key = `${phase.projectId}-${phase.projectName}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(phase);
    });
    return Array.from(groups.entries()).map(([key, phases]) => ({
      projectId: phases[0].projectId,
      projectName: phases[0].projectName,
      phases: phases.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    }));
  }, [phases]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const getPhasePosition = (phase: ProjectPhase) => {
    const phaseStart = new Date(phase.startDate);
    const phaseEnd = new Date(phase.endDate);
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);

    // Calculate which days this phase spans within the current month
    const startDay = phaseStart < monthStart ? 1 : phaseStart.getDate();
    const endDay = phaseEnd > monthEnd ? monthEnd.getDate() : phaseEnd.getDate();

    if (phaseStart > monthEnd || phaseEnd < monthStart) {
      return null; // Phase not in current month
    }

    return { startDay, endDay, phase };
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'materialOrder': return 'bg-gray-500';
      case 'millwork': return 'bg-purple-500';
      case 'boxConstruction': return 'bg-blue-500';
      case 'stain': return 'bg-amber-500';
      case 'install': return 'bg-green-500';
      default: return 'bg-gray-400';
    }
  };

  const dayWidth = 'w-8'; // Fixed width for each day column

  return (
    <div className="h-full flex flex-col">
      {/* Header with month navigation */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setCurrentMonth(new Date())}
        >
          Today
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          {/* Calendar header with days */}
          <div className="flex mb-4 sticky top-0 bg-background z-10 pb-2 border-b">
            <div className="w-48 flex-shrink-0"></div> {/* Project name column */}
            <div className="flex">
              {monthDays.map(day => {
                const isWeekendDay = isWeekend(day);
                const dateString = format(day, 'yyyy-MM-dd');
                const isHoliday = holidayMap.has(dateString);
                const isToday = isSameDay(day, new Date());

                return (
                  <div
                    key={day.toISOString()}
                    className={`${dayWidth} text-center text-xs py-1 ${
                      isWeekendDay || isHoliday ? 'bg-gray-100 text-gray-500' : ''
                    } ${isToday ? 'bg-blue-100 font-bold' : ''}`}
                  >
                    <div>{format(day, 'd')}</div>
                    <div className="text-xs">{format(day, 'E').slice(0, 1)}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Project rows */}
          {projectGroups.map(({ projectId, projectName, phases }) => (
            <div key={projectId} className="flex mb-2 min-h-[40px] items-center">
              {/* Project name */}
              <div className="w-48 flex-shrink-0 pr-4">
                <div className="text-sm font-medium truncate" title={projectName}>
                  {projectName}
                </div>
              </div>

              {/* Timeline area */}
              <div className="flex relative">
                {monthDays.map((day, dayIndex) => {
                  const dateString = format(day, 'yyyy-MM-dd');
                  const isWeekendDay = isWeekend(day);
                  const isHoliday = holidayMap.has(dateString);

                  return (
                    <DroppableCalendarDay
                      key={day.toISOString()}
                      date={day}
                      holidays={holidayMap}
                    >
                      <div
                        className={`${dayWidth} h-10 border-r border-gray-200 ${
                          isWeekendDay || isHoliday ? 'bg-gray-50' : ''
                        }`}
                      >
                        {/* Phase bars will be positioned absolutely over this grid */}
                      </div>
                    </DroppableCalendarDay>
                  );
                })}

                {/* Phase bars positioned absolutely */}
                {phases.map(phase => {
                  const position = getPhasePosition(phase);
                  if (!position) return null;

                  const { startDay, endDay } = position;
                  const width = (endDay - startDay + 1) * 32; // 32px = w-8
                  const left = (startDay - 1) * 32;

                  return (
                    <DraggableProjectPhase key={phase.id} phase={phase}>
                      <div
                        className={`absolute top-1 h-8 rounded-sm ${getPhaseColor(phase.phase)} opacity-80 hover:opacity-100 transition-opacity cursor-pointer`}
                        style={{
                          left: `${left}px`,
                          width: `${width}px`
                        }}
                        title={`${phase.phase} - ${format(new Date(phase.startDate), 'MMM d')} to ${format(new Date(phase.endDate), 'MMM d')}`}
                      >
                        <div className="text-xs text-white p-1 truncate">
                          {phase.phase}
                        </div>
                      </div>
                    </DraggableProjectPhase>
                  );
                })}
              </div>
            </div>
          ))}

          {projectGroups.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No projects to display for this month
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
