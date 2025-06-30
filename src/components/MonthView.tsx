
import React from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, startOfWeek, endOfWeek } from 'date-fns';
import { ProjectPhase } from '../types/project';
import DroppableCalendarDay from './DroppableCalendarDay';
import { PhaseFilter } from './PhaseFilter';
import { useDailyCapacityStatus } from '../hooks/useDailyCapacityStatus';
import CapacityStatusIndicator from './CapacityStatusIndicator';

interface MonthViewProps {
  currentDate: Date;
  phases: ProjectPhase[];
  selectedPhase: ProjectPhase | null;
  onPhaseSelect: (phase: ProjectPhase | null) => void;
  onDayClick: (date: Date, phase?: ProjectPhase) => void;
  enabledPhases: Set<string>;
  onPhaseToggle: (phase: string) => void;
}

export default function MonthView({ 
  currentDate, 
  phases, 
  selectedPhase, 
  onPhaseSelect, 
  onDayClick, 
  enabledPhases, 
  onPhaseToggle 
}: MonthViewProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  
  // Get capacity status for the month
  const capacityStatus = useDailyCapacityStatus(monthStart, monthEnd);

  const getFilteredPhases = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return phases.filter(phase => {
      if (!enabledPhases.has(phase.phase)) return false;
      
      const startDate = new Date(phase.startDate);
      const endDate = new Date(phase.endDate);
      return date >= startDate && date <= endDate;
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-lg border">
        <div className="grid grid-cols-7 border-b">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-3 text-center font-medium text-muted-foreground border-r last:border-r-0">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7">
          {calendarDays.map(day => {
            const dayPhases = getFilteredPhases(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const dateString = format(day, 'yyyy-MM-dd');
            const dayCapacityStatus = capacityStatus.get(dateString);
            
            return (
              <div key={day.toString()} className="border-r border-b last:border-r-0 h-32 relative">
                <div className={`h-full ${!isCurrentMonth ? 'bg-muted/50' : ''}`}>
                  <div className="p-2 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm ${!isCurrentMonth ? 'text-muted-foreground' : ''}`}>
                        {format(day, 'd')}
                      </span>
                      {dayCapacityStatus && (
                        <CapacityStatusIndicator status={dayCapacityStatus} />
                      )}
                    </div>
                    
                    <DroppableCalendarDay
                      date={day}
                      holidays={new Map()}
                      onProjectDrop={() => {}}
                    >
                      <div className="flex-1 space-y-1">
                        {dayPhases.map(phase => (
                          <div
                            key={phase.id}
                            className={`text-xs p-1 rounded ${phase.color} text-white cursor-pointer`}
                            onClick={() => onDayClick(day, phase)}
                          >
                            {phase.projectName} - {phase.phase}
                          </div>
                        ))}
                      </div>
                    </DroppableCalendarDay>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
