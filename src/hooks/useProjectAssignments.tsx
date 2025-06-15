import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProjectAssignment } from '../types/project';
import { toast } from '@/hooks/use-toast';

export const useProjectAssignments = ({ projectId }: { projectId: string }) => {
  return useQuery({
    queryKey: ['project-assignments', projectId],
    queryFn: async (): Promise<ProjectAssignment[]> => {
      const { data, error } = await supabase
        .from('project_assignments')
        .select(`
          id,
          project_id,
          team_member_id,
          phase,
          assigned_hours,
          actual_hours,
          start_date,
          end_date,
          created_at,
          updated_at,
          team_members (
            *
          ),
          projects (
            id,
            job_name
          )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        toast({ title: "Error fetching assignments", description: error.message, variant: 'destructive' });
        throw new Error(error.message);
      }
      
      return data.map((d: any) => ({
        id: d.id,
        projectId: d.project_id,
        teamMemberId: d.team_member_id,
        phase: d.phase,
        assignedHours: d.assigned_hours,
        actualHours: d.actual_hours,
        startDate: d.start_date,
        endDate: d.end_date,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
        teamMember: d.team_members ? {
          id: d.team_members.id,
          name: d.team_members.name,
          email: d.team_members.email,
          weeklyHours: d.team_members.weekly_hours,
          hourlyRate: d.team_members.hourly_rate,
          canDoShop: d.team_members.can_do_shop,
          canDoStain: d.team_members.can_do_stain,
          canDoInstall: d.team_members.can_do_install,
          isActive: d.team_members.is_active,
          createdAt: d.team_members.created_at,
          updatedAt: d.team_members.updated_at,
        } : undefined,
        project: d.projects ? {
          id: d.projects.id,
          jobName: d.projects.job_name,
        } : undefined,
      }));
    },
  });
};

export const useAllProjectAssignments = () => {
  return useQuery<ProjectAssignment[], Error>({
    queryKey: ['project-assignments-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_assignments')
        .select(`
          *,
          team_members (*),
          projects (id, job_name)
        `);

      if (error) {
        toast({ title: "Error fetching all assignments", description: error.message, variant: 'destructive' });
        throw new Error(error.message);
      }
      
      return data.map((d: any) => ({
        id: d.id,
        projectId: d.project_id,
        teamMemberId: d.team_member_id,
        phase: d.phase,
        assignedHours: d.assigned_hours,
        actualHours: d.actual_hours,
        startDate: d.start_date,
        endDate: d.end_date,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
        teamMember: d.team_members ? {
            id: d.team_members.id,
            name: d.team_members.name,
            email: d.team_members.email,
            weeklyHours: d.team_members.weekly_hours,
            hourlyRate: d.team_members.hourly_rate,
            canDoShop: d.team_members.can_do_shop,
            canDoStain: d.team_members.can_do_stain,
            canDoInstall: d.team_members.can_do_install,
            isActive: d.team_members.is_active,
            createdAt: d.team_members.created_at,
            updatedAt: d.team_members.updated_at
        } : undefined,
        project: d.projects ? {
            id: d.projects.id,
            jobName: d.projects.job_name,
        } : undefined,
      }));
    },
  });
};

export const useAddProjectAssignment = () => {
  const queryClient = useQueryClient();
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project-assignments', data.project_id] });
      toast({
        title: "Assignment Added",
        description: "Project assignment has been added successfully.",
      });
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project-assignments', data.project_id] });
      toast({
        title: "Assignment Updated",
        description: "Project assignment has been updated successfully.",
      });
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
  return useMutation({
    mutationFn: async (assignmentId: string) => {
      const { data: assignment, error: fetchError } = await supabase
        .from('project_assignments')
        .select('project_id')
        .eq('id', assignmentId)
        .single();

      if (fetchError || !assignment) throw new Error("Could not find assignment to delete.");

      const { error } = await supabase.from('project_assignments').delete().eq('id', assignmentId);

      if (error) throw error;
      return assignment.project_id;
    },
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({ queryKey: ['project-assignments', projectId] });
      toast({
        title: "Assignment Removed",
        description: "Project assignment has been removed successfully.",
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
