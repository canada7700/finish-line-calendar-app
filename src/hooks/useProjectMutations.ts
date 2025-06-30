
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Project, DailyPhaseCapacity, DailyPhaseAllocation } from '../types/project';
import { toast } from '@/hooks/use-toast';
import { useCapacityScheduler } from './useCapacityScheduler';

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  const { scheduleProject } = useCapacityScheduler();

  return useMutation({
    mutationFn: async (projectData: Omit<Project, 'id'>) => {
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
          status: projectData.status,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      
      toast({
        title: "Project Created",
        description: "Project has been created successfully.",
      });

      // Auto-schedule the project if it has phase hours and dates
      const project: Project = {
        id: data.id,
        jobName: data.job_name,
        jobDescription: data.job_description,
        millworkHrs: data.millwork_hrs,
        boxConstructionHrs: data.box_construction_hrs,
        stainHrs: data.stain_hrs,
        installHrs: data.install_hrs,
        installDate: data.install_date,
        materialOrderDate: data.material_order_date,
        boxToekickAssemblyDate: data.box_toekick_assembly_date,
        millingFillersDate: data.milling_fillers_date,
        stainLacquerDate: data.stain_lacquer_date,
        millworkStartDate: data.millwork_start_date,
        boxConstructionStartDate: data.box_construction_start_date,
        stainStartDate: data.stain_start_date,
        status: data.status as Project['status'],
      };

      // Get capacities and existing allocations for auto-scheduling
      try {
        const [capacitiesResponse, allocationsResponse] = await Promise.all([
          supabase.from('daily_phase_capacities').select('*'),
          supabase.from('daily_phase_allocations').select('*')
        ]);

        if (capacitiesResponse.data && allocationsResponse.data) {
          const capacities: DailyPhaseCapacity[] = capacitiesResponse.data.map((d: any) => ({
            id: d.id,
            phase: d.phase,
            maxHours: d.max_hours,
            createdAt: d.created_at,
            updatedAt: d.updated_at,
          }));

          const existingAllocations: DailyPhaseAllocation[] = allocationsResponse.data.map((d: any) => ({
            id: d.id,
            projectId: d.project_id,
            phase: d.phase,
            date: d.date,
            allocatedHours: d.allocated_hours,
            createdAt: d.created_at,
            updatedAt: d.updated_at,
          }));

          scheduleProject({ project, capacities, existingAllocations });
        }
      } catch (error) {
        console.error('Auto-scheduling failed:', error);
        // Don't show error toast here as the project was successfully created
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to create project: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectData: Partial<Project> & { id: string }) => {
      const { id, ...updateData } = projectData;
      const { data, error } = await supabase
        .from('projects')
        .update({
          job_name: updateData.jobName,
          job_description: updateData.jobDescription,
          millwork_hrs: updateData.millworkHrs,
          box_construction_hrs: updateData.boxConstructionHrs,
          stain_hrs: updateData.stainHrs,
          install_hrs: updateData.installHrs,
          install_date: updateData.installDate,
          material_order_date: updateData.materialOrderDate,
          box_toekick_assembly_date: updateData.boxToekickAssemblyDate,
          milling_fillers_date: updateData.millingFillersDate,
          stain_lacquer_date: updateData.stainLacquerDate,
          millwork_start_date: updateData.millworkStartDate,
          box_construction_start_date: updateData.boxConstructionStartDate,
          stain_start_date: updateData.stainStartDate,
          status: updateData.status,
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      
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
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase.from('projects').delete().eq('id', projectId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      
      toast({
        title: "Project Deleted",
        description: "Project has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to delete project: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};
