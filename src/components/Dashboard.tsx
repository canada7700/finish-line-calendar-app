
import { useState, useEffect } from 'react';
import { Project, ProjectPhase } from '../types/project';
import { ProjectScheduler } from '../utils/projectScheduler';
import ProjectCard from './ProjectCard';
import ProjectForm from './ProjectForm';
import CalendarView from './CalendarView';
import ProjectListView from './ProjectListView';
import TeamWorkloadOverview from './TeamWorkloadOverview';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Calendar, LayoutGrid, List } from 'lucide-react';
import { useProjects } from '../hooks/useProjects';

const Dashboard = () => {
  const { projects, isLoading, addProject, isAddingProject, deleteProject } = useProjects();
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('projects');
  const [allPhases, setAllPhases] = useState<ProjectPhase[]>([]);

  // Generate phases asynchronously when projects change
  useEffect(() => {
    const generatePhases = async () => {
      const phasePromises = projects.map(project => 
        ProjectScheduler.generateProjectPhases(project)
      );
      const phasesArrays = await Promise.all(phasePromises);
      const flattenedPhases = phasesArrays.flat();
      setAllPhases(flattenedPhases);
    };

    if (projects.length > 0) {
      generatePhases();
    } else {
      setAllPhases([]);
    }
  }, [projects]);

  const handleAddProject = async (projectData: Omit<Project, 'id'>) => {
    // Create a temporary project with an id for calculation purposes
    const tempProject = { ...projectData, id: 'temp' };
    const calculatedProject = await ProjectScheduler.calculateProjectDates(tempProject);
    console.log('Submitting project with calculated dates:', calculatedProject);
    // Remove the temporary id since addProject expects Omit<Project, 'id'>
    const { id, ...projectWithoutId } = calculatedProject;
    addProject(projectWithoutId);
    setShowForm(false);
  };

  const getStatusCounts = () => {
    const counts = {
      planning: 0,
      shop: 0,
      stain: 0,
      install: 0,
      completed: 0
    };
    
    projects.forEach(project => {
      counts[project.status]++;
    });
    
    return counts;
  };

  const statusCounts = getStatusCounts();

  if (showForm) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <ProjectForm
            onSubmit={handleAddProject}
            onCancel={() => setShowForm(false)}
            isSubmitting={isAddingProject}
          />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Cabinet Finishing Scheduler</h1>
              <p className="text-muted-foreground">Manage your cabinet projects and team scheduling</p>
            </div>
            <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Project
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          <div className="bg-card p-4 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-muted-foreground">{statusCounts.planning}</div>
            <div className="text-sm text-muted-foreground">Planning</div>
          </div>
          <div className="bg-card p-4 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-blue-600">{statusCounts.shop}</div>
            <div className="text-sm text-muted-foreground">In Shop</div>
          </div>
          <div className="bg-card p-4 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-amber-600">{statusCounts.stain}</div>
            <div className="text-sm text-muted-foreground">Staining</div>
          </div>
          <div className="bg-card p-4 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-green-600">{statusCounts.install}</div>
            <div className="text-sm text-muted-foreground">Installing</div>
          </div>
          <div className="bg-card p-4 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-emerald-600">{statusCounts.completed}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </div>
        </div>

        {/* Team Workload Overview */}
        <div className="mb-8">
          <TeamWorkloadOverview />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-fit grid-cols-3">
            <TabsTrigger value="projects" className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" />
              Cards
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              List
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Calendar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="space-y-6">
            {projects.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No projects found. Add your first project to get started!</p>
                <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Project
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map(project => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onClick={() => console.log('Project clicked:', project.id)}
                    onDelete={deleteProject}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="list" className="space-y-6">
            <ProjectListView projects={projects} onDelete={deleteProject} />
          </TabsContent>

          <TabsContent value="calendar" className="space-y-6">
            <CalendarView phases={allPhases} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
