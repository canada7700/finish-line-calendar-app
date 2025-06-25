
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProjectAssignment } from '../types/project';
import { toast } from '@/hooks/use-toast';
import { useAutoScheduleAssignments } from './useAutoScheduleAssignments';
import { useClearAutoScheduledHours } from './useClearAutoScheduledHours';

export const useAddProjectAssignment = () => {
  const queryClient = useQueryClient();
  const { autoSchedule } = useAutoScheduleAssignments();

  return useMutation({
    mutationFn: async (assignmentData: Omit<ProjectAssignment, 'id' | 'createdAt' | 'updatedAt' | 'actualHours' | 'teamMember' | 'project'>) => {
      const { data, error } = await supabase
        .from('project_assignments')
        .insert({
          project_id: assignmentData.projectId,
          team_member_id: assignmentData.teamMemberId,
          phase: assignmentData.phase,
          assigned_hours: assignmentData.assignedHours,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['project-assignments', data.project_id] });
      
      toast({
        title: "Assignment Added",
        description: "Project assignment has been added successfully.",
      });

      // Auto-schedule hours if assignedHours > 0
      if (data.assigned_hours > 0) {
        try {
          // Get necessary data for auto-scheduling
          const [projectResponse, teamMembersResponse, allocationsResponse] = await Promise.all([
            supabase.from('projects').select('*').eq('id', data.project_id).single(),
            supabase.from('team_members').select('*'),
            supabase.from('daily_hour_allocations').select('*')
          ]);

          if (projectResponse.data && teamMembersResponse.data && allocationsResponse.data) {
            const assignment: ProjectAssignment = {
              id: data.id,
              projectId: data.project_id,
              teamMemberId: data.team_member_id,
              phase: data.phase,
              assignedHours: data.assigned_hours,
              actualHours: data.actual_hours,
              startDate: data.start_date,
              endDate: data.end_date,
              createdAt: data.created_at,
              updatedAt: data.updated_at,
            };

            const allocations = allocationsResponse.data.map((d: any) => ({
              id: d.id,
              projectId: d.project_id,
              teamMemberId: d.team_member_id,
              phase: d.phase,
              date: d.date,
              hourBlock: d.hour_block,
              createdAt: d.created_at,
              updatedAt: d.updated_at,
            }));

            autoSchedule({
              assignment,
              project: {
                id: projectResponse.data.id,
                jobName: projectResponse.data.job_name,
                jobDescription: projectResponse.data.job_description,
                status: projectResponse.data.status,
                installDate: projectResponse.data.install_date,
                materialOrderDate: projectResponse.data.material_order_date,
                millworkHrs: projectResponse.data.millwork_hrs,
                boxConstructionHrs: projectResponse.data.box_construction_hrs,
                stainHrs: projectResponse.data.stain_hrs,
                installHrs: projectResponse.data.install_hrs,
                millworkStartDate: projectResponse.data.millwork_start_date,
                boxConstructionStartDate: projectResponse.data.box_construction_start_date,
                stainStartDate: projectResponse.data.stain_start_date,
                stainLacquerDate: projectResponse.data.stain_lacquer_date,
                millingFillersDate: projectResponse.data.milling_fillers_date,
                boxToekickAssemblyDate: projectResponse.data.box_toekick_assembly_date,
                createdAt: projectResponse.data.created_at,
                updatedAt: projectResponse.data.updated_at,
              },
              teamMembers: teamMembersResponse.data.map((tm: any) => ({
                id: tm.id,
                name: tm.name,
                email: tm.email,
                weeklyHours: tm.weekly_hours,
                hourlyRate: tm.hourly_rate,
                canDoMillwork: tm.can_do_millwork,
                canDoBoxes: tm.can_do_boxes,
                canDoStain: tm.can_do_stain,
                canDoInstall: tm.can_do_install,
                isActive: tm.is_active,
                createdAt: tm.created_at,
                updatedAt: tm.updated_at,
              })),
              existingAllocations: allocations,
            });
          }
        } catch (error) {
          console.error('Auto-scheduling failed:', error);
          // Don't show error toast here as the assignment was successful
        }
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add project assignment: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateProjectAssignment = () => {
  const queryClient = useQueryClient();
  const { autoSchedule } = useAutoScheduleAssignments();
  const { clearHours } = useClearAutoScheduledHours();

  return useMutation({
    mutationFn: async (assignmentData: Partial<ProjectAssignment> & { id: string }) => {
      const { id, ...updateData } = assignmentData;
      const { data, error } = await supabase
        .from('project_assignments')
        .update({
          assigned_hours: updateData.assignedHours,
          actual_hours: updateData.actualHours,
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['project-assignments', data.project_id] });
      
      toast({
        title: "Assignment Updated",
        description: "Project assignment has been updated successfully.",
      });

      // Handle auto-scheduling for hour changes
      if (data.assigned_hours !== undefined) {
        try {
          // First clear existing auto-scheduled hours for this assignment
          clearHours({
            projectId: data.project_id,
            teamMemberId: data.team_member_id,
            phase: data.phase,
          });

          // Then auto-schedule new hours if assignedHours > 0
          if (data.assigned_hours > 0) {
            // Get necessary data for auto-scheduling (similar to add mutation)
            const [projectResponse, teamMembersResponse, allocationsResponse] = await Promise.all([
              supabase.from('projects').select('*').eq('id', data.project_id).single(),
              supabase.from('team_members').select('*'),
              supabase.from('daily_hour_allocations').select('*')
            ]);

            if (projectResponse.data && teamMembersResponse.data && allocationsResponse.data) {
              const assignment: ProjectAssignment = {
                id: data.id,
                projectId: data.project_id,
                teamMemberId: data.team_member_id,
                phase: data.phase,
                assignedHours: data.assigned_hours,
                actualHours: data.actual_hours,
                startDate: data.start_date,
                endDate: data.end_date,
                createdAt: data.created_at,
                updatedAt: data.updated_at,
              };

              const allocations = allocationsResponse.data.map((d: any) => ({
                id: d.id,
                projectId: d.project_id,
                teamMemberId: d.team_member_id,
                phase: d.phase,
                date: d.date,
                hourBlock: d.hour_block,
                createdAt: d.created_at,
                updatedAt: d.updated_at,
              }));

              autoSchedule({
                assignment,
                project: {
                  id: projectResponse.data.id,
                  jobName: projectResponse.data.job_name,
                  jobDescription: projectResponse.data.job_description,
                  status: projectResponse.data.status,
                  installDate: projectResponse.data.install_date,
                  materialOrderDate: projectResponse.data.material_order_date,
                  millworkHrs: projectResponse.data.millwork_hrs,
                  boxConstructionHrs: projectResponse.data.box_construction_hrs,
                  stainHrs: projectResponse.data.stain_hrs,
                  installHrs: projectResponse.data.install_hrs,
                  millworkStartDate: projectResponse.data.millwork_start_date,
                  boxConstructionStartDate: projectResponse.data.box_construction_start_date,
                  stainStartDate: projectResponse.data.stain_start_date,
                  stainLacquerDate: projectResponse.data.stain_lacquer_date,
                  millingFillersDate: projectResponse.data.milling_fillers_date,
                  boxToekickAssemblyDate: projectResponse.data.box_toekick_assembly_date,
                  createdAt: projectResponse.data.created_at,
                  updatedAt: projectResponse.data.updated_at,
                },
                teamMembers: teamMembersResponse.data.map((tm: any) => ({
                  id: tm.id,
                  name: tm.name,
                  email: tm.email,
                  weeklyHours: tm.weekly_hours,
                  hourlyRate: tm.hourly_rate,
                  canDoMillwork: tm.can_do_millwork,
                  canDoBoxes: tm.can_do_boxes,
                  canDoStain: tm.can_do_stain,
                  canDoInstall: tm.can_do_install,
                  isActive: tm.is_active,
                  createdAt: tm.created_at,
                  updatedAt: tm.updated_at,
                })),
                existingAllocations: allocations,
              });
            }
          }
        } catch (error) {
          console.error('Auto-scheduling after update failed:', error);
        }
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update project assignment: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteProjectAssignment = () => {
  const queryClient = useQueryClient();
  const { clearHours } = useClearAutoScheduledHours();

  return useMutation({
    mutationFn: async (assignmentId: string) => {
      const { data: assignment, error: fetchError } = await supabase
        .from('project_assignments')
        .select('project_id, team_member_id, phase')
        .eq('id', assignmentId)
        .single();

      if (fetchError || !assignment) throw new Error("Could not find assignment to delete.");

      const { error } = await supabase.from('project_assignments').delete().eq('id', assignmentId);

      if (error) throw error;
      return assignment;
    },
    onSuccess: (assignment) => {
      queryClient.invalidateQueries({ queryKey: ['project-assignments', assignment.project_id] });
      
      toast({
        title: "Assignment Removed",
        description: "Project assignment has been removed successfully.",
      });

      // Clear auto-scheduled hours when assignment is deleted
      clearHours({
        projectId: assignment.project_id,
        teamMemberId: assignment.team_member_id,
        phase: assignment.phase,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to remove project assignment: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};
