
import { useState, useEffect } from 'react';
import { Project, ProjectPhase } from '../types/project';
import { ProjectScheduler } from '../utils/projectScheduler';
import ProjectCard from './ProjectCard';
import ProjectForm from './ProjectForm';
import { CalendarView } from './CalendarView';
import ProjectListView from './ProjectListView';
import TeamWorkloadOverview from './TeamWorkloadOverview';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Calendar, LayoutGrid, List, RefreshCw, Bug } from 'lucide-react';
import { useProjects } from '../hooks/useProjects';
import { toast } from '@/hooks/use-toast';

const Dashboard = () => {
  const { projects, isLoading, addProject, isAddingProject, deleteProject, updateProject, isUpdatingProject } = useProjects();
  const [showAddForm, setShowAddForm] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState('projects');
  const [allPhases, setAllPhases] = useState<ProjectPhase[]>([]);
  const [isRecalculating, setIsRecalculating] = useState(false);

  // Generate phases asynchronously when projects change
  useEffect(() => {
    const generatePhases = async () => {
      console.log('🎭 Generating phases for all projects...');
      const phasePromises = projects.map(project => 
        ProjectScheduler.generateProjectPhases(project)
      );
      const phasesArrays = await Promise.all(phasePromises);
      const flattenedPhases = phasesArrays.flat();
      setAllPhases(flattenedPhases);
      console.log('✅ Generated phases for dashboard:', flattenedPhases.length);
    };

    if (projects.length > 0) {
      generatePhases();
    } else {
      setAllPhases([]);
    }
  }, [projects]);

  const handleAddProjectClick = () => {
    setProjectToEdit(null);
    setShowAddForm(true);
  };

  const handleEditProjectClick = (project: Project) => {
    setShowAddForm(false);
    setProjectToEdit(project);
  };

  const handleCancelForm = () => {
    setShowAddForm(false);
    setProjectToEdit(null);
  };

  const handleFormSubmit = async (projectData: Omit<Project, 'id'> | Project) => {
    const isEditing = 'id' in projectData;
    handleCancelForm();

    try {
      const calculatedProject = await ProjectScheduler.calculateProjectDates(projectData as Project);

      if (isEditing) {
        updateProject(calculatedProject, {
          onSuccess: () => {
            toast({ title: "Project Updated", description: "Project has been updated successfully." });
          },
          onError: (error) => {
            toast({ title: "Update Failed", description: `Could not update project: ${error.message}`, variant: "destructive" });
          }
        });
      } else {
        const { id, ...projectWithoutId } = calculatedProject;
        addProject(projectWithoutId);
      }
    } catch (error) {
      console.error("Error submitting form", error);
      toast({ title: "Error", description: `An error occurred during date calculation.`, variant: "destructive" });
    }
  };

  const handleRecalculateAll = async () => {
    setIsRecalculating(true);
    try {
      console.log('🔄 Recalculating all project dates...');
      
      // Force reload holidays first
      await ProjectScheduler.forceReloadHolidays();
      
      // Show current holiday status
      const holidayStatus = ProjectScheduler.getCurrentHolidays();
      console.log('🎄 Current holidays status:', holidayStatus);
      
      toast({
        title: "Recalculation Started",
        description: `Recalculating dates for ${projects.length} projects with ${holidayStatus.holidays.length} holidays loaded.`,
      });
      
      // Clear phases first to prevent showing outdated data
      setAllPhases([]);
      
      // Recalculate each project's dates and update in database
      const updatePromises = projects.map(async (project) => {
        try {
          console.log(`📅 Recalculating dates for project: ${project.jobName}`);
          console.log('📅 Original dates:', {
            install: project.installDate,
            shopStart: project.shopStartDate,
            stainStart: project.stainStartDate,
            stainEnd: project.stainLacquerDate
          });
          
          // Recalculate project dates
          const recalculatedProject = await ProjectScheduler.calculateProjectDates(project);
          
          console.log('📅 Recalculated dates:', {
            install: recalculatedProject.installDate,
            shopStart: recalculatedProject.shopStartDate,
            stainStart: recalculatedProject.stainStartDate,
            stainEnd: recalculatedProject.stainLacquerDate
          });
          
          // Update the project in the database with new dates
          await new Promise<void>((resolve, reject) => {
            updateProject(recalculatedProject, {
              onSuccess: () => {
                console.log(`✅ Updated project ${project.jobName} with new dates`);
                resolve();
              },
              onError: (error) => {
                console.error(`❌ Failed to update project ${project.jobName}:`, error);
                reject(error);
              }
            });
          });
          
        } catch (error) {
          console.error(`❌ Error recalculating project ${project.jobName}:`, error);
          throw error;
        }
      });
      
      // Wait for all projects to be updated
      await Promise.all(updatePromises);
      
      toast({
        title: "Recalculation Complete",
        description: "All project dates have been recalculated and updated to respect holidays and weekends.",
      });
      
    } catch (error) {
      console.error('❌ Error recalculating projects:', error);
      toast({
        title: "Recalculation Failed",
        description: "There was an error recalculating project dates.",
        variant: "destructive",
      });
    } finally {
      setIsRecalculating(false);
    }
  };

  const handleDebugScheduling = () => {
    const holidayStatus = ProjectScheduler.getCurrentHolidays();
    console.log('🐛 Debug Info:');
    console.log('- Projects count:', projects.length);
    console.log('- Phases count:', allPhases.length);
    console.log('- Holidays loaded:', holidayStatus.loaded);
    console.log('- Holidays list:', holidayStatus.holidays);
    
    // Test working day check for some common dates
    const testDates = [
      new Date('2025-12-25'), // Christmas
      new Date('2025-01-01'), // New Year
      new Date('2025-12-21'), // Saturday
      new Date('2025-12-22'), // Sunday
      new Date('2025-12-23'), // Monday
    ];
    
    console.log('🔍 Working day tests:');
    testDates.forEach(date => {
      const isWorking = ProjectScheduler.isWorkingDay ? ProjectScheduler.isWorkingDay(date) : 'Method not available';
      console.log(`${date.toDateString()}: ${isWorking}`);
    });
    
    toast({
      title: "Debug Info Logged",
      description: "Check the browser console for detailed scheduling debug information.",
    });
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
  const isFormVisible = showAddForm || !!projectToEdit;

  if (isFormVisible) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <ProjectForm
            projectToEdit={projectToEdit}
            onSubmit={handleFormSubmit}
            onCancel={handleCancelForm}
            isSubmitting={isAddingProject || isUpdatingProject}
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
            <div className="flex gap-2">
              <Button 
                onClick={handleDebugScheduling} 
                variant="outline" 
                size="sm"
                className="flex items-center gap-2"
              >
                <Bug className="h-4 w-4" />
                Debug
              </Button>
              <Button 
                onClick={handleRecalculateAll} 
                variant="outline" 
                size="sm"
                disabled={isRecalculating || isUpdatingProject}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isRecalculating ? 'animate-spin' : ''}`} />
                {isRecalculating ? 'Recalculating...' : 'Recalculate Dates'}
              </Button>
              <Button onClick={handleAddProjectClick} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Project
              </Button>
            </div>
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
                <Button onClick={handleAddProjectClick} className="flex items-center gap-2">
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
                    onEdit={handleEditProjectClick}
                    onDelete={deleteProject}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="list" className="space-y-6">
            <ProjectListView projects={projects} onEdit={handleEditProjectClick} onDelete={deleteProject} />
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
