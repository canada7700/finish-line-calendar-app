
import { useState, useEffect } from 'react';
import { ProjectPhase } from '../types/project';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isWeekend, getDay, startOfWeek, endOfWeek, parseISO, eachWeekendOfInterval } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

interface CalendarViewProps {
  phases: ProjectPhase[];
}

const CalendarView = ({ phases }: CalendarViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [holidays, setHolidays] = useState<string[]>([]);
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  
  // Get the full calendar grid including days from previous/next month
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // Start on Sunday
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 }); // End on Saturday
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Load holidays when component mounts
  useEffect(() => {
    const loadHolidays = async () => {
      try {
        console.log('🔄 Loading holidays for calendar...');
        const { data, error } = await supabase
          .from('holidays')
          .select('date');
        
        if (error) {
          console.error('❌ Error loading holidays:', error);
          return;
        }
        
        const holidayDates = data.map(h => h.date);
        setHolidays(holidayDates);
        console.log('✅ Loaded holidays for calendar:', holidayDates);
      } catch (error) {
        console.error('❌ Failed to load holidays:', error);
      }
    };

    loadHolidays();
  }, []);

  const isWorkingDay = (date: Date): boolean => {
    const dateString = format(date, 'yyyy-MM-dd');
    
    // Check if it's a weekend
    if (isWeekend(date)) {
      return false;
    }
    
    // Check if date matches any holiday
    const isHoliday = holidays.includes(dateString);
    return !isHoliday;
  };

  const getPhasesForDate = (date: Date) => {
    // Only show phases on working days
    if (!isWorkingDay(date)) {
      return [];
    }

    return phases.filter(phase => {
      const phaseStart = new Date(phase.startDate);
      const phaseEnd = new Date(phase.endDate);
      
      // Check if this date falls within the phase range AND is a working day
      if (date >= phaseStart && date <= phaseEnd) {
        // For multi-day phases, we need to check if this specific working day
        // should have work scheduled on it
        return true;
      }
      return false;
    });
  };

  const isNonWorkingDay = (date: Date) => {
    const dayOfWeek = getDay(date);
    const isWeekendDay = isWeekend(date);
    const dateString = format(date, 'yyyy-MM-dd');
    const isHoliday = holidays.includes(dateString);
    
    console.log(`📅 Date: ${format(date, 'yyyy-MM-dd')} (${format(date, 'EEEE')}), Day of week: ${dayOfWeek}, isWeekend: ${isWeekendDay}, isHoliday: ${isHoliday}`);
    
    // Check if it's a weekend (Saturday = 6, Sunday = 0)
    if (isWeekendDay) {
      return { isNonWorking: true, reason: 'Weekend' };
    }
    
    // Check if it's a holiday
    if (isHoliday) {
      return { isNonWorking: true, reason: 'Holiday' };
    }
    
    return { isNonWorking: false };
  };

  const getDayClasses = (date: Date, dayPhases: ProjectPhase[]) => {
    const nonWorkingInfo = isNonWorkingDay(date);
    const isCurrentMonth = date >= monthStart && date <= monthEnd;
    
    let classes = "min-h-[100px] p-1 border border-border rounded-sm ";
    
    if (!isCurrentMonth) {
      classes += "bg-gray-50 opacity-50 "; // Gray out days from other months
    } else if (nonWorkingInfo.isNonWorking) {
      classes += "bg-gray-100 opacity-75 ";
    } else {
      classes += "bg-card ";
    }
    
    // Only show conflict if there are phases scheduled on a non-working day
    // (This should not happen with the new logic, but kept for safety)
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
              <div className="font-medium text-yellow-800">Scheduling Information</div>
              <div className="text-yellow-700">
                Work is only scheduled on business days (Monday-Friday, excluding holidays). 
                Use the "Recalculate Dates" button to ensure all projects follow this rule.
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CalendarView;
