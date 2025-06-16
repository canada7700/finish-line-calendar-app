
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TeamMember } from '../types/project';
import { toast } from '@/hooks/use-toast';

export const useTeamMembers = () => {
  const queryClient = useQueryClient();

  // Fetch all team members
  const { data: teamMembers = [], isLoading, error } = useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      console.log('Fetching team members from Supabase...');
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) {
        console.error('Error fetching team members:', error);
        throw error;
      }
      
      console.log('Team members fetched:', data);
      
      // Transform the data to match our TeamMember interface
      return data.map(member => ({
        id: member.id,
        name: member.name,
        email: member.email,
        weeklyHours: member.weekly_hours,
        hourlyRate: member.hourly_rate,
        canDoMillwork: member.can_do_millwork,
        canDoBoxes: member.can_do_boxes,
        canDoStain: member.can_do_stain,
        canDoInstall: member.can_do_install,
        isActive: member.is_active,
        createdAt: member.created_at,
        updatedAt: member.updated_at
      })) as TeamMember[];
    }
  });

  // Add team member mutation
  const addTeamMemberMutation = useMutation({
    mutationFn: async (memberData: Omit<TeamMember, 'id' | 'createdAt' | 'updatedAt'>) => {
      console.log('Adding team member to Supabase:', memberData);
      const { data, error } = await supabase
        .from('team_members')
        .insert({
          name: memberData.name,
          email: memberData.email,
          weekly_hours: memberData.weeklyHours,
          hourly_rate: memberData.hourlyRate,
          can_do_millwork: memberData.canDoMillwork,
          can_do_boxes: memberData.canDoBoxes,
          can_do_stain: memberData.canDoStain,
          can_do_install: memberData.canDoInstall,
          is_active: memberData.isActive
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding team member:', error);
        throw error;
      }

      console.log('Team member added successfully:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast({
        title: "Team Member Added",
        description: "Team member has been added successfully.",
      });
    },
    onError: (error) => {
      console.error('Failed to add team member:', error);
      toast({
        title: "Error",
        description: "Failed to add team member. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Update team member mutation
  const updateTeamMemberMutation = useMutation({
    mutationFn: async ({ memberId, memberData }: { memberId: string; memberData: Partial<TeamMember> }) => {
      console.log('Updating team member:', memberId, memberData);
      const { data, error } = await supabase
        .from('team_members')
        .update({
          name: memberData.name,
          email: memberData.email,
          weekly_hours: memberData.weeklyHours,
          hourly_rate: memberData.hourlyRate,
          can_do_millwork: memberData.canDoMillwork,
          can_do_boxes: memberData.canDoBoxes,
          can_do_stain: memberData.canDoStain,
          can_do_install: memberData.canDoInstall,
          is_active: memberData.isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId)
        .select()
        .single();

      if (error) {
        console.error('Error updating team member:', error);
        throw error;
      }

      console.log('Team member updated successfully:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast({
        title: "Team Member Updated",
        description: "Team member has been updated successfully.",
      });
    },
    onError: (error) => {
      console.error('Failed to update team member:', error);
      toast({
        title: "Error",
        description: "Failed to update team member. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Delete team member mutation (soft delete)
  const deleteTeamMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      console.log('Deactivating team member:', memberId);
      const { error } = await supabase
        .from('team_members')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId);

      if (error) {
        console.error('Error deactivating team member:', error);
        throw error;
      }

      console.log('Team member deactivated successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast({
        title: "Team Member Removed",
        description: "Team member has been deactivated successfully.",
      });
    },
    onError: (error) => {
      console.error('Failed to deactivate team member:', error);
      toast({
        title: "Error",
        description: "Failed to remove team member. Please try again.",
        variant: "destructive",
      });
    }
  });

  return {
    teamMembers,
    isLoading,
    error,
    addTeamMember: addTeamMemberMutation.mutate,
    isAddingTeamMember: addTeamMemberMutation.isPending,
    updateTeamMember: updateTeamMemberMutation.mutate,
    isUpdatingTeamMember: updateTeamMemberMutation.isPending,
    deleteTeamMember: deleteTeamMemberMutation.mutate,
    isDeletingTeamMember: deleteTeamMemberMutation.isPending
  };
};
