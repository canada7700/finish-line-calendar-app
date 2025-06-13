
import { useState } from 'react';
import { Project, ProjectPhase } from '../types/project';
import { ProjectScheduler } from '../utils/projectScheduler';
import ProjectCard from './ProjectCard';
import ProjectForm from './ProjectForm';
import CalendarView from './CalendarView';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Calendar, LayoutGrid } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Dashboard = () => {
  const [projects, setProjects] = useState<Project[]>([
    {
      id: '1',
      jobName: 'RACHEL WARKENTIN',
      jobDescription: 'CABINETS',
      shopHrs: 183,
      stainHrs: 80,
      installHrs: 102,
      installDate: '2025-08-15',
      materialOrderDate: '2025-06-16',
      boxToekickAssemblyDate: '2025-07-29',
      millingFillersDate: '2025-07-07',
      stainLacquerDate: '2025-07-26',
      status: 'shop'
    },
    {
      id: '2',
      jobName: 'ANDREA ENG',
      jobDescription: 'CABINETS',
      shopHrs: 65,
      stainHrs: 70,
      installHrs: 68,
      installDate: '2025-08-27',
      materialOrderDate: '2025-06-28',
      boxToekickAssemblyDate: '2025-08-21',
      millingFillersDate: '2025-08-03',
      stainLacquerDate: '2025-08-09',
      status: 'planning'
    }
  ]);

  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('projects');

  const handleAddProject = (projectData: Omit<Project, 'id'>) => {
    const newProject: Project = {
      ...projectData,
      id: Date.now().toString(),
    };
    
    const calculatedProject = ProjectScheduler.calculateProjectDates(newProject);
    setProjects(prev => [...prev, calculatedProject]);
    setShowForm(false);
    
    toast({
      title: "Project Added",
      description: `${projectData.jobName} has been added to your schedule.`,
    });
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
          />
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map(project => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => console.log('Project clicked:', project.id)}
                />
              ))}
            </div>
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
