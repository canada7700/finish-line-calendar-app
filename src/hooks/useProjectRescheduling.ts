
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ProjectScheduler } from '@/utils/projectScheduler';
import { Project, ProjectPhase } from '@/types/project';
import { useProjects } from '@/hooks/useProjects';
import { toast } from '@/hooks/use-toast';
import { format, addDays, differenceInDays } from 'date-fns';

export const useProjectRescheduling = () => {
  const queryClient = useQueryClient();
  const { updateProject } = useProjects();

  const rescheduleProjectMutation = useMutation({
    mutationFn: async ({ 
      project, 
      newInstallDate 
    }: { 
      project: Project; 
      newInstallDate: Date; 
    }) => {
      console.log('Rescheduling project:', project.jobName, 'to new install date:', format(newInstallDate, 'yyyy-MM-dd'));
      
      // Create updated project with new install date
      const updatedProject = {
        ...project,
        installDate: format(newInstallDate, 'yyyy-MM-dd')
      };

      // Recalculate all project dates based on new install date
      const recalculatedProject = await ProjectScheduler.calculateProjectDates(updatedProject);
      
      console.log('Recalculated project dates:', recalculatedProject);
      return recalculatedProject;
    },
    onMutate: async ({ project, newInstallDate }) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
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

      // Return a context object with the snapshotted value
      return { previousProjects };
    },
    onSuccess: (recalculatedProject, variables, context) => {
      // Update the project in the database
      updateProject(recalculatedProject, {
        onSuccess: () => {
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
        onError: (error) => {
          console.error('Failed to update project:', error);
          
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
    },
    onError: (error, variables, context) => {
      console.error('Failed to reschedule project:', error);
      
      // Rollback the optimistic update
      if (context?.previousProjects) {
        queryClient.setQueryData(['projects'], context.previousProjects);
      }
      
      toast({
        title: "Error",
        description: "Failed to calculate new project dates. Please try again.",
        variant: "destructive",
      });
    }
  });

  const rescheduleProject = (project: Project, newInstallDate: Date) => {
    const currentInstallDate = new Date(`${project.installDate}T00:00:00`);
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

  return {
    rescheduleProject,
    isRescheduling: rescheduleProjectMutation.isPending,
  };
};
