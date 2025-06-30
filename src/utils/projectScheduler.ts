
import { addDays, isWeekend, format } from 'date-fns';

export class ProjectScheduler {
  private static holidays: Set<string> = new Set();

  static async loadHolidays() {
    // For now, we'll use a simple list of common holidays
    // This could be enhanced to load from the database in the future
    const currentYear = new Date().getFullYear();
    const commonHolidays = [
      `${currentYear}-01-01`, // New Year's Day
      `${currentYear}-07-04`, // Independence Day
      `${currentYear}-12-25`, // Christmas Day
    ];
    
    this.holidays = new Set(commonHolidays);
  }

  static isHoliday(date: Date): boolean {
    const dateString = format(date, 'yyyy-MM-dd');
    return this.holidays.has(dateString);
  }

  static isWorkingDay(date: Date): boolean {
    return !isWeekend(date) && !this.isHoliday(date);
  }
}
