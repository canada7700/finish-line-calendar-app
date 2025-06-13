
import { useState } from 'react';
import { ProjectPhase } from '../types/project';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isWeekend, getDay } from 'date-fns';

interface CalendarViewProps {
  phases: ProjectPhase[];
}

const CalendarView = ({ phases }: CalendarViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getPhasesForDate = (date: Date) => {
    return phases.filter(phase => {
      const phaseStart = new Date(phase.startDate);
      const phaseEnd = new Date(phase.endDate);
      return date >= phaseStart && date <= phaseEnd;
    });
  };

  const isNonWorkingDay = (date: Date) => {
    // Debug logging to track the issue
    const dayOfWeek = getDay(date);
    const isWeekendDay = isWeekend(date);
    
    console.log(`📅 Date: ${format(date, 'yyyy-MM-dd')} (${format(date, 'EEEE')}), Day of week: ${dayOfWeek}, isWeekend: ${isWeekendDay}`);
    
    // Check if it's a weekend (Saturday = 6, Sunday = 0)
    if (isWeekendDay) {
      return { isNonWorking: true, reason: 'Weekend' };
    }
    
    // We could add holiday checking here too, but for now just weekends
    return { isNonWorking: false };
  };

  const getDayClasses = (date: Date, dayPhases: ProjectPhase[]) => {
    const nonWorkingInfo = isNonWorkingDay(date);
    let classes = "min-h-[100px] p-1 border border-border rounded-sm ";
    
    if (nonWorkingInfo.isNonWorking) {
      classes += "bg-gray-100 opacity-75 ";
    } else {
      classes += "bg-card ";
    }
    
    if (dayPhases.length > 0 && nonWorkingInfo.isNonWorking) {
      classes += "border-red-300 border-2 "; // Highlight scheduling conflicts
    }
    
    return classes;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Project Calendar - {format(currentDate, 'MMMM yyyy')}</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
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
          {daysInMonth.map(day => {
            const dayPhases = getPhasesForDate(day);
            const nonWorkingInfo = isNonWorkingDay(day);
            const hasSchedulingConflict = dayPhases.length > 0 && nonWorkingInfo.isNonWorking;
            
            return (
              <div
                key={day.toISOString()}
                className={getDayClasses(day, dayPhases)}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm font-medium text-foreground">
                    {format(day, 'd')}
                  </div>
                  {hasSchedulingConflict && (
                    <AlertTriangle className="h-3 w-3 text-red-500" />
                  )}
                </div>
                
                {nonWorkingInfo.isNonWorking && (
                  <div className="text-xs text-gray-600 mb-1">
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
        
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
            <div className="text-sm">
              <div className="font-medium text-yellow-800">Scheduling Conflicts</div>
              <div className="text-yellow-700">
                Red borders indicate work scheduled on weekends or holidays. Use the "Recalculate Dates" button to fix these issues.
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CalendarView;
