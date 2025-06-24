
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Project } from '../types/project';
import { toast } from '@/hooks/use-toast';

export const useProjects = () => {
  const queryClient = useQueryClient();

  // Fetch all projects
  const { data: projects = [], isLoading, error } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      console.log('Fetching projects from Supabase...');
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching projects:', error);
        throw error;
      }
      
      console.log('Projects fetched:', data);
      
      // Transform the data to match our Project interface
      return data.map(project => ({
        id: project.id,
        jobName: project.job_name,
        jobDescription: project.job_description,
        millworkHrs: project.millwork_hrs,
        boxConstructionHrs: project.box_construction_hrs,
        stainHrs: project.stain_hrs,
        installHrs: project.install_hrs,
        installDate: project.install_date,
        materialOrderDate: project.material_order_date,
        boxToekickAssemblyDate: project.box_toekick_assembly_date,
        millingFillersDate: project.milling_fillers_date,
        stainLacquerDate: project.stain_lacquer_date,
        millworkStartDate: project.millwork_start_date,
        boxConstructionStartDate: project.box_construction_start_date,
        stainStartDate: project.stain_start_date,
        status: project.status as Project['status']
      })) as Project[];
    }
  });

  // Clean up old custom projects (older than 7 days)
  const cleanupOldCustomProjects = useMutation({
    mutationFn: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('status', 'custom')
        .lt('created_at', sevenDaysAgo.toISOString());

      if (error) {
        console.error('Error cleaning up old custom projects:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      console.log('Old custom projects cleaned up successfully');
    }
  });

  // Add project mutation
  const addProjectMutation = useMutation({
    mutationFn: async (projectData: Omit<Project, 'id'>) => {
      console.log('Adding project to Supabase:', projectData);
      const { data, error } = await supabase
        .from('projects')
        .insert({
          job_name: projectData.jobName,
          job_description: projectData.jobDescription,
          millwork_hrs: projectData.millworkHrs,
          box_construction_hrs: projectData.boxConstructionHrs,
          stain_hrs: projectData.stainHrs,
          install_hrs: projectData.installHrs,
          install_date: projectData.installDate,
          material_order_date: projectData.materialOrderDate,
          box_toekick_assembly_date: projectData.boxToekickAssemblyDate,
          milling_fillers_date: projectData.millingFillersDate,
          stain_lacquer_date: projectData.stainLacquerDate,
          millwork_start_date: projectData.millworkStartDate,
          box_construction_start_date: projectData.boxConstructionStartDate,
          stain_start_date: projectData.stainStartDate,
          status: projectData.status
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding project:', error);
        throw error;
      }

      console.log('Project added successfully:', data);
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      // Also invalidate calendar-related queries to refresh the view
      queryClient.invalidateQueries({ queryKey: ['project-phases'] });
      
      // Only show success toast for non-custom projects
      if (variables.status !== 'custom') {
        toast({
          title: "Project Added",
          description: "Project has been added successfully.",
        });
      }
    },
    onError: (error) => {
      console.error('Failed to add project:', error);
      toast({
        title: "Error",
        description: "Failed to add project. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: async (project: Project) => {
      console.log('Updating project in Supabase:', project);
      const { data, error } = await supabase
        .from('projects')
        .update({
          job_name: project.jobName,
          job_description: project.jobDescription,
          millwork_hrs: project.millworkHrs,
          box_construction_hrs: project.boxConstructionHrs,
          stain_hrs: project.stainHrs,
          install_hrs: project.installHrs,
          install_date: project.installDate,
          material_order_date: project.materialOrderDate,
          box_toekick_assembly_date: project.boxToekickAssemblyDate,
          milling_fillers_date: project.millingFillersDate,
          stain_lacquer_date: project.stainLacquerDate,
          millwork_start_date: project.millworkStartDate,
          box_construction_start_date: project.boxConstructionStartDate,
          stain_start_date: project.stainStartDate,
          status: project.status
        })
        .eq('id', project.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating project:', error);
        throw error;
      }

      console.log('Project updated successfully:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error) => {
      console.error('Failed to update project:', error);
      toast({
        title: "Error",
        description: "Failed to update project. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Delete project mutation - enhanced for custom projects
  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      console.log('Deleting project:', projectId);
      
      // First delete related data (notes, allocations, exceptions)
      const deletePromises = [
        supabase.from('project_notes').delete().eq('project_id', projectId),
        supabase.from('daily_hour_allocations').delete().eq('project_id', projectId),
        supabase.from('project_phase_exceptions').delete().eq('project_id', projectId),
        supabase.from('project_assignments').delete().eq('project_id', projectId)
      ];

      await Promise.all(deletePromises);

      // Then delete the project
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) {
        console.error('Error deleting project:', error);
        throw error;
      }

      console.log('Project and related data deleted successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project-phases'] });
      toast({
        title: "Project Deleted",
        description: "Project and all related data have been deleted successfully.",
      });
    },
    onError: (error) => {
      console.error('Failed to delete project:', error);
      toast({
        title: "Error",
        description: "Failed to delete project. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Auto-cleanup old custom projects on component mount
  useEffect(() => {
    const timer = setTimeout(() => {
      cleanupOldCustomProjects.mutate();
    }, 1000); // Delay to let initial queries complete

    return () => clearTimeout(timer);
  }, []);

  return {
    projects,
    isLoading,
    error,
    addProject: (projectData: Omit<Project, 'id'>, options?: { onSuccess?: (data: any) => void; onError?: (error: any) => void }) => {
      return addProjectMutation.mutate(projectData, options);
    },
    isAddingProject: addProjectMutation.isPending,
    updateProject: (projectData: Project, options?: { onSuccess?: () => void; onError?: (error: any) => void }) => {
      return updateProjectMutation.mutate(projectData, options);
    },
    isUpdatingProject: updateProjectMutation.isPending,
    deleteProject: deleteProjectMutation.mutate,
    isDeletingProject: deleteProjectMutation.isPending,
    cleanupOldCustomProjects: cleanupOldCustomProjects.mutate,
    isCleaningUp: cleanupOldCustomProjects.isPending
  };
};
