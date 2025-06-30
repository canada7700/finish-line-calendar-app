
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Project, DailyPhaseCapacity, DailyPhaseAllocation } from '@/types/project';
import { toast } from '@/hooks/use-toast';
import { format, parseISO, eachDayOfInterval, isWeekend } from 'date-fns';
import { ProjectScheduler } from '@/utils/projectScheduler';
import { useCreateUnscheduledHours } from './useUnscheduledHours';

interface ScheduleProjectParams {
  project: Project;
  capacities: DailyPhaseCapacity[];
  existingAllocations: DailyPhaseAllocation[];
}

export const useCapacityScheduler = () => {
  const queryClient = useQueryClient();
  const { mutateAsync: createUnscheduledHours } = useCreateUnscheduledHours();

  const scheduleProjectMutation = useMutation({
    mutationFn: async ({ project, capacities, existingAllocations }: ScheduleProjectParams) => {
      console.log('🤖 Auto-scheduling project with capacity-based system:', project.jobName);

      // Load holidays to ensure we have working days
      await ProjectScheduler.loadHolidays();

      const phases = [
        { phase: 'millwork', hours: project.millworkHrs, startDate: project.millworkStartDate, endDate: project.millingFillersDate },
        { phase: 'boxConstruction', hours: project.boxConstructionHrs, startDate: project.boxConstructionStartDate, endDate: project.boxToekickAssemblyDate },
        { phase: 'stain', hours: project.stainHrs, startDate: project.stainStartDate, endDate: project.stainLacquerDate },
        { phase: 'install', hours: project.installHrs, startDate: project.installDate, endDate: project.installDate },
      ];

      const allocationsToCreate: any[] = [];
      let totalScheduled = 0;
      let totalUnscheduled = 0;

      for (const phaseData of phases) {
        if (!phaseData.startDate || !phaseData.endDate || phaseData.hours === 0) {
          continue;
        }

        const phaseCapacity = capacities.find(c => c.phase === phaseData.phase);
        if (!phaseCapacity) continue;

        const startDate = parseISO(phaseData.startDate);
        const endDate = parseISO(phaseData.endDate);
        
        // Get all working days in the phase date range
        const allDays = eachDayOfInterval({ start: startDate, end: endDate });
        const workingDays = allDays.filter(day => 
          !isWeekend(day) && !ProjectScheduler.isHoliday(day)
        );

        console.log(`📅 Phase ${phaseData.phase}: ${workingDays.length} working days available`);

        let remainingHours = phaseData.hours;
        const maxHoursPerDay = Math.floor(phaseCapacity.maxHours * 0.5); // 50% cap per job

        for (const day of workingDays) {
          if (remainingHours <= 0) break;

          const dateString = format(day, 'yyyy-MM-dd');
          
          // Get existing allocations for this phase on this day
          const dayAllocations = existingAllocations.filter(
            allocation => allocation.phase === phaseData.phase && allocation.date === dateString
          );

          const allocatedHours = dayAllocations.reduce((sum, alloc) => sum + alloc.allocatedHours, 0);
          const availableCapacity = Math.min(
            phaseCapacity.maxHours - allocatedHours, // Remaining daily capacity
            maxHoursPerDay // 50% job limit
          );

          if (availableCapacity > 0) {
            const hoursToSchedule = Math.min(remainingHours, availableCapacity);
            
            allocationsToCreate.push({
              project_id: project.id,
              phase: phaseData.phase,
              date: dateString,
              allocated_hours: hoursToSchedule,
            });

            remainingHours -= hoursToSchedule;
            totalScheduled += hoursToSchedule;
            
            console.log(`⚡ Scheduled ${hoursToSchedule}h for ${phaseData.phase} on ${dateString}`);
          }
        }

        // Track unscheduled hours
        if (remainingHours > 0) {
          await createUnscheduledHours({
            projectId: project.id,
            phase: phaseData.phase as 'millwork' | 'boxConstruction' | 'stain' | 'install',
            hours: remainingHours,
            reason: `Insufficient capacity in date range ${phaseData.startDate} to ${phaseData.endDate}`,
          });
          totalUnscheduled += remainingHours;
          console.log(`⚠️ Could not schedule ${remainingHours}h for ${phaseData.phase}`);
        }
      }

      // Batch insert all allocations
      if (allocationsToCreate.length > 0) {
        const { error } = await supabase
          .from('daily_phase_allocations')
          .insert(allocationsToCreate);

        if (error) {
          console.error('❌ Error creating phase allocations:', error);
          throw error;
        }
      }

      console.log(`✅ Scheduling complete: ${totalScheduled}h scheduled, ${totalUnscheduled}h unscheduled`);

      return {
        scheduledHours: totalScheduled,
        unscheduledHours: totalUnscheduled,
        allocationsCreated: allocationsToCreate.length,
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['daily-phase-allocations'] });
      queryClient.invalidateQueries({ queryKey: ['unscheduled-hours'] });
      
      const { scheduledHours, unscheduledHours } = result;
      if (unscheduledHours > 0) {
        toast({
          title: "Partially Scheduled",
          description: `Scheduled ${scheduledHours} hours. ${unscheduledHours} hours couldn't be scheduled due to capacity constraints.`,
          variant: "default",
        });
      } else {
        toast({
          title: "Project Scheduled",
          description: `Successfully scheduled all ${scheduledHours} hours across the calendar.`,
        });
      }
    },
    onError: (error: any) => {
      console.error('❌ Auto-scheduling failed:', error);
      toast({
        title: "Scheduling Failed",
        description: error.message || "Could not automatically schedule project hours.",
        variant: "destructive",
      });
    },
  });

  return {
    scheduleProject: scheduleProjectMutation.mutate,
    isScheduling: scheduleProjectMutation.isPending,
  };
};
