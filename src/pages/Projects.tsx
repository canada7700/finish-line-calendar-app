
import { useState } from "react";
import { useProjects } from "@/hooks/useProjects";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import ProjectCard from "@/components/ProjectCard";
import ProjectListView from "@/components/ProjectListView";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ProjectForm from "@/components/ProjectForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Project } from "@/types/project";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectScheduler } from "@/utils/projectScheduler";
import { toast } from "@/hooks/use-toast";

const ProjectsPage = () => {
  const { projects, isLoading, addProject, updateProject, deleteProject, isAddingProject, isUpdatingProject } = useProjects();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleAddProject = () => {
    setSelectedProject(null);
    setIsFormOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setIsFormOpen(true);
  };
  
  const handleDeleteProject = (projectId: string) => {
    deleteProject(projectId);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedProject(null);
  };

  const handleFormSubmit = async (projectData: Omit<Project, 'id'> | Project) => {
    const isEditing = 'id' in projectData;

    try {
      const calculatedProject = await ProjectScheduler.calculateProjectDates(projectData as Project);

      if (isEditing) {
        handleFormClose();
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
        addProject(projectWithoutId, {
          onSuccess: (newProject: any) => {
            // Transform the returned data to match our Project interface
            const createdProject: Project = {
              id: newProject.id,
              jobName: newProject.job_name,
              jobDescription: newProject.job_description,
              millworkHrs: newProject.millwork_hrs,
              boxConstructionHrs: newProject.box_construction_hrs,
              stainHrs: newProject.stain_hrs,
              installHrs: newProject.install_hrs,
              installDate: newProject.install_date,
              materialOrderDate: newProject.material_order_date,
              boxToekickAssemblyDate: newProject.box_toekick_assembly_date,
              millingFillersDate: newProject.milling_fillers_date,
              stainLacquerDate: newProject.stain_lacquer_date,
              millworkStartDate: newProject.millwork_start_date,
              boxConstructionStartDate: newProject.box_construction_start_date,
              stainStartDate: newProject.stain_start_date,
              status: newProject.status as Project['status']
            };

            // Automatically open edit mode to assign team members
            setSelectedProject(createdProject);
            toast({ 
              title: "Project Created", 
              description: "Project created successfully! Now you can assign team members to phases." 
            });
          },
          onError: (error) => {
            handleFormClose();
            toast({ title: "Creation Failed", description: `Could not create project: ${error.message}`, variant: "destructive" });
          }
        });
      }
    } catch (error) {
      console.error("Error submitting form", error);
      toast({ title: "Error", description: `An error occurred during date calculation.`, variant: "destructive" });
    }
  };

  return (
    <main className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Projects</h1>
        <Button onClick={handleAddProject}>
          <Plus className="mr-2 h-4 w-4" />
          Add Project
        </Button>
      </div>

      <Tabs defaultValue="card">
        <TabsList>
          <TabsTrigger value="card">Card View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>
        <TabsContent value="card">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-64" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} onEdit={handleEditProject} onDelete={handleDeleteProject} />
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="list">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <ProjectListView projects={projects} onEdit={handleEditProject} onDelete={handleDeleteProject} />
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedProject ? "Edit Project" : "Add New Project"}</DialogTitle>
          </DialogHeader>
          <ProjectForm
            projectToEdit={selectedProject}
            onSubmit={handleFormSubmit}
            onCancel={handleFormClose}
            isSubmitting={isAddingProject || isUpdatingProject}
          />
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default ProjectsPage;
