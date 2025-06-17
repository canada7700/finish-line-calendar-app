
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProjectAssignment } from '../types/project';
import { toast } from '@/hooks/use-toast';

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
