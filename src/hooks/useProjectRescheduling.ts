
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ProjectScheduler } from '@/utils/projectScheduler';
import { mapProjectToDatabase } from '@/utils/databaseMapping';
import { format } from 'date-fns';
import { Project } from '@/types/project';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { differenceInDays, parseISO } from 'date-fns';

export const useProjectRescheduling = (isDragging?: boolean) => {
  const queryClient = useQueryClient();

  const rescheduleProjectMutation = useMutation({
    mutationFn: async ({ 
      project, 
      newInstallDate 
    }: { 
      project: Project; 
      newInstallDate: Date; 
    }) => {
      console.log('Rescheduling project:', project.jobName, 'to new install date:', newInstallDate);
      
      // Convert the new install date to UTC string for calculations
      const updatedProject = {
        ...project,
        installDate: format(newInstallDate, 'yyyy-MM-dd')
      };

      // Recalculate all project dates based on new install date
      const recalculatedProject = ProjectScheduler.calculateProjectDates(updatedProject);
      
      console.log('Recalculated project dates:', recalculatedProject);

      // Use dynamic mapping to convert camelCase to snake_case
      const dbFields = mapProjectToDatabase(recalculatedProject);

      // Update the project in Supabase using dynamic field mapping
      const { error } = await supabase
        .from('projects')
        .update(dbFields)
        .eq('id', recalculatedProject.id);

      if (error) {
        console.error('Error updating project in database:', error);
        throw error;
      }

      return recalculatedProject;
    },
    onMutate: async ({ project, newInstallDate }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['projects'] });

      // Snapshot the previous value
      const previousProjects = queryClient.getQueryData(['projects']);

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

      return { previousProjects };
    },
    onSuccess: (recalculatedProject) => {
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
    },
    onError: (error, variables, context) => {
      console.error('Failed to reschedule project:', error);
      
      // Rollback the optimistic update
      if (context?.previousProjects) {
        queryClient.setQueryData(['projects'], context.previousProjects);
      }
      
      toast({
        title: "Error",
        description: "Failed to reschedule project. Please try again.",
        variant: "destructive",
      });
    }
  });

  const rescheduleProject = (project: Project, newInstallDate: Date) => {
    const currentInstallDate = parseISO(project.installDate);
    const daysDifference = Math.abs(differenceInDays(newInstallDate, currentInstallDate));
    
    // Show confirmation for large date changes (more than 7 days)
    if (daysDifference > 7) {
      const confirmed = window.confirm(
        `You are moving "${project.jobName}" by ${daysDifference} days. This will recalculate all project dates. Continue?`
      );
      if (!confirmed) return;
    }

    rescheduleProjectMutation.mutate({ project, newInstallDate });
  };

  const applyPendingUpdates = () => {
    // This function is no longer needed with the simplified approach
    console.log('applyPendingUpdates called - no-op with new implementation');
  };

  return {
    rescheduleProject,
    isRescheduling: rescheduleProjectMutation.isPending,
    applyPendingUpdates,
  };
};
