
import { Project, ProjectPhase } from '../types/project';
import { addDays, subDays, format } from 'date-fns';

export class ProjectScheduler {
  private static HOURS_PER_DAY = 8;
  
  static calculateProjectDates(project: Project): Project {
    const installDate = new Date(project.installDate);
    
    // Calculate backwards from install date
    const installDuration = Math.ceil(project.installHrs / this.HOURS_PER_DAY);
    const stainDuration = Math.ceil(project.stainHrs / this.HOURS_PER_DAY);
    const shopDuration = Math.ceil(project.shopHrs / this.HOURS_PER_DAY);
    
    // Stain must complete before install (1 day buffer)
    const stainEndDate = subDays(installDate, 2);
    const stainStartDate = subDays(stainEndDate, stainDuration - 1);
    
    // Shop must complete before stain (1 day buffer)
    const shopEndDate = subDays(stainStartDate, 2);
    const shopStartDate = subDays(shopEndDate, shopDuration - 1);
    
    return {
      ...project,
      shopStartDate: format(shopStartDate, 'yyyy-MM-dd'),
      stainStartDate: format(stainStartDate, 'yyyy-MM-dd'),
      stainLacquerDate: format(stainEndDate, 'yyyy-MM-dd'),
    };
  }
  
  static generateProjectPhases(project: Project): ProjectPhase[] {
    const phases: ProjectPhase[] = [];
    const calculatedProject = this.calculateProjectDates(project);
    
    if (calculatedProject.shopStartDate) {
      const shopDuration = Math.ceil(project.shopHrs / this.HOURS_PER_DAY);
      phases.push({
        id: `${project.id}-shop`,
        projectId: project.id,
        projectName: project.jobName,
        phase: 'shop',
        startDate: calculatedProject.shopStartDate,
        endDate: format(addDays(new Date(calculatedProject.shopStartDate), shopDuration - 1), 'yyyy-MM-dd'),
        hours: project.shopHrs,
        color: 'bg-blue-500'
      });
    }
    
    if (calculatedProject.stainStartDate) {
      const stainDuration = Math.ceil(project.stainHrs / this.HOURS_PER_DAY);
      phases.push({
        id: `${project.id}-stain`,
        projectId: project.id,
        projectName: project.jobName,
        phase: 'stain',
        startDate: calculatedProject.stainStartDate,
        endDate: format(addDays(new Date(calculatedProject.stainStartDate), stainDuration - 1), 'yyyy-MM-dd'),
        hours: project.stainHrs,
        color: 'bg-amber-500'
      });
    }
    
    const installDuration = Math.ceil(project.installHrs / this.HOURS_PER_DAY);
    phases.push({
      id: `${project.id}-install`,
      projectId: project.id,
      projectName: project.jobName,
      phase: 'install',
      startDate: project.installDate,
      endDate: format(addDays(new Date(project.installDate), installDuration - 1), 'yyyy-MM-dd'),
      hours: project.installHrs,
      color: 'bg-green-500'
    });
    
    return phases;
  }
}
