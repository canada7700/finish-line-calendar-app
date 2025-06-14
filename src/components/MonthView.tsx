
import { useMemo, useState } from 'react';
import { ProjectPhase, ProjectNote, DailyNote } from '../types/project';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, startOfWeek, endOfWeek } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, MessageSquare } from 'lucide-react';
import { Holiday } from '@/hooks/useHolidays';
import { useProjectNotes } from '@/hooks/useProjectNotes';
import { useDailyNotes } from '@/hooks/useDailyNotes';
import DayDialog from './DayDialog';

interface MonthViewProps {
  monthDate: Date;
  phases: ProjectPhase[];
  holidays: Holiday[];
}

const MonthView = ({ monthDate, phases, holidays }: MonthViewProps) => {
  const [dialogState, setDialogState] = useState<{ open: boolean; date: Date | null }>({ open: false, date: null });
  
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  
  const { data: projectNotes = [], refetch: refetchProjectNotes } = useProjectNotes(monthStart, monthEnd);
  const { data: dailyNotes = [], refetch: refetchDailyNotes } = useDailyNotes(monthStart, monthEnd);

  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  
  const holidaysMap = useMemo(() => new Map(holidays.map(h => [h.date, h.name])), [holidays]);
  const projectNotesByDate = useMemo(() => {
    const map = new Map<string, ProjectNote[]>();
    projectNotes.forEach(note => {
      const dateKey = note.date;
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(note);
    });
    return map;
  }, [projectNotes]);

  const dailyNotesByDate = useMemo(() => {
    const map = new Map<string, DailyNote>();
    dailyNotes.forEach(note => {
        map.set(note.date, note);
    });
    return map;
  }, [dailyNotes]);

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
    
    let classes = "min-h-[120px] p-1 border border-border rounded-sm transition-colors cursor-pointer hover:bg-muted/50 flex flex-col ";
    
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

  const handleDayClick = (day: Date) => {
    setDialogState({ open: true, date: day });
  };
  
  const handleNoteUpdate = () => {
    refetchProjectNotes();
    refetchDailyNotes();
  };

  return (
    <>
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
              const dateString = format(day, 'yyyy-MM-dd');
              const dayProjectNotes = projectNotesByDate.get(dateString) || [];
              const dayDailyNote = dailyNotesByDate.get(dateString);
              const hasNotes = dayProjectNotes.some(n => n.note) || (dayDailyNote && dayDailyNote.note);
              
              return (
                <div
                  key={day.toISOString()}
                  className={getDayClasses(day, dayPhases)}
                  onClick={() => handleDayClick(day)}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className={`text-sm font-medium ${isCurrentMonth ? 'text-foreground' : 'text-gray-400'}`}>
                        {format(day, 'd')}
                      </div>
                      <div className="flex items-center gap-1">
                        {hasNotes && isCurrentMonth && (
                          <MessageSquare className="h-3 w-3 text-blue-500" />
                        )}
                        {hasSchedulingConflict && (
                          <AlertTriangle className="h-3 w-3 text-red-500" />
                        )}
                      </div>
                    </div>
                    
                    {nonWorkingInfo.isNonWorking && isCurrentMonth && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 truncate" title={nonWorkingInfo.reason}>
                        {nonWorkingInfo.reason}
                      </div>
                    )}

                    {isCurrentMonth && dayDailyNote?.note && (
                      <div className="mt-1 text-xs text-muted-foreground break-words">
                        <p className="line-clamp-2">{dayDailyNote.note}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-1 mt-auto pt-1">
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
      <DayDialog
        open={dialogState.open}
        onOpenChange={(open) => setDialogState({ ...dialogState, open })}
        date={dialogState.date}
        phases={dialogState.date ? getPhasesForDate(dialogState.date) : []}
        projectNotes={dialogState.date ? projectNotesByDate.get(format(dialogState.date, 'yyyy-MM-dd')) || [] : []}
        dailyNote={dialogState.date ? dailyNotesByDate.get(format(dialogState.date, 'yyyy-MM-dd')) : undefined}
        onNoteUpdate={handleNoteUpdate}
      />
    </>
  );
};

export default MonthView;
