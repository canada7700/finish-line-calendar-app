
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ProjectScheduler } from '@/utils/projectScheduler';
import { Project, ProjectAssignment, TeamMember, DailyHourAllocation } from '@/types/project';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format, parseISO, eachDayOfInterval } from 'date-fns';

interface AutoScheduleParams {
  assignment: ProjectAssignment;
  project: Project;
  teamMembers: TeamMember[];
  existingAllocations: DailyHourAllocation[];
}

export const useAutoScheduleAssignments = () => {
  const queryClient = useQueryClient();

  const autoScheduleMutation = useMutation({
    mutationFn: async ({ assignment, project, teamMembers, existingAllocations }: AutoScheduleParams) => {
      console.log('🤖 Auto-scheduling assignment:', assignment);

      // Load holidays to ensure we have working days
      await ProjectScheduler.loadHolidays();

      // Get phase date range from project
      const phaseDates = getPhaseStartEndDates(project, assignment.phase);
      if (!phaseDates.startDate || !phaseDates.endDate) {
        throw new Error(`Unable to determine dates for phase: ${assignment.phase}`);
      }

      console.log(`📅 Phase ${assignment.phase} runs from ${phaseDates.startDate} to ${phaseDates.endDate}`);

      // Get all working days in the phase date range
      const startDate = parseISO(phaseDates.startDate);
      const endDate = parseISO(phaseDates.endDate);
      const workingDays = ProjectScheduler.getWorkingDaysInRange(startDate, endDate);

      console.log(`📊 Found ${workingDays.length} working days for scheduling`);

      // Get daily capacity for this phase
      const { data: capacities } = await supabase
        .from('daily_phase_capacities')
        .select('max_hours')
        .eq('phase', assignment.phase)
        .single();

      const dailyCapacity = capacities?.max_hours || 8;

      // Find available slots across all working days
      const availableSlots = await findAvailableSlots(
        assignment.teamMemberId,
        workingDays,
        dailyCapacity,
        existingAllocations,
        assignment.phase,
        project.id
      );

      console.log(`🎯 Found ${availableSlots.length} available hour slots`);

      if (availableSlots.length === 0) {
        throw new Error('No available time slots found for this team member during the phase dates');
      }

      // Distribute assigned hours across available slots
      const hoursToSchedule = Math.min(assignment.assignedHours, availableSlots.length);
      const slotsToBook = availableSlots.slice(0, hoursToSchedule);

      console.log(`⚡ Scheduling ${hoursToSchedule} hours across ${slotsToBook.length} slots`);

      // Create daily hour allocations
      const allocationsToCreate = slotsToBook.map(slot => ({
        project_id: project.id,
        team_member_id: assignment.teamMemberId,
        phase: assignment.phase,
        date: slot.date,
        hour_block: slot.hourBlock,
      }));

      // Batch insert all allocations
      const { error } = await supabase
        .from('daily_hour_allocations')
        .insert(allocationsToCreate);

      if (error) {
        console.error('❌ Error creating hour allocations:', error);
        throw error;
      }

      console.log(`✅ Successfully scheduled ${hoursToSchedule} hours`);

      return {
        scheduledHours: hoursToSchedule,
        totalHours: assignment.assignedHours,
        daysSpread: new Set(slotsToBook.map(s => s.date)).size,
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['daily-hour-allocations'] });
      
      const { scheduledHours, totalHours, daysSpread } = result;
      if (scheduledHours < totalHours) {
        toast({
          title: "Partially Scheduled",
          description: `Scheduled ${scheduledHours} of ${totalHours} hours across ${daysSpread} days. Some hours couldn't be scheduled due to capacity constraints.`,
          variant: "default",
        });
      } else {
        toast({
          title: "Auto-Scheduled Successfully",
          description: `Scheduled ${scheduledHours} hours across ${daysSpread} days on the calendar.`,
        });
      }
    },
    onError: (error: any) => {
      console.error('❌ Auto-scheduling failed:', error);
      toast({
        title: "Auto-Schedule Failed",
        description: error.message || "Could not automatically schedule hours. You can manually assign them in the calendar.",
        variant: "destructive",
      });
    },
  });

  return {
    autoSchedule: autoScheduleMutation.mutate,
    isAutoScheduling: autoScheduleMutation.isPending,
  };
};

// Helper function to get phase start/end dates from project
function getPhaseStartEndDates(project: Project, phase: string): { startDate: string | null; endDate: string | null } {
  switch (phase) {
    case 'millwork':
      return {
        startDate: project.millworkStartDate,
        endDate: project.millingFillersDate,
      };
    case 'boxConstruction':
      return {
        startDate: project.boxConstructionStartDate,
        endDate: project.boxToekickAssemblyDate,
      };
    case 'stain':
      return {
        startDate: project.stainStartDate,
        endDate: project.stainLacquerDate,
      };
    case 'install':
      return {
        startDate: project.installDate,
        endDate: project.installDate, // Install typically is one day, but we'll calculate end date
      };
    default:
      return { startDate: null, endDate: null };
  }
}

// Helper function to find available time slots for a team member
async function findAvailableSlots(
  teamMemberId: string,
  workingDays: Date[],
  dailyCapacity: number,
  existingAllocations: DailyHourAllocation[],
  phase: string,
  projectId: string
): Promise<{ date: string; hourBlock: number }[]> {
  const availableSlots: { date: string; hourBlock: number }[] = [];

  for (const day of workingDays) {
    const dateString = format(day, 'yyyy-MM-dd');
    
    // Get existing allocations for this team member on this day
    const dayAllocations = existingAllocations.filter(
      allocation => 
        allocation.teamMemberId === teamMemberId && 
        allocation.date === dateString
    );

    // Get existing allocations for this phase on this day (from all team members)
    const phaseAllocations = existingAllocations.filter(
      allocation => 
        allocation.phase === phase && 
        allocation.date === dateString
    );

    // Check if phase capacity is exceeded
    if (phaseAllocations.length >= dailyCapacity) {
      console.log(`⚠️ Phase ${phase} at capacity on ${dateString}`);
      continue;
    }

    // Find available hour blocks (0-23, but typically 8-17 for work hours)
    const occupiedHours = new Set(dayAllocations.map(a => a.hourBlock));
    
    // Focus on typical work hours (8 AM to 5 PM)
    for (let hour = 8; hour < 17; hour++) {
      if (!occupiedHours.has(hour) && phaseAllocations.length < dailyCapacity) {
        availableSlots.push({
          date: dateString,
          hourBlock: hour,
        });
      }
    }
  }

  return availableSlots;
}
