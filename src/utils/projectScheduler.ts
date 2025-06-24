import { Project, ProjectPhase } from '../types/project';
import { addDays, subDays, format, isWeekend, parseISO, eachDayOfInterval } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

export class ProjectScheduler {
  private static DEFAULT_HOURS_PER_DAY = 8;
  private static holidays: string[] = []; // Store as YYYY-MM-DD strings
  private static holidaysLoaded = false;
  
  // Load holidays from database
  static async loadHolidays() {
    if (this.holidaysLoaded) {
      console.log('✅ Holidays already loaded, skipping reload');
      return; // Already loaded, avoid duplicate requests
    }
    
    try {
      console.log('🔄 Loading holidays from database...');
      const { data, error } = await supabase
        .from('holidays')
        .select('date');
      
      if (error) {
        console.error('❌ Error loading holidays:', error);
        return;
      }
      
      // Store holidays as YYYY-MM-DD strings for consistent comparison
      this.holidays = data.map(h => h.date);
      this.holidaysLoaded = true;
      console.log('✅ Loaded holidays:', this.holidays);
    } catch (error) {
      console.error('❌ Failed to load holidays:', error);
    }
  }
  
  // Check if a date is a working day (not weekend, not holiday)
  static isWorkingDay(date: Date): boolean {
    const dateString = format(date, 'yyyy-MM-dd');
    
    // Check if it's a weekend
    if (isWeekend(date)) {
      console.log(`❌ ${dateString} is a weekend`);
      return false;
    }
    
    // Check if date matches any holiday (compare as YYYY-MM-DD strings)
    const isHoliday = this.holidays.includes(dateString);
    
    if (isHoliday) {
      console.log(`❌ ${dateString} is a holiday`);
      return false;
    }
    
    console.log(`✅ ${dateString} is a working day`);
    return true;
  }
  
  // Add business days to a date (skipping weekends and holidays)
  static addBusinessDays(startDate: Date, daysToAdd: number): Date {
    // Handle edge cases
    if (daysToAdd <= 0) {
      console.log(`⚠️ Invalid daysToAdd: ${daysToAdd}, returning original date`);
      return new Date(startDate);
    }
    
    let currentDate = new Date(startDate);
    let addedDays = 0;
    let iterations = 0;
    const maxIterations = Math.max(daysToAdd * 5, 50); // Ensure minimum safety valve
    
    console.log(`🔄 Adding ${daysToAdd} business days to ${format(startDate, 'yyyy-MM-dd')}`);
    
    while (addedDays < daysToAdd && iterations < maxIterations) {
      currentDate = addDays(currentDate, 1);
      iterations++;
      
      if (this.isWorkingDay(currentDate)) {
        addedDays++;
        console.log(`➕ Added business day ${addedDays}: ${format(currentDate, 'yyyy-MM-dd')}`);
      } else {
        console.log(`⏭️ Skipping non-working day: ${format(currentDate, 'yyyy-MM-dd')}`);
      }
    }
    
    if (iterations >= maxIterations) {
      console.error('⚠️ Reached maximum iterations while adding business days, returning fallback date');
      return addDays(startDate, daysToAdd); // Fallback to simple date addition
    }
    
    console.log(`✅ Final date after adding ${daysToAdd} business days: ${format(currentDate, 'yyyy-MM-dd')}`);
    return currentDate;
  }
  
  // Subtract business days from a date (skipping weekends and holidays)
  static subtractBusinessDays(startDate: Date, daysToSubtract: number): Date {
    // Handle edge cases
    if (daysToSubtract <= 0) {
      console.log(`⚠️ Invalid daysToSubtract: ${daysToSubtract}, returning original date`);
      return new Date(startDate);
    }
    
    let currentDate = new Date(startDate);
    let subtractedDays = 0;
    let iterations = 0;
    const maxIterations = Math.max(daysToSubtract * 5, 50); // Ensure minimum safety valve
    
    console.log(`🔄 Subtracting ${daysToSubtract} business days from ${format(startDate, 'yyyy-MM-dd')}`);
    
    while (subtractedDays < daysToSubtract && iterations < maxIterations) {
      currentDate = subDays(currentDate, 1);
      iterations++;
      
      if (this.isWorkingDay(currentDate)) {
        subtractedDays++;
        console.log(`➖ Subtracted business day ${subtractedDays}: ${format(currentDate, 'yyyy-MM-dd')}`);
      } else {
        console.log(`⏭️ Skipping non-working day: ${format(currentDate, 'yyyy-MM-dd')}`);
      }
    }
    
    if (iterations >= maxIterations) {
      console.error('⚠️ Reached maximum iterations while subtracting business days, returning fallback date');
      return subDays(startDate, daysToSubtract); // Fallback to simple date subtraction
    }
    
    console.log(`✅ Final date after subtracting ${daysToSubtract} business days: ${format(currentDate, 'yyyy-MM-dd')}`);
    return currentDate;
  }
  
  // Get the previous working day
  static getPreviousWorkingDay(date: Date): Date {
    let currentDate = subDays(date, 1);
    let iterations = 0;
    const maxIterations = 10; // Safety valve
    
    console.log(`🔄 Finding previous working day from ${format(date, 'yyyy-MM-dd')}`);
    
    while (!this.isWorkingDay(currentDate) && iterations < maxIterations) {
      currentDate = subDays(currentDate, 1);
      iterations++;
    }
    
    console.log(`✅ Previous working day from ${format(date, 'yyyy-MM-dd')} is ${format(currentDate, 'yyyy-MM-dd')}`);
    return currentDate;
  }
  
  // Get the next working day
  static getNextWorkingDay(date: Date): Date {
    let currentDate = addDays(date, 1);
    let iterations = 0;
    const maxIterations = 10; // Safety valve
    
    console.log(`🔄 Finding next working day from ${format(date, 'yyyy-MM-dd')}`);
    
    while (!this.isWorkingDay(currentDate) && iterations < maxIterations) {
      currentDate = addDays(currentDate, 1);
      iterations++;
    }
    
    console.log(`✅ Next working day from ${format(date, 'yyyy-MM-dd')} is ${format(currentDate, 'yyyy-MM-dd')}`);
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
  
  // Get working hours per day from settings AND phase capacities
  static async getWorkingHours(): Promise<{ 
    shopHours: number; 
    stainHours: number; 
    phaseCapacities: { [key: string]: number } 
  }> {
    try {
      // Load general settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', ['shop_hours_per_day', 'stain_hours_per_day']);
      
      if (settingsError) {
        console.error('Error loading working hours:', settingsError);
      }
      
      const shopHoursSetting = settingsData?.find(s => s.key === 'shop_hours_per_day');
      const stainHoursSetting = settingsData?.find(s => s.key === 'stain_hours_per_day');
      
      const shopHours = shopHoursSetting ? Number(shopHoursSetting.value) : this.DEFAULT_HOURS_PER_DAY;
      const stainHours = stainHoursSetting ? Number(stainHoursSetting.value) : 6;

      // Load phase-specific capacities
      const { data: capacitiesData, error: capacitiesError } = await supabase
        .from('daily_phase_capacities')
        .select('phase, max_hours');
      
      if (capacitiesError) {
        console.error('Error loading phase capacities:', capacitiesError);
      }

      // Create phase capacities map with fallbacks
      const phaseCapacities: { [key: string]: number } = {
        millwork: shopHours,
        boxConstruction: shopHours,
        stain: stainHours,
        install: shopHours
      };

      // Override with database values if available
      if (capacitiesData) {
        capacitiesData.forEach(capacity => {
          phaseCapacities[capacity.phase] = capacity.max_hours;
        });
      }
      
      console.log('Working hours and phase capacities loaded:', { shopHours, stainHours, phaseCapacities });
      return { shopHours, stainHours, phaseCapacities };
    } catch (error) {
      console.error('Failed to load working hours and capacities:', error);
      return { 
        shopHours: this.DEFAULT_HOURS_PER_DAY, 
        stainHours: 6,
        phaseCapacities: {
          millwork: this.DEFAULT_HOURS_PER_DAY,
          boxConstruction: this.DEFAULT_HOURS_PER_DAY,
          stain: 6,
          install: this.DEFAULT_HOURS_PER_DAY
        }
      };
    }
  }

  // Get all working days within a date range
  static getWorkingDaysInRange(startDate: Date, endDate: Date): Date[] {
    const allDays = eachDayOfInterval({ start: startDate, end: endDate });
    return allDays.filter(day => this.isWorkingDay(day));
  }

  // Calculate project dates from install end date (for when dragging last install day)
  static async calculateProjectDatesFromInstallEnd(project: Project, installEndDate: Date): Promise<Project> {
    console.log('🎯 Starting project date calculation from install end date for:', project.jobName);
    
    try {
      // Load holidays first - CRITICAL
      await this.loadHolidays();
      
      // Get working hours and phase capacities
      const { shopHours, stainHours, phaseCapacities } = await this.getWorkingHours();
      
      console.log('📅 Install end date:', format(installEndDate, 'yyyy-MM-dd'));
      
      // Validate install end date is a working day and adjust if needed
      let finalInstallEndDate = installEndDate;
      const installValidation = this.validateWorkingDay(installEndDate);
      if (!installValidation.isValid) {
        console.warn(`⚠️ Install end date ${format(installEndDate, 'yyyy-MM-dd')} is not a working day. Adjusting to ${format(installValidation.suggestedDate!, 'yyyy-MM-dd')}`);
        finalInstallEndDate = installValidation.suggestedDate!;
      }

      // Calculate install start date from end date
      const installDuration = Math.max(1, Math.ceil(project.installHrs / phaseCapacities.install));
      const installStartDate = this.subtractBusinessDays(finalInstallEndDate, installDuration - 1);

      console.log(`📊 Install duration: ${installDuration} days, from ${format(installStartDate, 'yyyy-MM-dd')} to ${format(finalInstallEndDate, 'yyyy-MM-dd')}`);

      // Calculate other phase durations with safety checks
      const stainDuration = Math.max(1, Math.ceil(project.stainHrs / phaseCapacities.stain));
      const millworkDuration = Math.max(1, Math.ceil(project.millworkHrs / phaseCapacities.millwork));
      const boxConstructionDuration = Math.max(1, Math.ceil(project.boxConstructionHrs / phaseCapacities.boxConstruction));
      
      console.log('📊 Project durations in business days (using phase capacities):', { 
        installDuration, 
        stainDuration, 
        millworkDuration, 
        boxConstructionDuration,
        phaseCapacities 
      });
      
      // Stain must complete before install (1 business day buffer)
      const stainEndDate = this.getPreviousWorkingDay(installStartDate);
      const stainStartDate = this.subtractBusinessDays(stainEndDate, stainDuration - 1);
      
      // Box construction must complete before stain (1 business day buffer)
      const boxConstructionEndDate = this.getPreviousWorkingDay(stainStartDate);
      const boxConstructionStartDate = this.subtractBusinessDays(boxConstructionEndDate, boxConstructionDuration - 1);
      
      // Millwork must complete before box construction (1 business day buffer)
      const millworkEndDate = this.getPreviousWorkingDay(boxConstructionStartDate);
      const millworkStartDate = this.subtractBusinessDays(millworkEndDate, millworkDuration - 1);

      // Material order date is 60 calendar days before install start
      let materialOrderDate = subDays(installStartDate, 60);
      
      // Ensure material order date is on a working day - move to previous working day if needed
      if (!this.isWorkingDay(materialOrderDate)) {
        const originalMaterialOrderDate = format(materialOrderDate, 'yyyy-MM-dd');
        materialOrderDate = this.getPreviousWorkingDay(materialOrderDate);
        console.log(`📦 Material order date ${originalMaterialOrderDate} adjusted to previous working day: ${format(materialOrderDate, 'yyyy-MM-dd')}`);
      } else {
        console.log(`📦 Material order date ${format(materialOrderDate, 'yyyy-MM-dd')} is already a working day`);
      }

      const calculatedDates = {
        millworkStart: format(millworkStartDate, 'yyyy-MM-dd'),
        millworkEnd: format(millworkEndDate, 'yyyy-MM-dd'),
        boxConstructionStart: format(boxConstructionStartDate, 'yyyy-MM-dd'),
        boxConstructionEnd: format(boxConstructionEndDate, 'yyyy-MM-dd'),
        stainStart: format(stainStartDate, 'yyyy-MM-dd'),
        stainEnd: format(stainEndDate, 'yyyy-MM-dd'),
        installStart: format(installStartDate, 'yyyy-MM-dd'),
        materialOrder: format(materialOrderDate, 'yyyy-MM-dd'),
      };
      
      console.log('✅ Calculated project dates from install end:', calculatedDates);
      
      return {
        ...project,
        installDate: calculatedDates.installStart,
        materialOrderDate: calculatedDates.materialOrder,
        millworkStartDate: calculatedDates.millworkStart,
        boxConstructionStartDate: calculatedDates.boxConstructionStart,
        stainStartDate: calculatedDates.stainStart,
        stainLacquerDate: calculatedDates.stainEnd,
        millingFillersDate: calculatedDates.millworkEnd,
        boxToekickAssemblyDate: calculatedDates.boxConstructionEnd,
      };
    } catch (error) {
      console.error('❌ Error calculating project dates from install end:', error);
      // Return original project with minimal changes if calculation fails
      return project;
    }
  }
  
  static async calculateProjectDates(project: Project): Promise<Project> {
    console.log('🎯 Starting project date calculation for:', project.jobName);
    
    try {
      // Load holidays first - CRITICAL
      await this.loadHolidays();
      
      // Get working hours and phase capacities
      const { shopHours, stainHours, phaseCapacities } = await this.getWorkingHours();
      
      // By appending 'T00:00:00', we parse the date in the local timezone, not UTC.
      const installDate = new Date(`${project.installDate}T00:00:00`);
      console.log('📅 Original install date:', format(installDate, 'yyyy-MM-dd'));
      
      // Validate install date is a working day and adjust if needed
      let finalInstallDate = installDate;
      const installValidation = this.validateWorkingDay(installDate);
      if (!installValidation.isValid) {
        console.warn(`⚠️ Install date ${project.installDate} is not a working day. Adjusting to ${format(installValidation.suggestedDate!, 'yyyy-MM-dd')}`);
        finalInstallDate = installValidation.suggestedDate!;
      }
      
      // Material order date is 60 calendar days before install
      let materialOrderDate = subDays(finalInstallDate, 60);
      
      // Ensure material order date is on a working day - move to previous working day if needed
      if (!this.isWorkingDay(materialOrderDate)) {
        const originalMaterialOrderDate = format(materialOrderDate, 'yyyy-MM-dd');
        materialOrderDate = this.getPreviousWorkingDay(materialOrderDate);
        console.log(`📦 Material order date ${originalMaterialOrderDate} adjusted to previous working day: ${format(materialOrderDate, 'yyyy-MM-dd')}`);
      } else {
        console.log(`📦 Material order date ${format(materialOrderDate, 'yyyy-MM-dd')} is already a working day`);
      }

      // Calculate duration in business days using phase-specific capacities with safety checks
      const installDuration = Math.max(1, Math.ceil(project.installHrs / phaseCapacities.install));
      const stainDuration = Math.max(1, Math.ceil(project.stainHrs / phaseCapacities.stain));
      const millworkDuration = Math.max(1, Math.ceil(project.millworkHrs / phaseCapacities.millwork));
      const boxConstructionDuration = Math.max(1, Math.ceil(project.boxConstructionHrs / phaseCapacities.boxConstruction));
      
      console.log('📊 Project durations in business days (using phase capacities):', { 
        installDuration, 
        stainDuration, 
        millworkDuration, 
        boxConstructionDuration,
        phaseCapacities 
      });
      
      // Stain must complete before install (1 business day buffer)
      const stainEndDate = this.getPreviousWorkingDay(finalInstallDate);
      const stainStartDate = this.subtractBusinessDays(stainEndDate, stainDuration - 1);
      
      // Box construction must complete before stain (1 business day buffer)
      const boxConstructionEndDate = this.getPreviousWorkingDay(stainStartDate);
      const boxConstructionStartDate = this.subtractBusinessDays(boxConstructionEndDate, boxConstructionDuration - 1);
      
      // Millwork must complete before box construction (1 business day buffer)
      const millworkEndDate = this.getPreviousWorkingDay(boxConstructionStartDate);
      const millworkStartDate = this.subtractBusinessDays(millworkEndDate, millworkDuration - 1);

      const calculatedDates = {
        millworkStart: format(millworkStartDate, 'yyyy-MM-dd'),
        millworkEnd: format(millworkEndDate, 'yyyy-MM-dd'),
        boxConstructionStart: format(boxConstructionStartDate, 'yyyy-MM-dd'),
        boxConstructionEnd: format(boxConstructionEndDate, 'yyyy-MM-dd'),
        stainStart: format(stainStartDate, 'yyyy-MM-dd'),
        stainEnd: format(stainEndDate, 'yyyy-MM-dd'),
        install: format(finalInstallDate, 'yyyy-MM-dd'),
        materialOrder: format(materialOrderDate, 'yyyy-MM-dd'),
      };
      
      console.log('✅ Calculated project dates:', calculatedDates);
      
      return {
        ...project,
        installDate: calculatedDates.install, // Update install date if it was adjusted
        materialOrderDate: calculatedDates.materialOrder,
        millworkStartDate: calculatedDates.millworkStart,
        boxConstructionStartDate: calculatedDates.boxConstructionStart,
        stainStartDate: calculatedDates.stainStart,
        stainLacquerDate: calculatedDates.stainEnd,
        millingFillersDate: calculatedDates.millworkEnd,
        boxToekickAssemblyDate: calculatedDates.boxConstructionEnd,
      };
    } catch (error) {
      console.error('❌ Error calculating project dates:', error);
      // Return original project with minimal changes if calculation fails
      return project;
    }
  }
  
  static async generateProjectPhases(project: Project): Promise<ProjectPhase[]> {
    console.log('🎭 Generating project phases for:', project.jobName);
    
    try {
      // Ensure holidays are loaded FIRST - CRITICAL
      await this.loadHolidays();
      
      const phases: ProjectPhase[] = [];
      const calculatedProject = await this.calculateProjectDates(project);
      const { shopHours, stainHours, phaseCapacities } = await this.getWorkingHours();
      
      // Material Order phase
      if (calculatedProject.materialOrderDate) {
        phases.push({
          id: `${project.id}-material-order`,
          projectId: project.id,
          projectName: `${project.jobName} Material Order Date`,
          phase: 'materialOrder',
          startDate: calculatedProject.materialOrderDate,
          endDate: calculatedProject.materialOrderDate,
          hours: 0,
          color: 'bg-red-600',
        });
        console.log(`✅ Created material order phase for ${calculatedProject.materialOrderDate}`);
      }

      // Millwork phase - create individual phases for each working day
      if (calculatedProject.millworkStartDate) {
        const millworkStartDate = new Date(`${calculatedProject.millworkStartDate}T00:00:00`);
        const millworkDuration = Math.max(1, Math.ceil(project.millworkHrs / phaseCapacities.millwork));
        
        console.log(`🔨 Generating millwork phases for ${millworkDuration} working days starting ${format(millworkStartDate, 'yyyy-MM-dd')}`);
        
        let currentDate = new Date(millworkStartDate);
        
        for (let day = 0; day < millworkDuration; day++) {
          while (!this.isWorkingDay(currentDate)) {
            currentDate = addDays(currentDate, 1);
          }
          
          phases.push({
            id: `${project.id}-millwork-${day}`,
            projectId: project.id,
            projectName: project.jobName,
            phase: 'millwork',
            startDate: format(currentDate, 'yyyy-MM-dd'),
            endDate: format(currentDate, 'yyyy-MM-dd'),
            hours: phaseCapacities.millwork, // Use actual daily capacity
            color: 'bg-purple-500'
          });
          
          console.log(`✅ Created millwork phase for ${format(currentDate, 'yyyy-MM-dd')} with ${phaseCapacities.millwork}h capacity`);
          currentDate = this.getNextWorkingDay(currentDate);
        }
      }

      // Box Construction phase - create individual phases for each working day
      if (calculatedProject.boxConstructionStartDate) {
        const boxConstructionStartDate = new Date(`${calculatedProject.boxConstructionStartDate}T00:00:00`);
        const boxConstructionDuration = Math.max(1, Math.ceil(project.boxConstructionHrs / phaseCapacities.boxConstruction));
        
        console.log(`🔨 Generating box construction phases for ${boxConstructionDuration} working days starting ${format(boxConstructionStartDate, 'yyyy-MM-dd')}`);
        
        let currentDate = new Date(boxConstructionStartDate);
        
        for (let day = 0; day < boxConstructionDuration; day++) {
          while (!this.isWorkingDay(currentDate)) {
            currentDate = addDays(currentDate, 1);
          }
          
          phases.push({
            id: `${project.id}-box-${day}`,
            projectId: project.id,
            projectName: project.jobName,
            phase: 'boxConstruction',
            startDate: format(currentDate, 'yyyy-MM-dd'),
            endDate: format(currentDate, 'yyyy-MM-dd'),
            hours: phaseCapacities.boxConstruction, // Use actual daily capacity
            color: 'bg-blue-500'
          });
          
          console.log(`✅ Created box construction phase for ${format(currentDate, 'yyyy-MM-dd')} with ${phaseCapacities.boxConstruction}h capacity`);
          currentDate = this.getNextWorkingDay(currentDate);
        }
      }
      
      // Stain phase - create individual phases for each working day
      if (calculatedProject.stainStartDate) {
        const stainStartDate = new Date(`${calculatedProject.stainStartDate}T00:00:00`);
        const stainDuration = Math.max(1, Math.ceil(project.stainHrs / phaseCapacities.stain));
        
        console.log(`🎨 Generating stain phases for ${stainDuration} working days starting ${format(stainStartDate, 'yyyy-MM-dd')}`);
        
        let currentDate = new Date(stainStartDate);
        
        for (let day = 0; day < stainDuration; day++) {
          while (!this.isWorkingDay(currentDate)) {
            currentDate = addDays(currentDate, 1);
          }
          
          phases.push({
            id: `${project.id}-stain-${day}`,
            projectId: project.id,
            projectName: project.jobName,
            phase: 'stain',
            startDate: format(currentDate, 'yyyy-MM-dd'),
            endDate: format(currentDate, 'yyyy-MM-dd'),
            hours: phaseCapacities.stain, // Use actual daily capacity
            color: 'bg-amber-500'
          });
          
          console.log(`✅ Created stain phase for ${format(currentDate, 'yyyy-MM-dd')} with ${phaseCapacities.stain}h capacity`);
          currentDate = this.getNextWorkingDay(currentDate);
        }
      }
      
      // Install phase - create individual phases for each working day
      const installStartDate = new Date(`${calculatedProject.installDate}T00:00:00`);
      const installDuration = Math.max(1, Math.ceil(project.installHrs / phaseCapacities.install));
      
      console.log(`🔧 Generating install phases for ${installDuration} working days starting ${format(installStartDate, 'yyyy-MM-dd')}`);
      
      let currentDate = new Date(installStartDate);
      
      for (let day = 0; day < installDuration; day++) {
        while (!this.isWorkingDay(currentDate)) {
          currentDate = addDays(currentDate, 1);
        }
        
        phases.push({
          id: `${project.id}-install-${day}`,
          projectId: project.id,
          projectName: project.jobName,
          phase: 'install',
          startDate: format(currentDate, 'yyyy-MM-dd'),
          endDate: format(currentDate, 'yyyy-MM-dd'),
          hours: phaseCapacities.install, // Use actual daily capacity
          color: 'bg-green-500'
        });
        
        console.log(`✅ Created install phase for ${format(currentDate, 'yyyy-MM-dd')} with ${phaseCapacities.install}h capacity`);
        currentDate = this.getNextWorkingDay(currentDate);
      }
      
      console.log(`✅ Generated ${phases.length} project phases (working days only)`);
      return phases;
    } catch (error) {
      console.error('❌ Error generating project phases:', error);
      return []; // Return empty array on error to prevent crashes
    }
  }
  
  // Force refresh holidays (useful for debugging)
  static forceReloadHolidays() {
    console.log('🔄 Forcing holiday reload...');
    this.holidaysLoaded = false;
    this.holidays = [];
    return this.loadHolidays();
  }
  
  // Get current holidays (for debugging)
  static getCurrentHolidays() {
    return {
      holidays: this.holidays,
      loaded: this.holidaysLoaded
    };
  }
}

// New function to generate phases for all projects
export const getProjectPhases = async (projects: Project[]): Promise<ProjectPhase[]> => {
  console.log('🎭 Generating phases for all projects...');
  await ProjectScheduler.loadHolidays(); // Ensure holidays are loaded

  let allPhases: ProjectPhase[] = [];
  for (const project of projects) {
    // Since generateProjectPhases is async, we need to await it.
    const projectPhases = await ProjectScheduler.generateProjectPhases(project);
    allPhases = allPhases.concat(projectPhases);
  }

  console.log(`✅ Generated a total of ${allPhases.length} phases for ${projects.length} projects.`);
  return allPhases;
};
