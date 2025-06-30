import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Project } from '../types/project';
import { toast } from '@/hooks/use-toast';

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isDeletingProject, setIsDeletingProject] = useState(false);
  const queryClient = useQueryClient();

  const { data: initialProjects, isLoading, refetch } = useQuery({
    queryKey: ['projects'],
    queryFn: async (): Promise<Project[]> => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('job_name', { ascending: true });

      if (error) {
        console.error('Error fetching projects:', error);
        throw error;
      }

      return data.map((d: any) => ({
        id: d.id,
        jobName: d.job_name,
        jobDescription: d.job_description,
        millworkHrs: d.millwork_hrs,
        boxConstructionHrs: d.box_construction_hrs,
        stainHrs: d.stain_hrs,
        installHrs: d.install_hrs,
        installDate: d.install_date,
        materialOrderDate: d.material_order_date,
        boxToekickAssemblyDate: d.box_toekick_assembly_date,
        millingFillersDate: d.milling_fillers_date,
        stainLacquerDate: d.stain_lacquer_date,
        millworkStartDate: d.millwork_start_date,
        boxConstructionStartDate: d.box_construction_start_date,
        stainStartDate: d.stain_start_date,
        status: d.status as Project['status'],
      }));
    },
  });

  useEffect(() => {
    if (initialProjects) {
      setProjects(initialProjects);
    }
  }, [initialProjects]);

  const addProjectMutation = useMutation({
    mutationFn: async (project: Omit<Project, 'id'>) => {
      const { data, error } = await supabase
        .from('projects')
        .insert([
          {
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
            status: project.status,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error adding project:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (newProject) => {
      setProjects(prev => [...prev, {
        id: newProject.id,
        jobName: newProject.job_name,
        jobDescription: newProject.job_description,
        millworkHrs: newProject.millwork_hrs,
        boxConstructionHrs: newProject.box_construction_hrs,
        stainHrs: newProject.stain_hrs,
        installHrs: newProject.install_hrs,
        installDate: newProject.install_date,
        materialOrderDate: newProject.material_order_date,
        boxToekickAssemblyDate: newProject.box_toekick_assembly_date,
        millingFillersDate: newProject.milling_fillers_date,
        stainLacquerDate: newProject.stain_lacquer_date,
        millworkStartDate: newProject.millwork_start_date,
        boxConstructionStartDate: newProject.box_construction_start_date,
        stainStartDate: newProject.stain_start_date,
        status: newProject.status as Project['status']
      }]);
      toast({
        title: "Project Created",
        description: "Project has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to create project: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: async (project: Project) => {
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
          status: project.status,
        })
        .eq('id', project.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating project:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (updatedProject) => {
      setProjects(prev =>
        prev.map(project =>
          project.id === updatedProject.id
            ? {
              id: updatedProject.id,
              jobName: updatedProject.job_name,
              jobDescription: updatedProject.job_description,
              millworkHrs: updatedProject.millwork_hrs,
              boxConstructionHrs: updatedProject.box_construction_hrs,
              stainHrs: updatedProject.stain_hrs,
              installHrs: updatedProject.install_hrs,
              installDate: updatedProject.install_date,
              materialOrderDate: updatedProject.material_order_date,
              boxToekickAssemblyDate: updatedProject.box_toekick_assembly_date,
              millingFillersDate: updatedProject.milling_fillers_date,
              stainLacquerDate: updatedProject.stain_lacquer_date,
              millworkStartDate: updatedProject.millwork_start_date,
              boxConstructionStartDate: updatedProject.box_construction_start_date,
              stainStartDate: updatedProject.stain_start_date,
              status: updatedProject.status as Project['status']
            }
            : project
        )
      );
      toast({
        title: "Project Updated",
        description: "Project has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to update project: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteProject = async (projectId: string) => {
    setIsDeletingProject(true);
    try {
      console.log('🗑️ Deleting project and related data...');
      
      // Delete in correct order due to foreign key constraints
      await supabase
        .from('daily_phase_allocations')
        .delete()
        .eq('project_id', projectId);

      await supabase
        .from('unscheduled_hours')
        .delete()
        .eq('project_id', projectId);
      
      await supabase
        .from('project_notes')
        .delete()
        .eq('project_id', projectId);
      
      await supabase
        .from('project_phase_exceptions')
        .delete()
        .eq('project_id', projectId);
      
      // Finally delete the project
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) {
        throw error;
      }

      // Remove from local state
      setProjects(prev => prev.filter(p => p.id !== projectId));
      
      toast({
        title: "Project Deleted",
        description: "Project and all related data have been deleted successfully.",
      });
      
      console.log('✅ Project deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting project:', error);
      toast({
        title: "Delete Failed",
        description: "Could not delete project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingProject(false);
    }
  };

  const addProject = useCallback(
    (project: Omit<Project, 'id'>, options?: { onSuccess?: (data: any) => void; onError?: (error: any) => void }) => {
      addProjectMutation.mutate(project, {
        onSuccess: (data) => {
          refetch();
          if (options?.onSuccess) {
            options.onSuccess(data);
          }
        },
        onError: (error: any) => {
          if (options?.onError) {
            options.onError(error);
          }
        },
      });
    },
    [addProjectMutation, refetch]
  );

  const updateProject = useCallback(
    (project: Project, options?: { onSuccess?: () => void; onError?: (error: any) => void }) => {
      updateProjectMutation.mutate(project, {
        onSuccess: () => {
          refetch();
          if (options?.onSuccess) {
            options.onSuccess();
          }
        },
        onError: (error: any) => {
          if (options?.onError) {
            options.onError(error);
          }
        },
      });
    },
    [updateProjectMutation, refetch]
  );

  return {
    projects,
    isLoading,
    addProject,
    updateProject,
    deleteProject,
    isAddingProject: addProjectMutation.isPending,
    isUpdatingProject: updateProjectMutation.isPending,
    isDeletingProject,
  };
};
