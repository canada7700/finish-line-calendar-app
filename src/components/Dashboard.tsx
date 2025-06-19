
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { getProjectPhases } from '@/utils/projectScheduler';
import { ProjectPhase, Project } from '@/types/project';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, Users, Clock, AlertTriangle } from 'lucide-react';
import TeamWorkloadOverview from './TeamWorkloadOverview';
import { format, parseISO, isWithinInterval, startOfWeek, endOfWeek } from 'date-fns';

const Dashboard = () => {
  const { projects, isLoading } = useProjects();
  const [phases, setPhases] = useState<ProjectPhase[]>([]);
  const [isLoadingPhases, setIsLoadingPhases] = useState(true);
  const previousProjectsRef = useRef<Project[]>([]);

  // Memoize expensive calculations
  const memoizedProjects = useMemo(() => projects || [], [projects]);

  // Optimized phase calculation - only recalculate for changed projects
  useEffect(() => {
    const calculatePhasesOptimized = async () => {
      if (!memoizedProjects.length) {
        setPhases([]);
        setIsLoadingPhases(false);
        return;
      }

      const previousProjects = previousProjectsRef.current;
      
      // Check if this is the initial load or if projects have actually changed
      const hasChanges = previousProjects.length !== memoizedProjects.length ||
        memoizedProjects.some(project => {
          const previousProject = previousProjects.find(p => p.id === project.id);
          return !previousProject || 
            previousProject.installDate !== project.installDate ||
            previousProject.millworkHrs !== project.millworkHrs ||
            previousProject.boxConstructionHrs !== project.boxConstructionHrs ||
            previousProject.stainHrs !== project.stainHrs ||
            previousProject.installHrs !== project.installHrs;
        });

      if (!hasChanges && phases.length > 0) {
        console.log('No project changes detected, skipping phase recalculation');
        return;
      }

      console.log('Project changes detected, recalculating phases');
      setIsLoadingPhases(true);
      
      try {
        const newPhases = await getProjectPhases(memoizedProjects);
        setPhases(newPhases);
        previousProjectsRef.current = [...memoizedProjects];
      } catch (error) {
        console.error('Error calculating phases:', error);
      } finally {
        setIsLoadingPhases(false);
      }
    };

    calculatePhasesOptimized();
  }, [memoizedProjects, phases.length]);

  // Calculate dashboard statistics
  const totalProjects = memoizedProjects.length;

  // Calculate projects due this week
  const projectsDueThisWeek = useMemo(() => {
    const today = new Date();
    const start = startOfWeek(today, { weekStartsOn: 0 }); // Assuming Sunday is the first day of the week
    const end = endOfWeek(today, { weekStartsOn: 0 });

    return memoizedProjects.filter(project => {
      const installDate = parseISO(project.installDate);
      return isWithinInterval(installDate, { start, end });
    }).length;
  }, [memoizedProjects]);

  // Calculate total team members (placeholder, replace with actual data source)
  const totalTeamMembers = 12;

  // Calculate overdue projects (install date is in the past)
  const overdueProjects = useMemo(() => {
    const today = new Date();
    return memoizedProjects.filter(project => {
      const installDate = parseISO(project.installDate);
      return installDate < today;
    }).length;
  }, [memoizedProjects]);

  if (isLoading || isLoadingPhases) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Total Projects
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProjects}</div>
            <p className="text-sm text-gray-500">
              All active construction projects
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Projects Due This Week
            </CardTitle>
            <Clock className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectsDueThisWeek}</div>
            <p className="text-sm text-gray-500">
              Projects with install date this week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Total Team Members
            </CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTeamMembers}</div>
            <p className="text-sm text-gray-500">
              Active team members in the system
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Overdue Projects
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overdueProjects}</div>
            <p className="text-sm text-red-500">
              Projects past their install date
            </p>
          </CardContent>
        </Card>
      </div>

      <TeamWorkloadOverview />
    </div>
  );
};

export default Dashboard;
