
import { useState } from 'react';
import { ProjectPhase } from '../types/project';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';

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

  const getPhaseDisplayInfo = (phase: ProjectPhase) => {
    const phaseStart = new Date(phase.startDate);
    const phaseEnd = new Date(phase.endDate);
    
    return {
      ...phase,
      isStart: isSameDay(phaseStart, new Date()),
      isEnd: isSameDay(phaseEnd, new Date()),
      duration: Math.ceil((phaseEnd.getTime() - phaseStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
    };
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
            
            return (
              <div
                key={day.toISOString()}
                className="min-h-[100px] p-1 border border-border bg-card rounded-sm"
              >
                <div className="text-sm font-medium mb-1 text-foreground">
                  {format(day, 'd')}
                </div>
                
                <div className="space-y-1">
                  {dayPhases.map(phase => (
                    <div
                      key={phase.id}
                      className={`text-xs p-1 rounded text-white ${phase.color} truncate`}
                      title={`${phase.projectName} - ${phase.phase.toUpperCase()} (${phase.hours}h)`}
                    >
                      {phase.projectName}
                      <div className="text-[10px] opacity-90">
                        {phase.phase.toUpperCase()}
                      </div>
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

export default CalendarView;
