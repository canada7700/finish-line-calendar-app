
import React, { useState, useMemo } from 'react';
import { format, startOfWeek, addDays, isSameMonth, isSameDay, addWeeks, subWeeks, startOfMonth, endOfMonth } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, Settings, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import CapacityManagementDialog from '@/components/CapacityManagementDialog';
import { useDailyCapacityStatus } from '@/hooks/useDailyCapacityStatus';
import { Badge } from '@/components/ui/badge';

const CalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showCapacityDialog, setShowCapacityDialog] = useState(false);

  // Calculate the calendar view dates
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = addDays(startOfWeek(monthEnd), 41); // 6 weeks * 7 days

  // Get capacity status for the entire month view
  const capacityStatus = useDailyCapacityStatus(calendarStart, calendarEnd);

  const calendarDays = useMemo(() => {
    const days = [];
    let day = calendarStart;
    
    while (day <= calendarEnd) {
      days.push(day);
      day = addDays(day, 1);
    }
    
    return days;
  }, [calendarStart, calendarEnd]);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setShowCapacityDialog(true);
  };

  const handlePrevMonth = () => {
    setCurrentDate(prev => subWeeks(prev, 4));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => addWeeks(prev, 4));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'fully-staffed':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'partially-staffed':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'under-staffed':
        return 'bg-orange-100 border-orange-300 text-orange-800';
      case 'over-allocated':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'no-work':
      default:
        return 'bg-gray-50 border-gray-200 text-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'fully-staffed':
        return 'Full';
      case 'partially-staffed':
        return 'Partial';
      case 'under-staffed':
        return 'Under';
      case 'over-allocated':
        return 'Over';
      case 'no-work':
      default:
        return 'Free';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Capacity Calendar</h1>
          <p className="text-muted-foreground">Manage shop capacity and phase allocations</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={handlePrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {format(currentDate, 'MMMM yyyy')}
              </CardTitle>
              <Button variant="outline" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs">
                <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                <span>Full</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded"></div>
                <span>Partial</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <div className="w-3 h-3 bg-orange-100 border border-orange-300 rounded"></div>
                <span>Under</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
                <span>Over</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Calendar Grid */}
          <div className="space-y-1">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day) => {
                const dateString = format(day, 'yyyy-MM-dd');
                const dayStatus = capacityStatus.get(dateString);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isToday = isSameDay(day, new Date());
                
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => handleDateClick(day)}
                    className={`
                      relative p-2 h-16 border rounded-lg text-left transition-all hover:scale-105
                      ${isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'}
                      ${isToday ? 'ring-2 ring-primary' : ''}
                      ${dayStatus ? getStatusColor(dayStatus.status) : 'bg-gray-50 border-gray-200'}
                      hover:shadow-md
                    `}
                  >
                    <div className="text-sm font-medium">
                      {format(day, 'd')}
                    </div>
                    {dayStatus && isCurrentMonth && (
                      <div className="absolute bottom-1 right-1">
                        <Badge variant="outline" className="text-xs px-1 py-0">
                          {getStatusText(dayStatus.status)}
                        </Badge>
                      </div>
                    )}
                    {dayStatus && dayStatus.totalAllocated > 0 && isCurrentMonth && (
                      <div className="absolute bottom-1 left-1 text-xs font-medium">
                        {dayStatus.totalAllocated}h
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Capacity Management Dialog */}
      {selectedDate && (
        <CapacityManagementDialog
          date={selectedDate}
          open={showCapacityDialog}
          onOpenChange={setShowCapacityDialog}
        />
      )}
    </div>
  );
};

export default CalendarPage;
