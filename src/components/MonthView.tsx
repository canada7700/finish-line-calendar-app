
import { useMemo } from 'react';
import { ProjectPhase } from '../types/project';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, startOfWeek, endOfWeek } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { Holiday } from '@/hooks/useHolidays';

interface MonthViewProps {
  monthDate: Date;
  phases: ProjectPhase[];
  holidays: Holiday[];
}

const MonthView = ({ monthDate, phases, holidays }: MonthViewProps) => {
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);

  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  
  const holidaysMap = useMemo(() => new Map(holidays.map(h => [h.date, h.name])), [holidays]);

  const isNonWorkingDay = (date: Date) => {
    const isWeekendDay = isWeekend(date);
    const dateString = format(date, 'yyyy-MM-dd');
    const holidayName = holidaysMap.get(dateString);
    
    if (isWeekendDay) return { isNonWorking: true, reason: 'Weekend' };
    if (holidayName) return { isNonWorking: true, reason: holidayName };
    return { isNonWorking: false };
  };
  
  const getPhasesForDate = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return phases.filter(phase => phase.startDate === dateString && phase.endDate === dateString);
  };

  const getDayClasses = (date: Date, dayPhases: ProjectPhase[]) => {
    const nonWorkingInfo = isNonWorkingDay(date);
    const isCurrentMonth = date >= monthStart && date <= monthEnd;
    
    let classes = "min-h-[100px] p-1 border border-border rounded-sm ";
    
    if (!isCurrentMonth) {
      classes += "bg-gray-50 dark:bg-gray-800/20 opacity-50 ";
    } else if (nonWorkingInfo.isNonWorking) {
      classes += "bg-gray-100 dark:bg-gray-800/50 opacity-75 ";
    } else {
      classes += "bg-card ";
    }
    
    if (dayPhases.length > 0 && nonWorkingInfo.isNonWorking) {
      classes += "border-red-300 border-2 ";
    }
    
    return classes;
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>{format(monthDate, 'MMMM yyyy')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center font-medium text-muted-foreground text-sm">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map(day => {
            const dayPhases = getPhasesForDate(day);
            const nonWorkingInfo = isNonWorkingDay(day);
            const hasSchedulingConflict = dayPhases.length > 0 && nonWorkingInfo.isNonWorking;
            const isCurrentMonth = day >= monthStart && day <= monthEnd;
            
            return (
              <div
                key={day.toISOString()}
                className={getDayClasses(day, dayPhases)}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className={`text-sm font-medium ${isCurrentMonth ? 'text-foreground' : 'text-gray-400'}`}>
                    {format(day, 'd')}
                  </div>
                  {hasSchedulingConflict && (
                    <AlertTriangle className="h-3 w-3 text-red-500" />
                  )}
                </div>
                
                {nonWorkingInfo.isNonWorking && isCurrentMonth && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 truncate" title={nonWorkingInfo.reason}>
                    {nonWorkingInfo.reason}
                  </div>
                )}
                
                <div className="space-y-1">
                  {dayPhases.map(phase => (
                    <div
                      key={phase.id}
                      className={`text-xs p-1 rounded text-white ${phase.color} truncate ${hasSchedulingConflict ? 'border border-red-300' : ''}`}
                      title={`${phase.projectName} - ${phase.phase.toUpperCase()} (${phase.hours}h)${hasSchedulingConflict ? ' - CONFLICT: Scheduled on ' + nonWorkingInfo.reason : ''}`}
                    >
                      {phase.projectName}
                      <div className="text-[10px] opacity-90">
                        {phase.phase.toUpperCase()}
                      </div>
                      {hasSchedulingConflict && (
                        <div className="text-[10px] text-red-200">
                          ⚠️ CONFLICT
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthView;
