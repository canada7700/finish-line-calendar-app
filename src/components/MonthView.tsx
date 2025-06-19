import { useMemo, useState, useEffect } from 'react';
import { ProjectPhase, ProjectNote, DailyNote } from '../types/project';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, startOfWeek, endOfWeek } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, MessageSquare, Clock } from 'lucide-react';
import { Holiday } from '@/hooks/useHolidays';
import { useProjectNotes } from '@/hooks/useProjectNotes';
import { useDailyNotes } from '@/hooks/useDailyNotes';
import { usePhaseExceptions } from '@/hooks/usePhaseExceptions';
import { useDailyHourAllocations } from '@/hooks/useDailyHourAllocations';
import { useDailyPhaseCapacities, useDayCapacityInfo } from '@/hooks/useDailyCapacities';
import { useProjectRescheduling } from '@/hooks/useProjectRescheduling';
import DayDialog from './DayDialog';
import DraggableProjectPhase from './DraggableProjectPhase';
import DroppableCalendarDay from './DroppableCalendarDay';

interface MonthViewProps {
  monthDate: Date;
  phases: ProjectPhase[];
  holidays: Holiday[];
}

const MonthView = ({ monthDate, phases, holidays }: MonthViewProps) => {
  const [dialogState, setDialogState] = useState<{ 
    open: boolean; 
    date: Date | null; 
    selectedPhase: ProjectPhase | null;
  }>({ open: false, date: null, selectedPhase: null });
  const { rescheduleProject } = useProjectRescheduling();
  
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  
  const { data: projectNotes = [], refetch: refetchProjectNotes } = useProjectNotes(monthStart, monthEnd);
  const { data: dailyNotes = [], refetch: refetchDailyNotes } = useDailyNotes(monthStart, monthEnd);
  const { data: phaseExceptions = [], refetch: refetchPhaseExceptions } = usePhaseExceptions();
  const { data: capacities = [] } = useDailyPhaseCapacities();

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

  const phaseExceptionsMap = useMemo(() => {
    const map = new Map<string, boolean>();
    phaseExceptions.forEach(ex => {
      const key = `${ex.project_id}-${ex.phase}-${ex.date}`;
      map.set(key, true);
    });
    return map;
  }, [phaseExceptions]);

  const phasesByProject = useMemo(() => {
    const map = new Map<string, ProjectPhase[]>();
    phases.forEach(phase => {
      if (!map.has(phase.projectId)) {
        map.set(phase.projectId, []);
      }
      map.get(phase.projectId)!.push(phase);
    });
    return map;
  }, [phases]);

  // Create a map to identify the last install day for each project
  const lastInstallDayByProject = useMemo(() => {
    const map = new Map<string, string>();
    
    // Group install phases by project
    const installPhasesByProject = new Map<string, ProjectPhase[]>();
    phases.forEach(phase => {
      if (phase.phase === 'install') {
        if (!installPhasesByProject.has(phase.projectId)) {
          installPhasesByProject.set(phase.projectId, []);
        }
        installPhasesByProject.get(phase.projectId)!.push(phase);
      }
    });

    // Find the last install date for each project
    installPhasesByProject.forEach((installPhases, projectId) => {
      const sortedPhases = installPhases.sort((a, b) => 
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      );
      if (sortedPhases.length > 0) {
        map.set(projectId, sortedPhases[0].startDate);
      }
    });

    return map;
  }, [phases]);

  const handleProjectDrop = (phaseId: string, newDate: Date) => {
    // Find the phase and project
    const phase = phases.find(p => p.id === phaseId);
    if (!phase || phase.phase !== 'install') return;

    // Get all phases for this project to find the project data
    const projectPhases = phasesByProject.get(phase.projectId) || [];
    
    // Create a mock project object from phase data
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

    // Reschedule the project
    rescheduleProject(project, newDate);
  };

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
    return phases.filter(phase => {
      if (phase.startDate !== dateString || phase.endDate !== dateString) {
        return false;
      }
      const exceptionKey = `${phase.projectId}-${phase.phase}-${dateString}`;
      return !phaseExceptionsMap.has(exceptionKey);
    });
  };

  const getDayClasses = (date: Date, dayPhases: ProjectPhase[], hasCapacityIssues: boolean = false) => {
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
    } else if (hasCapacityIssues) {
      classes += "border-red-400 border-2 ";
    }
    
    return classes;
  };

  const handleDayClick = (day: Date) => {
    setDialogState({ open: true, date: day, selectedPhase: null });
  };

  const handlePhaseClick = (day: Date, phase: ProjectPhase, event: React.MouseEvent) => {
    event.stopPropagation();
    setDialogState({ open: true, date: day, selectedPhase: phase });
  };
  
  const handleNoteUpdate = () => {
    refetchProjectNotes();
    refetchDailyNotes();
    refetchPhaseExceptions();
  };

  const handleDialogClose = (open: boolean) => {
    setDialogState({ ...dialogState, open });
    // Reset selectedPhase when dialog closes
    if (!open) {
      setDialogState(prev => ({ ...prev, selectedPhase: null }));
    }
  };

  return (
    <div id={`month-${format(monthDate, 'yyyy-MM')}`}>
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
              
              const hasCapacityIssues = false;
              
              return (
                <DroppableCalendarDay
                  key={day.toISOString()}
                  date={day}
                  holidays={holidaysMap}
                >
                  <div
                    className={getDayClasses(day, dayPhases, hasCapacityIssues)}
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
                          {hasCapacityIssues && isCurrentMonth && (
                            <Clock className="h-3 w-3 text-orange-500" />
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
                      {dayPhases.map(phase => {
                        // Check if this is the last install day for this project
                        const isLastInstallDay = phase.phase === 'install' && 
                          lastInstallDayByProject.get(phase.projectId) === phase.startDate;
                        
                        return (
                          <DraggableProjectPhase
                            key={phase.id}
                            phase={phase}
                            hasSchedulingConflict={hasSchedulingConflict}
                            conflictReason={nonWorkingInfo.reason}
                            isLastInstallDay={isLastInstallDay}
                            onPhaseClick={(event) => handlePhaseClick(day, phase, event)}
                          >
                            <div
                              className={`text-xs p-1 rounded text-white ${phase.color} truncate ${hasSchedulingConflict ? 'border border-red-300' : ''} relative`}
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
                          </DraggableProjectPhase>
                        );
                      })}
                    </div>
                  </div>
                </DroppableCalendarDay>
              );
            })}
          </div>
        </CardContent>
      </Card>
      <DayDialog
        open={dialogState.open}
        onOpenChange={handleDialogClose}
        date={dialogState.date}
        phases={dialogState.date ? getPhasesForDate(dialogState.date) : []}
        projectNotes={dialogState.date ? projectNotesByDate.get(format(dialogState.date, 'yyyy-MM-dd')) || [] : []}
        dailyNote={dialogState.date ? dailyNotesByDate.get(format(dialogState.date, 'yyyy-MM-dd')) : undefined}
        selectedPhase={dialogState.selectedPhase}
        onNoteUpdate={handleNoteUpdate}
      />
    </div>
  );
};

export default MonthView;
