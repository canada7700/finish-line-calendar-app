
import { useState } from 'react';
import { Project, ProjectPhase } from '../types/project';
import { ProjectScheduler } from '../utils/projectScheduler';
import ProjectCard from './ProjectCard';
import ProjectForm from './ProjectForm';
import CalendarView from './CalendarView';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Calendar, LayoutGrid } from 'lucide-react';
import { useProjects } from '../hooks/useProjects';

const Dashboard = () => {
  const { projects, isLoading, addProject, isAddingProject } = useProjects();
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('projects');

  const handleAddProject = (projectData: Omit<Project, 'id'>) => {
    const calculatedProject = ProjectScheduler.calculateProjectDates(projectData);
    console.log('Submitting project with calculated dates:', calculatedProject);
    addProject(calculatedProject);
    setShowForm(false);
  };

  const allPhases: ProjectPhase[] = projects.flatMap(project =>
    ProjectScheduler.generateProjectPhases(project)
  );

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
      <div className="min-h-screen bg-gray-50 p-6">
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Cabinet Finishing Scheduler</h1>
              <p className="text-gray-600">Manage your cabinet projects and scheduling</p>
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
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-gray-700">{statusCounts.planning}</div>
            <div className="text-sm text-gray-600">Planning</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-blue-600">{statusCounts.shop}</div>
            <div className="text-sm text-gray-600">In Shop</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-amber-600">{statusCounts.stain}</div>
            <div className="text-sm text-gray-600">Staining</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-green-600">{statusCounts.install}</div>
            <div className="text-sm text-gray-600">Installing</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-emerald-600">{statusCounts.completed}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-fit grid-cols-2">
            <TabsTrigger value="projects" className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" />
              Projects
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Calendar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="space-y-6">
            {projects.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No projects found. Add your first project to get started!</p>
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
                  />
                ))}
              </div>
            )}
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
