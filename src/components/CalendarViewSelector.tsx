
import React from 'react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Calendar, ChartGantt } from 'lucide-react';

export type CalendarViewType = 'month' | 'gantt';

interface CalendarViewSelectorProps {
  currentView: CalendarViewType;
  onViewChange: (view: CalendarViewType) => void;
}

export const CalendarViewSelector = ({ currentView, onViewChange }: CalendarViewSelectorProps) => {
  return (
    <ToggleGroup 
      type="single" 
      value={currentView} 
      onValueChange={(value) => value && onViewChange(value as CalendarViewType)}
      className="mb-4"
    >
      <ToggleGroupItem value="month" aria-label="Month View">
        <Calendar className="h-4 w-4 mr-2" />
        Month View
      </ToggleGroupItem>
      <ToggleGroupItem value="gantt" aria-label="Gantt Chart">
        <ChartGantt className="h-4 w-4 mr-2" />
        Gantt Chart
      </ToggleGroupItem>
    </ToggleGroup>
  );
};
