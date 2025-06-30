
import { addDays, isWeekend, format, parseISO, subDays } from 'date-fns';
import { Project, ProjectPhase } from '../types/project';

export class ProjectScheduler {
  private static holidays: Set<string> = new Set();
  private static holidaysLoaded: boolean = false;

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
    this.holidaysLoaded = true;
  }

  static async forceReloadHolidays() {
    this.holidaysLoaded = false;
    await this.loadHolidays();
  }

  static getCurrentHolidays() {
    return {
      loaded: this.holidaysLoaded,
      holidays: Array.from(this.holidays)
    };
  }

  static isHoliday(date: Date): boolean {
    const dateString = format(date, 'yyyy-MM-dd');
    return this.holidays.has(dateString);
  }

  static isWorkingDay(date: Date): boolean {
    return !isWeekend(date) && !this.isHoliday(date);
  }

  static validateWorkingDay(date: Date): boolean {
    return this.isWorkingDay(date);
  }

  static async calculateProjectDates(project: Project): Promise<Project> {
    await this.loadHolidays();
    
    const installDate = parseISO(project.installDate);
    let currentDate = new Date(installDate);

    // Calculate backwards from install date
    const phases = [
      { phase: 'install', hours: project.installHrs, key: 'installDate' },
      { phase: 'stain', hours: project.stainHrs, startKey: 'stainStartDate', endKey: 'stainLacquerDate' },
      { phase: 'boxConstruction', hours: project.boxConstructionHrs, startKey: 'boxConstructionStartDate', endKey: 'boxToekickAssemblyDate' },
      { phase: 'millwork', hours: project.millworkHrs, startKey: 'millworkStartDate', endKey: 'millingFillersDate' }
    ];

    const calculatedProject = { ...project };

    for (const phase of phases) {
      if (phase.hours > 0) {
        const daysNeeded = Math.ceil(phase.hours / 8); // Assume 8 hours per day
        
        // Find working days
        let workingDaysFound = 0;
        let endDate = new Date(currentDate);
        
        while (workingDaysFound < daysNeeded) {
          currentDate = subDays(currentDate, 1);
          if (this.isWorkingDay(currentDate)) {
            workingDaysFound++;
          }
        }
        
        const startDate = new Date(currentDate);
        
        if (phase.startKey && phase.endKey) {
          (calculatedProject as any)[phase.startKey] = format(startDate, 'yyyy-MM-dd');
          (calculatedProject as any)[phase.endKey] = format(endDate, 'yyyy-MM-dd');
        }
      }
    }

    return calculatedProject;
  }

  static async calculateProjectDatesFromInstallEnd(project: Project): Promise<Project> {
    return this.calculateProjectDates(project);
  }

  static async generateProjectPhases(project: Project): Promise<ProjectPhase[]> {
    const phases: ProjectPhase[] = [];
    
    const phaseConfigs = [
      { phase: 'millwork', hours: project.millworkHrs, startDate: project.millworkStartDate, endDate: project.millingFillersDate, color: 'bg-purple-500' },
      { phase: 'boxConstruction', hours: project.boxConstructionHrs, startDate: project.boxConstructionStartDate, endDate: project.boxToekickAssemblyDate, color: 'bg-blue-500' },
      { phase: 'stain', hours: project.stainHrs, startDate: project.stainStartDate, endDate: project.stainLacquerDate, color: 'bg-amber-500' },
      { phase: 'install', hours: project.installHrs, startDate: project.installDate, endDate: project.installDate, color: 'bg-green-500' }
    ];

    phaseConfigs.forEach(config => {
      if (config.hours > 0 && config.startDate && config.endDate) {
        phases.push({
          id: `${project.id}-${config.phase}`,
          projectId: project.id,
          projectName: project.jobName,
          phase: config.phase as 'materialOrder' | 'millwork' | 'boxConstruction' | 'stain' | 'install',
          startDate: config.startDate,
          endDate: config.endDate,
          hours: config.hours,
          color: config.color
        });
      }
    });

    return phases;
  }
}
