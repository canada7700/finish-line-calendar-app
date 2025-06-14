
import { useState, useEffect, useRef, useCallback } from 'react';
import { ProjectPhase } from '../types/project';
import { addMonths, subMonths } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from "@/components/ui/scroll-area";
import MonthView from "./MonthView";
import { AlertTriangle, Loader2 } from 'lucide-react';

interface CalendarViewProps {
  phases: ProjectPhase[];
}

export const CalendarView = ({ phases }: CalendarViewProps) => {
  const [monthsToRender, setMonthsToRender] = useState([new Date()]);
  const [holidays, setHolidays] = useState<string[]>([]);
  const [holidaysLoaded, setHolidaysLoaded] = useState(false);

  const observer = useRef<IntersectionObserver>();
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadHolidays = async () => {
      try {
        const { data, error } = await supabase
          .from('holidays')
          .select('date');
        
        if (error) {
          console.error('❌ CalendarView: Error loading holidays:', error);
          return;
        }
        
        const holidayDates = data.map(h => h.date);
        setHolidays(holidayDates);
        setHolidaysLoaded(true);
      } catch (error) {
        console.error('❌ CalendarView: Failed to load holidays:', error);
      }
    };

    loadHolidays();
  }, []);

  const loadPrevious = useCallback(() => {
    setMonthsToRender(prev => [subMonths(prev[0], 1), ...prev]);
  }, []);

  const loadNext = useCallback(() => {
    setMonthsToRender(prev => [...prev, addMonths(prev[prev.length - 1], 1)]);
  }, []);

  useEffect(() => {
    const currentObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (entry.target === topSentinelRef.current) {
            loadPrevious();
          } else if (entry.target === bottomSentinelRef.current) {
            loadNext();
          }
        }
      });
    });
    observer.current = currentObserver;

    if (topSentinelRef.current) currentObserver.observe(topSentinelRef.current);
    if (bottomSentinelRef.current) currentObserver.observe(bottomSentinelRef.current);

    return () => currentObserver.disconnect();
  }, [loadPrevious, loadNext]);


  return (
    <ScrollArea className="h-full p-4 md:p-6" ref={scrollContainerRef}>
      <div className="flex items-start gap-2 p-3 mb-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/30 rounded-md">
        <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
        <div className="text-sm">
          <div className="font-medium text-yellow-800 dark:text-yellow-200">Scheduling Information</div>
          <div className="text-yellow-700 dark:text-yellow-300">
            Work is only scheduled on business days (Monday-Friday, excluding holidays). 
            Use the "Recalculate Dates" button on a project to ensure it follows this rule.
          </div>
        </div>
      </div>
      
      <div ref={topSentinelRef} className="h-1" />
      
      {holidaysLoaded ? (
        monthsToRender.map(month => (
          <MonthView key={month.toISOString()} monthDate={month} phases={phases} holidays={holidays} />
        ))
      ) : (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}

      <div ref={bottomSentinelRef} className="h-1"/>
    </ScrollArea>
  );
};
