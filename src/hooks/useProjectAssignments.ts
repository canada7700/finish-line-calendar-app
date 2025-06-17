
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProjectAssignment } from '../types/project';
import { toast } from '@/hooks/use-toast';

export const useProjectAssignments = ({ projectId }: { projectId: string }) => {
  return useQuery({
    queryKey: ['project-assignments', projectId],
    queryFn: async (): Promise<ProjectAssignment[]> => {
      const { data, error } = await supabase
        .from('project_assignments')
        .select(`
          id,
          project_id,
          team_member_id,
          phase,
          assigned_hours,
          actual_hours,
          start_date,
          end_date,
          created_at,
          updated_at,
          team_members (
            *
          ),
          projects (
            id,
            job_name
          )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        toast({ title: "Error fetching assignments", description: error.message, variant: 'destructive' });
        throw new Error(error.message);
      }
      
      return data.map((d: any) => ({
        id: d.id,
        projectId: d.project_id,
        teamMemberId: d.team_member_id,
        phase: d.phase,
        assignedHours: d.assigned_hours,
        actualHours: d.actual_hours,
        startDate: d.start_date,
        endDate: d.end_date,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
        teamMember: d.team_members ? {
          id: d.team_members.id,
          name: d.team_members.name,
          email: d.team_members.email,
          weeklyHours: d.team_members.weekly_hours,
          hourlyRate: d.team_members.hourly_rate,
          canDoMillwork: d.team_members.can_do_millwork,
          canDoBoxes: d.team_members.can_do_boxes,
          canDoStain: d.team_members.can_do_stain,
          canDoInstall: d.team_members.can_do_install,
          isActive: d.team_members.is_active,
          createdAt: d.team_members.created_at,
          updatedAt: d.team_members.updated_at,
        } : undefined,
        project: d.projects ? {
          id: d.projects.id,
          jobName: d.projects.job_name,
        } : undefined,
      }));
    },
  });
};

export const useAllProjectAssignments = () => {
  return useQuery<ProjectAssignment[], Error>({
    queryKey: ['project-assignments-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_assignments')
        .select(`
          *,
          team_members (*),
          projects (id, job_name)
        `);

      if (error) {
        toast({ title: "Error fetching all assignments", description: error.message, variant: 'destructive' });
        throw new Error(error.message);
      }
      
      return data.map((d: any) => ({
        id: d.id,
        projectId: d.project_id,
        teamMemberId: d.team_member_id,
        phase: d.phase,
        assignedHours: d.assigned_hours,
        actualHours: d.actual_hours,
        startDate: d.start_date,
        endDate: d.end_date,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
        teamMember: d.team_members ? {
            id: d.team_members.id,
            name: d.team_members.name,
            email: d.team_members.email,
            weeklyHours: d.team_members.weekly_hours,
            hourlyRate: d.team_members.hourly_rate,
            canDoMillwork: d.team_members.can_do_millwork,
            canDoBoxes: d.team_members.can_do_boxes,
            canDoStain: d.team_members.can_do_stain,
            canDoInstall: d.team_members.can_do_install,
            isActive: d.team_members.is_active,
            createdAt: d.team_members.created_at,
            updatedAt: d.team_members.updated_at
        } : undefined,
        project: d.projects ? {
            id: d.projects.id,
            jobName: d.projects.job_name,
        } : undefined,
      }));
    },
  });
};
