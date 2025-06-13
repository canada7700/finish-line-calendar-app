
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
        shopHrs: project.shop_hrs,
        stainHrs: project.stain_hrs,
        installHrs: project.install_hrs,
        installDate: project.install_date,
        materialOrderDate: project.material_order_date,
        boxToekickAssemblyDate: project.box_toekick_assembly_date,
        millingFillersDate: project.milling_fillers_date,
        stainLacquerDate: project.stain_lacquer_date,
        shopStartDate: project.shop_start_date,
        stainStartDate: project.stain_start_date,
        status: project.status as Project['status']
      })) as Project[];
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
          shop_hrs: projectData.shopHrs,
          stain_hrs: projectData.stainHrs,
          install_hrs: projectData.installHrs,
          install_date: projectData.installDate,
          material_order_date: projectData.materialOrderDate,
          box_toekick_assembly_date: projectData.boxToekickAssemblyDate,
          milling_fillers_date: projectData.millingFillersDate,
          stain_lacquer_date: projectData.stainLacquerDate,
          shop_start_date: projectData.shopStartDate,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: "Project Added",
        description: "Project has been added successfully.",
      });
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
          shop_hrs: project.shopHrs,
          stain_hrs: project.stainHrs,
          install_hrs: project.installHrs,
          install_date: project.installDate,
          material_order_date: project.materialOrderDate,
          box_toekick_assembly_date: project.boxToekickAssemblyDate,
          milling_fillers_date: project.millingFillersDate,
          stain_lacquer_date: project.stainLacquerDate,
          shop_start_date: project.shopStartDate,
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

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      console.log('Deleting project:', projectId);
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) {
        console.error('Error deleting project:', error);
        throw error;
      }

      console.log('Project deleted successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: "Project Deleted",
        description: "Project has been deleted successfully.",
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

  return {
    projects,
    isLoading,
    error,
    addProject: addProjectMutation.mutate,
    isAddingProject: addProjectMutation.isPending,
    updateProject: updateProjectMutation.mutate,
    isUpdatingProject: updateProjectMutation.isPending,
    deleteProject: deleteProjectMutation.mutate,
    isDeletingProject: deleteProjectMutation.isPending
  };
};
