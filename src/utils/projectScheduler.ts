
import { Project, ProjectPhase } from '../types/project';
import { addDays, subDays, format, isWeekend, parseISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

export class ProjectScheduler {
  private static DEFAULT_HOURS_PER_DAY = 8;
  private static holidays: Date[] = [];
  
  // Load holidays from database
  static async loadHolidays() {
    try {
      const { data, error } = await supabase
        .from('holidays')
        .select('date');
      
      if (error) {
        console.error('Error loading holidays:', error);
        return;
      }
      
      this.holidays = data.map(h => new Date(h.date));
      console.log('Loaded holidays:', this.holidays);
    } catch (error) {
      console.error('Failed to load holidays:', error);
    }
  }
  
  // Check if a date is a working day (not weekend, not holiday)
  static isWorkingDay(date: Date): boolean {
    if (isWeekend(date)) {
      return false;
    }
    
    // Check if date matches any holiday
    const dateString = format(date, 'yyyy-MM-dd');
    return !this.holidays.some(holiday => 
      format(holiday, 'yyyy-MM-dd') === dateString
    );
  }
  
  // Add business days to a date (skipping weekends and holidays)
  static addBusinessDays(startDate: Date, daysToAdd: number): Date {
    let currentDate = new Date(startDate);
    let addedDays = 0;
    
    while (addedDays < daysToAdd) {
      currentDate = addDays(currentDate, 1);
      if (this.isWorkingDay(currentDate)) {
        addedDays++;
      }
    }
    
    return currentDate;
  }
  
  // Subtract business days from a date (skipping weekends and holidays)
  static subtractBusinessDays(startDate: Date, daysToSubtract: number): Date {
    let currentDate = new Date(startDate);
    let subtractedDays = 0;
    
    while (subtractedDays < daysToSubtract) {
      currentDate = subDays(currentDate, 1);
      if (this.isWorkingDay(currentDate)) {
        subtractedDays++;
      }
    }
    
    return currentDate;
  }
  
  // Get the previous working day
  static getPreviousWorkingDay(date: Date): Date {
    let currentDate = subDays(date, 1);
    while (!this.isWorkingDay(currentDate)) {
      currentDate = subDays(currentDate, 1);
    }
    return currentDate;
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
    
    // Calculate duration in business days
    const installDuration = Math.ceil(project.installHrs / shopHours);
    const stainDuration = Math.ceil(project.stainHrs / stainHours);
    const shopDuration = Math.ceil(project.shopHrs / shopHours);
    
    console.log('Project durations:', { installDuration, stainDuration, shopDuration });
    
    // Stain must complete before install (1 business day buffer)
    const stainEndDate = this.getPreviousWorkingDay(installDate);
    const stainStartDate = this.subtractBusinessDays(stainEndDate, stainDuration - 1);
    
    // Shop must complete before stain (1 business day buffer)
    const shopEndDate = this.getPreviousWorkingDay(stainStartDate);
    const shopStartDate = this.subtractBusinessDays(shopEndDate, shopDuration - 1);
    
    console.log('Calculated dates:', {
      shopStart: format(shopStartDate, 'yyyy-MM-dd'),
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
    
    return phases;
  }
}
