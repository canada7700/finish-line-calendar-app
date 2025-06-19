
import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { format, isWeekend } from 'date-fns';

interface DroppableCalendarDayProps {
  date: Date;
  holidays: Map<string, string>;
  children: React.ReactNode;
  onProjectDrop?: (phaseId: string, newDate: Date) => void;
}

const DroppableCalendarDay = ({ 
  date, 
  holidays, 
  children, 
  onProjectDrop 
}: DroppableCalendarDayProps) => {
  const dateString = format(date, 'yyyy-MM-dd');
  const isWeekendDay = isWeekend(date);
  const isHoliday = holidays.has(dateString);
  const isNonWorkingDay = isWeekendDay || isHoliday;
  
  const {
    isOver,
    setNodeRef,
  } = useDroppable({
    id: `calendar-day-${dateString}`,
    data: {
      date,
      type: 'calendar-day',
      isValidDropTarget: !isNonWorkingDay
    }
  });

  const dropIndicatorClasses = isOver ? (
    isNonWorkingDay ? 
      'ring-2 ring-red-500 ring-offset-2 bg-red-50' : 
      'ring-2 ring-blue-500 ring-offset-2 bg-blue-50'
  ) : '';

  return (
    <div
      ref={setNodeRef}
      className={`
        relative transition-all duration-200
        ${dropIndicatorClasses}
        ${isOver && !isNonWorkingDay ? 'shadow-lg' : ''}
      `}
    >
      {children}
      {isOver && (
        <div className={`
          absolute inset-0 pointer-events-none border-2 border-dashed rounded-sm
          ${isNonWorkingDay ? 'border-red-400 bg-red-100/50' : 'border-blue-400 bg-blue-100/50'}
        `}>
          <div className={`
            absolute top-1 left-1 text-xs px-1 py-0.5 rounded text-white font-medium
            ${isNonWorkingDay ? 'bg-red-500' : 'bg-blue-500'}
          `}>
            {isNonWorkingDay ? 'Invalid' : 'Drop here'}
          </div>
        </div>
      )}
    </div>
  );
};

export default DroppableCalendarDay;
