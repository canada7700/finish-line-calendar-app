
import { Project, ProjectPhase } from '../types/project';
import { addDays, subDays, format, isWeekend, parseISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

export class ProjectScheduler {
  private static DEFAULT_HOURS_PER_DAY = 8;
  private static holidays: string[] = []; // Store as YYYY-MM-DD strings
  private static holidaysLoaded = false;
  
  // Load holidays from database
  static async loadHolidays() {
    if (this.holidaysLoaded) {
      return; // Already loaded, avoid duplicate requests
    }
    
    try {
      console.log('Loading holidays from database...');
      const { data, error } = await supabase
        .from('holidays')
        .select('date');
      
      if (error) {
        console.error('Error loading holidays:', error);
        return;
      }
      
      // Store holidays as YYYY-MM-DD strings for consistent comparison
      this.holidays = data.map(h => h.date);
      this.holidaysLoaded = true;
      console.log('Loaded holidays:', this.holidays);
    } catch (error) {
      console.error('Failed to load holidays:', error);
    }
  }
  
  // Check if a date is a working day (not weekend, not holiday)
  static isWorkingDay(date: Date): boolean {
    // Check if it's a weekend
    if (isWeekend(date)) {
      console.log(`${format(date, 'yyyy-MM-dd')} is a weekend`);
      return false;
    }
    
    // Check if date matches any holiday (compare as YYYY-MM-DD strings)
    const dateString = format(date, 'yyyy-MM-dd');
    const isHoliday = this.holidays.includes(dateString);
    
    if (isHoliday) {
      console.log(`${dateString} is a holiday`);
    }
    
    return !isHoliday;
  }
  
  // Add business days to a date (skipping weekends and holidays)
  static addBusinessDays(startDate: Date, daysToAdd: number): Date {
    let currentDate = new Date(startDate);
    let addedDays = 0;
    let iterations = 0;
    const maxIterations = daysToAdd * 3; // Safety valve to prevent infinite loops
    
    console.log(`Adding ${daysToAdd} business days to ${format(startDate, 'yyyy-MM-dd')}`);
    
    while (addedDays < daysToAdd && iterations < maxIterations) {
      currentDate = addDays(currentDate, 1);
      iterations++;
      
      if (this.isWorkingDay(currentDate)) {
        addedDays++;
        console.log(`Added business day ${addedDays}: ${format(currentDate, 'yyyy-MM-dd')}`);
      }
    }
    
    console.log(`Final date after adding ${daysToAdd} business days: ${format(currentDate, 'yyyy-MM-dd')}`);
    return currentDate;
  }
  
  // Subtract business days from a date (skipping weekends and holidays)
  static subtractBusinessDays(startDate: Date, daysToSubtract: number): Date {
    let currentDate = new Date(startDate);
    let subtractedDays = 0;
    let iterations = 0;
    const maxIterations = daysToSubtract * 3; // Safety valve
    
    console.log(`Subtracting ${daysToSubtract} business days from ${format(startDate, 'yyyy-MM-dd')}`);
    
    while (subtractedDays < daysToSubtract && iterations < maxIterations) {
      currentDate = subDays(currentDate, 1);
      iterations++;
      
      if (this.isWorkingDay(currentDate)) {
        subtractedDays++;
        console.log(`Subtracted business day ${subtractedDays}: ${format(currentDate, 'yyyy-MM-dd')}`);
      }
    }
    
    console.log(`Final date after subtracting ${daysToSubtract} business days: ${format(currentDate, 'yyyy-MM-dd')}`);
    return currentDate;
  }
  
  // Get the previous working day
  static getPreviousWorkingDay(date: Date): Date {
    let currentDate = subDays(date, 1);
    let iterations = 0;
    const maxIterations = 10; // Safety valve
    
    while (!this.isWorkingDay(currentDate) && iterations < maxIterations) {
      currentDate = subDays(currentDate, 1);
      iterations++;
    }
    
    console.log(`Previous working day from ${format(date, 'yyyy-MM-dd')} is ${format(currentDate, 'yyyy-MM-dd')}`);
    return currentDate;
  }
  
  // Get the next working day
  static getNextWorkingDay(date: Date): Date {
    let currentDate = addDays(date, 1);
    let iterations = 0;
    const maxIterations = 10; // Safety valve
    
    while (!this.isWorkingDay(currentDate) && iterations < maxIterations) {
      currentDate = addDays(currentDate, 1);
      iterations++;
    }
    
    console.log(`Next working day from ${format(date, 'yyyy-MM-dd')} is ${format(currentDate, 'yyyy-MM-dd')}`);
    return currentDate;
  }
  
  // Validate that a date is a working day, if not, suggest next working day
  static validateWorkingDay(date: Date): { isValid: boolean; suggestedDate?: Date } {
    if (this.isWorkingDay(date)) {
      return { isValid: true };
    }
    
    const suggestedDate = this.getNextWorkingDay(date);
    return { isValid: false, suggestedDate };
  }
  
  // Get working hours per day from settings, with fallback to default
  static async getWorkingHours(): Promise<{ shopHours: number; stainHours: number }> {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', ['shop_hours_per_day', 'stain_hours_per_day']);
      
      if (error) {
        console.error('Error loading working hours:', error);
        return { shopHours: this.DEFAULT_HOURS_PER_DAY, stainHours: 6 };
      }
      
      const shopHoursSetting = data.find(s => s.key === 'shop_hours_per_day');
      const stainHoursSetting = data.find(s => s.key === 'stain_hours_per_day');
      
      // Handle Json type properly - convert to number
      const shopHours = shopHoursSetting ? Number(shopHoursSetting.value) : this.DEFAULT_HOURS_PER_DAY;
      const stainHours = stainHoursSetting ? Number(stainHoursSetting.value) : 6;
      
      console.log('Working hours loaded:', { shopHours, stainHours });
      return { shopHours, stainHours };
    } catch (error) {
      console.error('Failed to load working hours:', error);
      return { shopHours: this.DEFAULT_HOURS_PER_DAY, stainHours: 6 };
    }
  }
  
  static async calculateProjectDates(project: Project): Promise<Project> {
    // Load holidays first
    await this.loadHolidays();
    
    // Get working hours
    const { shopHours, stainHours } = await this.getWorkingHours();
    
    const installDate = new Date(project.installDate);
    
    // Validate install date is a working day
    const installValidation = this.validateWorkingDay(installDate);
    if (!installValidation.isValid) {
      console.warn(`Install date ${project.installDate} is not a working day. Consider ${format(installValidation.suggestedDate!, 'yyyy-MM-dd')}`);
    }
    
    // Calculate duration in business days
    const installDuration = Math.ceil(project.installHrs / shopHours);
    const stainDuration = Math.ceil(project.stainHrs / stainHours);
    const shopDuration = Math.ceil(project.shopHrs / shopHours);
    
    console.log('Project durations in business days:', { installDuration, stainDuration, shopDuration });
    
    // Stain must complete before install (1 business day buffer)
    const stainEndDate = this.getPreviousWorkingDay(installDate);
    const stainStartDate = this.subtractBusinessDays(stainEndDate, stainDuration - 1);
    
    // Shop must complete before stain (1 business day buffer)
    const shopEndDate = this.getPreviousWorkingDay(stainStartDate);
    const shopStartDate = this.subtractBusinessDays(shopEndDate, shopDuration - 1);
    
    console.log('Calculated project dates:', {
      shopStart: format(shopStartDate, 'yyyy-MM-dd'),
      shopEnd: format(shopEndDate, 'yyyy-MM-dd'),
      stainStart: format(stainStartDate, 'yyyy-MM-dd'),
      stainEnd: format(stainEndDate, 'yyyy-MM-dd'),
      install: format(installDate, 'yyyy-MM-dd')
    });
    
    return {
      ...project,
      shopStartDate: format(shopStartDate, 'yyyy-MM-dd'),
      stainStartDate: format(stainStartDate, 'yyyy-MM-dd'),
      stainLacquerDate: format(stainEndDate, 'yyyy-MM-dd'),
    };
  }
  
  static async generateProjectPhases(project: Project): Promise<ProjectPhase[]> {
    // Ensure holidays are loaded
    await this.loadHolidays();
    
    const phases: ProjectPhase[] = [];
    const calculatedProject = await this.calculateProjectDates(project);
    const { shopHours, stainHours } = await this.getWorkingHours();
    
    if (calculatedProject.shopStartDate) {
      const shopDuration = Math.ceil(project.shopHrs / shopHours);
      const shopStartDate = new Date(calculatedProject.shopStartDate);
      const shopEndDate = this.addBusinessDays(shopStartDate, shopDuration - 1);
      
      phases.push({
        id: `${project.id}-shop`,
        projectId: project.id,
        projectName: project.jobName,
        phase: 'shop',
        startDate: calculatedProject.shopStartDate,
        endDate: format(shopEndDate, 'yyyy-MM-dd'),
        hours: project.shopHrs,
        color: 'bg-blue-500'
      });
    }
    
    if (calculatedProject.stainStartDate) {
      const stainDuration = Math.ceil(project.stainHrs / stainHours);
      const stainStartDate = new Date(calculatedProject.stainStartDate);
      const stainEndDate = this.addBusinessDays(stainStartDate, stainDuration - 1);
      
      phases.push({
        id: `${project.id}-stain`,
        projectId: project.id,
        projectName: project.jobName,
        phase: 'stain',
        startDate: calculatedProject.stainStartDate,
        endDate: format(stainEndDate, 'yyyy-MM-dd'),
        hours: project.stainHrs,
        color: 'bg-amber-500'
      });
    }
    
    const installDuration = Math.ceil(project.installHrs / shopHours);
    const installStartDate = new Date(project.installDate);
    const installEndDate = this.addBusinessDays(installStartDate, installDuration - 1);
    
    phases.push({
      id: `${project.id}-install`,
      projectId: project.id,
      projectName: project.jobName,
      phase: 'install',
      startDate: project.installDate,
      endDate: format(installEndDate, 'yyyy-MM-dd'),
      hours: project.installHrs,
      color: 'bg-green-500'
    });
    
    console.log('Generated project phases:', phases);
    return phases;
  }
}
