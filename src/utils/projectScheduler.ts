
import { addDays, isWeekend, format, parseISO } from 'date-fns';
import type { Project, ProjectPhase } from '../types/project';

export class ProjectScheduler {
  // Store holidays for business day calculations
  private static holidays: Set<string> = new Set();

  static setHolidays(holidayDates: string[]) {
    this.holidays = new Set(holidayDates);
    console.log('ProjectScheduler holidays set:', Array.from(this.holidays));
  }

  static isBusinessDay(date: Date): boolean {
    const dateString = format(date, 'yyyy-MM-dd');
    const isWeekendDay = isWeekend(date);
    const isHoliday = this.holidays.has(dateString);
    
    console.log(`Checking if ${dateString} is business day:`, {
      isWeekend: isWeekendDay,
      isHoliday: isHoliday,
      isBusinessDay: !isWeekendDay && !isHoliday
    });
    
    return !isWeekendDay && !isHoliday;
  }

  // Custom business days calculation that skips weekends AND holidays
  static addBusinessDays(startDate: Date, days: number): Date {
    let currentDate = new Date(startDate);
    let businessDaysAdded = 0;
    
    console.log(`Adding ${days} business days from ${format(startDate, 'yyyy-MM-dd')}`);
    
    while (businessDaysAdded < days) {
      currentDate = addDays(currentDate, 1);
      
      if (this.isBusinessDay(currentDate)) {
        businessDaysAdded++;
        console.log(`Business day ${businessDaysAdded}/${days}: ${format(currentDate, 'yyyy-MM-dd')}`);
      }
    }
    
    console.log(`Final date after adding ${days} business days: ${format(currentDate, 'yyyy-MM-dd')}`);
    return currentDate;
  }

  static subtractBusinessDays(startDate: Date, days: number): Date {
    let currentDate = new Date(startDate);
    let businessDaysSubtracted = 0;
    
    console.log(`Subtracting ${days} business days from ${format(startDate, 'yyyy-MM-dd')}`);
    
    while (businessDaysSubtracted < days) {
      currentDate = addDays(currentDate, -1);
      
      if (this.isBusinessDay(currentDate)) {
        businessDaysSubtracted++;
        console.log(`Business day ${businessDaysSubtracted}/${days}: ${format(currentDate, 'yyyy-MM-dd')}`);
      }
    }
    
    console.log(`Final date after subtracting ${days} business days: ${format(currentDate, 'yyyy-MM-dd')}`);
    return currentDate;
  }

  static calculateProjectDates(project: Project): Project {
    console.log('=== CALCULATING PROJECT DATES ===');
    console.log('Project:', project.jobName);
    console.log('Install date input:', project.installDate);
    console.log('Available holidays:', Array.from(this.holidays));
    
    // Parse install date as UTC
    const installDate = parseISO(project.installDate + 'T00:00:00Z');
    console.log('Install date (UTC):', format(installDate, 'yyyy-MM-dd'));
    
    // Validate that install date is a business day
    if (!this.isBusinessDay(installDate)) {
      console.warn(`WARNING: Install date ${format(installDate, 'yyyy-MM-dd')} is not a business day!`);
    }
    
    // Calculate all dates working backwards from install date in UTC
    const stainLacquerDate = this.subtractBusinessDays(installDate, 1);
    const stainStartDate = this.subtractBusinessDays(stainLacquerDate, Math.max(1, Math.ceil(project.stainHrs / 8)));
    const millingFillersDate = this.subtractBusinessDays(stainStartDate, 1);
    const boxToekickAssemblyDate = this.subtractBusinessDays(millingFillersDate, 1);
    const boxConstructionStartDate = this.subtractBusinessDays(boxToekickAssemblyDate, Math.max(1, Math.ceil(project.boxConstructionHrs / 8)));
    const millworkStartDate = this.subtractBusinessDays(boxConstructionStartDate, Math.max(1, Math.ceil(project.millworkHrs / 8)));
    const materialOrderDate = this.subtractBusinessDays(millworkStartDate, 10);

    const calculatedDates = {
      installDate: format(installDate, 'yyyy-MM-dd'),
      materialOrderDate: format(materialOrderDate, 'yyyy-MM-dd'),
      boxToekickAssemblyDate: format(boxToekickAssemblyDate, 'yyyy-MM-dd'),
      millingFillersDate: format(millingFillersDate, 'yyyy-MM-dd'),
      stainLacquerDate: format(stainLacquerDate, 'yyyy-MM-dd'),
      millworkStartDate: format(millworkStartDate, 'yyyy-MM-dd'),
      boxConstructionStartDate: format(boxConstructionStartDate, 'yyyy-MM-dd'),
      stainStartDate: format(stainStartDate, 'yyyy-MM-dd'),
    };

    console.log('Calculated dates:', calculatedDates);
    
    // Validate all calculated dates are business days
    Object.entries(calculatedDates).forEach(([phase, dateString]) => {
      const date = parseISO(dateString + 'T00:00:00Z');
      if (!this.isBusinessDay(date)) {
        console.error(`ERROR: ${phase} date ${dateString} is not a business day!`);
      }
    });
    
    console.log('=== END PROJECT CALCULATION ===');

    return {
      ...project,
      ...calculatedDates
    };
  }
}

export const getProjectPhases = async (projects: Project[]): Promise<ProjectPhase[]> => {
  const phases: ProjectPhase[] = [];

  projects.forEach((project) => {
    const addPhase = (
      phase: 'materialOrder' | 'millwork' | 'boxConstruction' | 'stain' | 'install', 
      dateString: string | null | undefined, 
      phaseHrs: number
    ) => {
      if (dateString) {
        console.log(`Adding phase ${phase} for project ${project.jobName} on date ${dateString} with ${phaseHrs} hours`);
        
        // Calculate end date - for single day phases, start and end are the same
        let endDate = dateString;
        if (phaseHrs > 8) {
          // Multi-day phase - calculate end date using business days
          const startDate = parseISO(dateString + 'T00:00:00Z');
          const durationDays = Math.max(1, Math.ceil(phaseHrs / 8));
          const calculatedEndDate = ProjectScheduler.addBusinessDays(startDate, durationDays - 1);
          endDate = format(calculatedEndDate, 'yyyy-MM-dd');
        }
        
        phases.push({
          id: `${project.id}-${phase}`,
          projectId: project.id,
          projectName: project.jobName,
          phase: phase,
          startDate: dateString,
          endDate: endDate,
          hours: phaseHrs,
          color: getPhaseColor(phase),
        });
      } else {
        console.log(`Skipping phase ${phase} for project ${project.jobName} - no date provided`);
      }
    };

    // Add phases with proper hours
    addPhase('materialOrder', project.materialOrderDate, 0);
    addPhase('millwork', project.millworkStartDate, project.millworkHrs);
    addPhase('boxConstruction', project.boxConstructionStartDate, project.boxConstructionHrs);
    addPhase('stain', project.stainStartDate, project.stainHrs);
    addPhase('install', project.installDate, project.installHrs);
  });

  console.log(`Generated ${phases.length} phases from ${projects.length} projects`);
  return phases;
};

function getPhaseColor(phase: 'materialOrder' | 'millwork' | 'boxConstruction' | 'stain' | 'install'): string {
  const colorMap = {
    materialOrder: '#ef4444',
    millwork: '#3b82f6',
    boxConstruction: '#10b981',
    stain: '#f97316',
    install: '#8b5cf6',
  };
  return colorMap[phase] || '#6b7280';
}
