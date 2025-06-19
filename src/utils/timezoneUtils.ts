
import { format, parseISO } from 'date-fns';
import { toZonedTime, fromZonedTime, formatInTimeZone } from 'date-fns-tz';

// Get user's timezone
export const getUserTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

// Convert a date string from the database (UTC) to user's local timezone
export const fromUTCToLocal = (utcDateString: string): Date => {
  const utcDate = parseISO(utcDateString);
  return toZonedTime(utcDate, getUserTimezone());
};

// Convert a local date to UTC for database storage
export const fromLocalToUTC = (localDate: Date): string => {
  const utcDate = fromZonedTime(localDate, getUserTimezone());
  return format(utcDate, 'yyyy-MM-dd');
};

// Format a UTC date string for display in user's timezone
export const formatDateInUserTimezone = (utcDateString: string, formatString: string = 'MMM d, yyyy'): string => {
  return formatInTimeZone(parseISO(utcDateString), getUserTimezone(), formatString);
};

// Create a date object that represents the selected date at midnight in user's timezone
export const createLocalDate = (year: number, month: number, day: number): Date => {
  return new Date(year, month, day);
};

// Convert a date input to UTC date string for database
export const dateInputToUTC = (dateInput: string | Date): string => {
  let localDate: Date;
  
  if (typeof dateInput === 'string') {
    // If it's a string in YYYY-MM-DD format, treat it as local date
    const [year, month, day] = dateInput.split('-').map(Number);
    localDate = createLocalDate(year, month - 1, day); // month is 0-indexed
  } else {
    localDate = dateInput;
  }
  
  return fromLocalToUTC(localDate);
};
