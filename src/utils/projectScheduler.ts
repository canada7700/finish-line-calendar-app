
import { addBusinessDays, subBusinessDays, isWeekend, format, parseISO, addDays } from 'date-fns';
import { fromLocalToUTC, dateInputToUTC, createLocalDate } from './timezoneUtils';
import type { Project, ProjectPhase } from '../types/project';

export class ProjectScheduler {
  // Business days calculation that skips weekends
  static addBusinessDays(startDate: Date, days: number): Date {
    let currentDate = new Date(startDate);
    let businessDaysAdded = 0;
    
    while (businessDaysAdded < days) {
      currentDate = addDays(currentDate, 1);
      if (!isWeekend(currentDate)) {
        businessDaysAdded++;
      }
    }
    
    return currentDate;
  }

  static subtractBusinessDays(startDate: Date, days: number): Date {
    let currentDate = new Date(startDate);
    let businessDaysSubtracted = 0;
    
    while (businessDaysSubtracted < days) {
      currentDate = addDays(currentDate, -1);
      if (!isWeekend(currentDate)) {
        businessDaysSubtracted++;
      }
    }
    
    return currentDate;
  }

  static calculateProjectDates(project: Project): Project {
    // Parse install date as local date, then work backwards
    const installDateParts = project.installDate.split('-').map(Number);
    const installDate = createLocalDate(installDateParts[0], installDateParts[1] - 1, installDateParts[2]);
    
    // Calculate all dates working backwards from install date
    const stainLacquerDate = this.subtractBusinessDays(installDate, 1);
    const stainStartDate = this.subtractBusinessDays(stainLacquerDate, Math.max(1, Math.ceil(project.stainHrs / 8)));
    const millingFillersDate = this.subtractBusinessDays(stainStartDate, 1);
    const boxToekickAssemblyDate = this.subtractBusinessDays(millingFillersDate, 1);
    const boxConstructionStartDate = this.subtractBusinessDays(boxToekickAssemblyDate, Math.max(1, Math.ceil(project.boxConstructionHrs / 8)));
    const millworkStartDate = this.subtractBusinessDays(boxConstructionStartDate, Math.max(1, Math.ceil(project.millworkHrs / 8)));
    const materialOrderDate = this.subtractBusinessDays(millworkStartDate, 10);

    return {
      ...project,
      installDate: fromLocalToUTC(installDate),
      materialOrderDate: fromLocalToUTC(materialOrderDate),
      boxToekickAssemblyDate: fromLocalToUTC(boxToekickAssemblyDate),
      millingFillersDate: fromLocalToUTC(millingFillersDate),
      stainLacquerDate: fromLocalToUTC(stainLacquerDate),
      millworkStartDate: fromLocalToUTC(millworkStartDate),
      boxConstructionStartDate: fromLocalToUTC(boxConstructionStartDate),
      stainStartDate: fromLocalToUTC(stainStartDate),
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
          // Multi-day phase
          const startDate = parseISO(dateString);
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
