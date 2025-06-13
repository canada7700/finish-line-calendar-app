
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProjectAssignment } from '../types/project';
import { toast } from '@/hooks/use-toast';

export const useProjectAssignments = (projectId?: string) => {
  const queryClient = useQueryClient();

  // Fetch assignments for a specific project or all assignments
  const { data: assignments = [], isLoading, error } = useQuery({
    queryKey: projectId ? ['project-assignments', projectId] : ['project-assignments'],
    queryFn: async () => {
      console.log('Fetching project assignments from Supabase...');
      let query = supabase
        .from('project_assignments')
        .select(`
          *,
          team_members (
            id,
            name,
            email,
            weekly_hours,
            can_do_shop,
            can_do_stain,
            can_do_install
          ),
          projects (
            id,
            job_name
          )
        `);
      
      if (projectId) {
        query = query.eq('project_id', projectId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching project assignments:', error);
        throw error;
      }
      
      console.log('Project assignments fetched:', data);
      
      // Transform the data to match our ProjectAssignment interface
      return data.map(assignment => ({
        id: assignment.id,
        projectId: assignment.project_id,
        teamMemberId: assignment.team_member_id,
        phase: assignment.phase as 'shop' | 'stain' | 'install',
        assignedHours: assignment.assigned_hours,
        startDate: assignment.start_date,
        endDate: assignment.end_date,
        createdAt: assignment.created_at,
        updatedAt: assignment.updated_at,
        teamMember: assignment.team_members,
        project: assignment.projects
      }));
    }
  });

  // Add assignment mutation
  const addAssignmentMutation = useMutation({
    mutationFn: async (assignmentData: Omit<ProjectAssignment, 'id' | 'createdAt' | 'updatedAt'>) => {
      console.log('Adding project assignment to Supabase:', assignmentData);
      const { data, error } = await supabase
        .from('project_assignments')
        .insert({
          project_id: assignmentData.projectId,
          team_member_id: assignmentData.teamMemberId,
          phase: assignmentData.phase,
          assigned_hours: assignmentData.assignedHours,
          start_date: assignmentData.startDate,
          end_date: assignmentData.endDate
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding project assignment:', error);
        throw error;
      }

      console.log('Project assignment added successfully:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-assignments'] });
      toast({
        title: "Assignment Added",
        description: "Project assignment has been added successfully.",
      });
    },
    onError: (error) => {
      console.error('Failed to add project assignment:', error);
      toast({
        title: "Error",
        description: "Failed to add project assignment. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Update assignment mutation
  const updateAssignmentMutation = useMutation({
    mutationFn: async ({ assignmentId, assignmentData }: { assignmentId: string; assignmentData: Partial<ProjectAssignment> }) => {
      console.log('Updating project assignment:', assignmentId, assignmentData);
      const { data, error } = await supabase
        .from('project_assignments')
        .update({
          assigned_hours: assignmentData.assignedHours,
          start_date: assignmentData.startDate,
          end_date: assignmentData.endDate,
          updated_at: new Date().toISOString()
        })
        .eq('id', assignmentId)
        .select()
        .single();

      if (error) {
        console.error('Error updating project assignment:', error);
        throw error;
      }

      console.log('Project assignment updated successfully:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-assignments'] });
      toast({
        title: "Assignment Updated",
        description: "Project assignment has been updated successfully.",
      });
    },
    onError: (error) => {
      console.error('Failed to update project assignment:', error);
      toast({
        title: "Error",
        description: "Failed to update project assignment. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Delete assignment mutation
  const deleteAssignmentMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      console.log('Deleting project assignment:', assignmentId);
      const { error } = await supabase
        .from('project_assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) {
        console.error('Error deleting project assignment:', error);
        throw error;
      }

      console.log('Project assignment deleted successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-assignments'] });
      toast({
        title: "Assignment Removed",
        description: "Project assignment has been removed successfully.",
      });
    },
    onError: (error) => {
      console.error('Failed to delete project assignment:', error);
      toast({
        title: "Error",
        description: "Failed to remove project assignment. Please try again.",
        variant: "destructive",
      });
    }
  });

  return {
    assignments,
    isLoading,
    error,
    addAssignment: addAssignmentMutation.mutate,
    isAddingAssignment: addAssignmentMutation.isPending,
    updateAssignment: updateAssignmentMutation.mutate,
    isUpdatingAssignment: updateAssignmentMutation.isPending,
    deleteAssignment: deleteAssignmentMutation.mutate,
    isDeletingAssignment: deleteAssignmentMutation.isPending
  };
};
