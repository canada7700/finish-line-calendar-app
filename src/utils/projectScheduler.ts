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
    const addPhase = (phase: string, date: string | null | undefined, duration: number, phaseHrs: number) => {
      if (date) {
        phases.push({
          id: `${project.id}-${phase}`,
          projectId: project.id,
          projectName: project.jobName,
          phase: phase,
          startDate: date,
          endDate: ProjectScheduler.addBusinessDays(parseISO(date), Math.max(1, Math.ceil(phaseHrs / 8))).toISOString().split('T')[0],
        });
      }
    };

    addPhase('materialOrder', project.materialOrderDate, 1, 0);
    addPhase('millwork', project.millworkStartDate, project.millworkHrs / 8, project.millworkHrs);
    addPhase('boxConstruction', project.boxConstructionStartDate, project.boxConstructionHrs / 8, project.boxConstructionHrs);
    addPhase('stain', project.stainStartDate, project.stainHrs / 8, project.stainHrs);
    addPhase('install', project.installDate, project.installHrs / 8, project.installHrs);
  });

  return phases;
};
