
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ProjectScheduler } from '@/utils/projectScheduler';
import { Project, ProjectPhase } from '@/types/project';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format, addDays, differenceInDays } from 'date-fns';
import { useRef } from 'react';

export const useProjectRescheduling = (isDragInProgress: boolean = false) => {
  const queryClient = useQueryClient();
  const pendingUpdatesRef = useRef<{ project: Project; originalData: any } | null>(null);

  const rescheduleProjectMutation = useMutation({
    mutationFn: async ({ 
      project, 
      newInstallDate,
      isSettingInstallEnd = false
    }: { 
      project: Project; 
      newInstallDate: Date;
      isSettingInstallEnd?: boolean;
    }) => {
      console.log('Rescheduling project:', project.jobName, 'to new install date:', format(newInstallDate, 'yyyy-MM-dd'), 'isSettingInstallEnd:', isSettingInstallEnd);
      
      let recalculatedProject: Project;

      if (isSettingInstallEnd) {
        // Create updated project with new install end date
        const updatedProject = {
          ...project,
          installDate: format(newInstallDate, 'yyyy-MM-dd')
        };
        // Calculate from install end date (when dragging last install day)
        recalculatedProject = await ProjectScheduler.calculateProjectDatesFromInstallEnd(updatedProject);
      } else {
        // Create updated project with new install start date (standard behavior)
        const updatedProject = {
          ...project,
          installDate: format(newInstallDate, 'yyyy-MM-dd')
        };

        // Recalculate all project dates based on new install start date
        recalculatedProject = await ProjectScheduler.calculateProjectDates(updatedProject);
      }
      
      console.log('Recalculated project dates:', recalculatedProject);

      // Update the project directly in Supabase without going through useProjects
      const { error } = await supabase
        .from('projects')
        .update({
          install_date: recalculatedProject.installDate,
          material_order_date: recalculatedProject.materialOrderDate,
          box_toekick_assembly_date: recalculatedProject.boxToekickAssemblyDate,
          milling_fillers_date: recalculatedProject.millingFillersDate,
          stain_lacquer_date: recalculatedProject.stainLacquerDate,
          millwork_start_date: recalculatedProject.millworkStartDate,
          box_construction_start_date: recalculatedProject.boxConstructionStartDate,
          stain_start_date: recalculatedProject.stainStartDate
        })
        .eq('id', recalculatedProject.id);

      if (error) {
        console.error('Error updating project in database:', error);
        throw error;
      }

      return recalculatedProject;
    },
    onMutate: async ({ project, newInstallDate }) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['projects'] });

      // Snapshot the previous value
      const previousProjects = queryClient.getQueryData(['projects']);

      // Only update cache if NOT dragging
      if (!isDragInProgress) {
        // Optimistically update the project in the cache
        queryClient.setQueryData(['projects'], (old: Project[] | undefined) => {
          if (!old) return old;
          
          return old.map(p => {
            if (p.id === project.id) {
              return {
                ...p,
                installDate: format(newInstallDate, 'yyyy-MM-dd')
              };
            }
            return p;
          });
        });
      } else {
        console.log('Skipping optimistic update - drag in progress');
      }

      // Return a context object with the snapshotted value
      return { previousProjects };
    },
    onSuccess: (recalculatedProject, variables, context) => {
      // Only update cache if NOT dragging
      if (!isDragInProgress) {
        // Update the cache with the fully recalculated project
        queryClient.setQueryData(['projects'], (old: Project[] | undefined) => {
          if (!old) return old;
          
          return old.map(p => {
            if (p.id === recalculatedProject.id) {
              return recalculatedProject;
            }
            return p;
          });
        });
        
        toast({
          title: "Project Rescheduled",
          description: `${recalculatedProject.jobName} has been rescheduled successfully.`,
        });
      } else {
        // Store the update to apply later
        console.log('Storing pending update - drag in progress');
        pendingUpdatesRef.current = { 
          project: recalculatedProject, 
          originalData: context?.previousProjects 
        };
      }
    },
    onError: (error, variables, context) => {
      console.error('Failed to reschedule project:', error);
      
      // Rollback the optimistic update only if we actually made one
      if (!isDragInProgress && context?.previousProjects) {
        queryClient.setQueryData(['projects'], context.previousProjects);
      }
      
      toast({
        title: "Error",
        description: "Failed to reschedule project. Please try again.",
        variant: "destructive",
      });
    }
  });

  const applyPendingUpdates = () => {
    if (pendingUpdatesRef.current) {
      console.log('Applying pending cache update after drag completion');
      const { project } = pendingUpdatesRef.current;
      
      queryClient.setQueryData(['projects'], (old: Project[] | undefined) => {
        if (!old) return old;
        
        return old.map(p => {
          if (p.id === project.id) {
            return project;
          }
          return p;
        });
      });
      
      toast({
        title: "Project Rescheduled",
        description: `${project.jobName} has been rescheduled successfully.`,
      });
      
      pendingUpdatesRef.current = null;
    }
  };

  const rescheduleProject = (project: Project, newInstallDate: Date, isSettingInstallEnd: boolean = false) => {
    const currentInstallDate = new Date(`${project.installDate}T00:00:00`);
    const daysDifference = Math.abs(differenceInDays(newInstallDate, currentInstallDate));
    
    // Show confirmation for large date changes (more than 7 days)
    if (daysDifference > 7) {
      const action = isSettingInstallEnd ? 'setting install end to' : 'moving install start to';
      const confirmed = window.confirm(
        `You are ${action} "${project.jobName}" by ${daysDifference} days. This will recalculate all project dates. Continue?`
      );
      if (!confirmed) return;
    }

    rescheduleProjectMutation.mutate({ project, newInstallDate, isSettingInstallEnd });
  };

  return {
    rescheduleProject,
    isRescheduling: rescheduleProjectMutation.isPending,
    applyPendingUpdates,
  };
};
