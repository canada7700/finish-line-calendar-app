
import * as React from 'react';
import { ProjectPhase, ProjectNote, DailyNote } from '../types/project';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useUpsertNote as useUpsertProjectNote } from '@/hooks/useProjectNotes';
import { useUpsertDailyNote } from '@/hooks/useDailyNotes';
import { useAddPhaseException } from '@/hooks/usePhaseExceptions';
import { AlertTriangle, Trash2, Clock, Plus } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import HourAllocationDialog from './HourAllocationDialog';
import CustomProjectDialog from './CustomProjectDialog';

interface DayDialogProps {
  date: Date | null;
  phases: ProjectPhase[];
  projectNotes: ProjectNote[];
  dailyNote?: DailyNote;
  selectedPhase?: ProjectPhase | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNoteUpdate: () => void;
}

const DayDialog = ({ date, phases, projectNotes, dailyNote, selectedPhase, open, onOpenChange, onNoteUpdate }: DayDialogProps) => {
  const [currentProjectNotes, setCurrentProjectNotes] = React.useState<Record<string, string>>({});
  const [currentDailyNote, setCurrentDailyNote] = React.useState('');
  const [showHourAllocation, setShowHourAllocation] = React.useState(false);
  const [showCustomProject, setShowCustomProject] = React.useState(false);
  const [newProjectContext, setNewProjectContext] = React.useState<{ projectId: string; phase: string } | null>(null);
  
  // All hooks must be called unconditionally at the top level
  const upsertProjectNoteMutation = useUpsertProjectNote();
  const upsertDailyNoteMutation = useUpsertDailyNote();
  const addPhaseExceptionMutation = useAddPhaseException();

  // Simplified initialization - no complex stability checks
  React.useEffect(() => {
    if (date && open) {
      try {
        console.log('🔄 Initializing DayDialog state for:', format(date, 'yyyy-MM-dd'));
        
        // Initialize project notes safely
        const initialProjectNotes: Record<string, string> = {};
        if (Array.isArray(projectNotes)) {
          projectNotes.forEach(note => {
            if (note?.project_id && typeof note.note === 'string') {
              initialProjectNotes[note.project_id] = note.note;
            }
          });
        }
        
        setCurrentProjectNotes(initialProjectNotes);
        setCurrentDailyNote(dailyNote?.note || '');
        
        console.log('✅ DayDialog state initialized successfully');
      } catch (error) {
        console.error('❌ Error initializing DayDialog state:', error);
        // Set safe defaults on error
        setCurrentProjectNotes({});
        setCurrentDailyNote('');
      }
    }
  }, [date, projectNotes, dailyNote, open]);

  // Reset state when dialog closes
  React.useEffect(() => {
    if (!open) {
      setCurrentProjectNotes({});
      setCurrentDailyNote('');
      setNewProjectContext(null);
    }
  }, [open]);

  // Create projects map - this must be called unconditionally
  const projectsOnDay = React.useMemo(() => {
    // Always call useMemo, but return empty array if invalid conditions
    if (!date || !Array.isArray(phases)) {
      return [];
    }
    
    try {
      const projectMap = new Map();
      
      phases.forEach(phase => {
        try {
          if (!phase?.projectId || !phase?.projectName) {
            return; // Skip invalid phases
          }
          
          // Create safe phase object with all required properties
          const safePhase = {
            id: phase.id || `${phase.projectId}-${phase.phase || 'unknown'}`,
            projectId: phase.projectId,
            projectName: phase.projectName,
            phase: phase.phase || 'millwork',
            startDate: phase.startDate || format(date, 'yyyy-MM-dd'),
            endDate: phase.endDate || format(date, 'yyyy-MM-dd'),
            hours: typeof phase.hours === 'number' ? phase.hours : 0,
            color: phase.color || 'bg-blue-500'
          };
          
          projectMap.set(phase.projectId, safePhase);
        } catch (phaseError) {
          console.error('❌ Error processing phase:', phaseError, phase);
        }
      });
      
      return Array.from(projectMap.values());
    } catch (error) {
      console.error('❌ Error getting projects for day:', error);
      return [];
    }
  }, [phases, date]); // Simplified dependencies

  // Early return for invalid state - but after all hooks have been called
  if (!date) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[625px]">
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Invalid date</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const handleProjectNoteChange = (projectId: string, value: string) => {
    setCurrentProjectNotes(prev => ({ ...prev, [projectId]: value }));
  };
  
  const handleSaveNotes = async () => {
    if (!date) return;
    
    try {
      console.log('💾 Saving notes...');
      const dateString = format(date, 'yyyy-MM-dd');
      
      const projectNotePromises = Object.entries(currentProjectNotes).map(([projectId, note]) => {
        const originalNote = projectNotes.find(n => n.project_id === projectId);
        // Upsert only if note has changed or is new
        if (note !== (originalNote?.note || '')) {
          return upsertProjectNoteMutation.mutateAsync({
            project_id: projectId,
            date: dateString,
            note: note,
          });
        }
        return Promise.resolve();
      });

      const dailyNotePromise = (currentDailyNote !== (dailyNote?.note || '')) 
        ? upsertDailyNoteMutation.mutateAsync({
            date: dateString,
            note: currentDailyNote,
          })
        : Promise.resolve();

      await Promise.all([...projectNotePromises, dailyNotePromise]);
      console.log('✅ Notes saved successfully');
      onNoteUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error('❌ Error saving notes:', error);
    }
  };

  const handlePhaseDelete = async (phaseToDelete: ProjectPhase) => {
    if (!date) return;
    
    try {
      console.log('🗑️ Deleting phase:', phaseToDelete);
      await addPhaseExceptionMutation.mutateAsync({
        project_id: phaseToDelete.projectId,
        phase: phaseToDelete.phase,
        date: format(date, 'yyyy-MM-dd'),
      });
      console.log('✅ Phase deleted successfully');
      onNoteUpdate();
    } catch (error) {
      console.error('❌ Error deleting phase:', error);
    }
  };

  const handleCustomProjectCreated = (projectId: string, phase: string) => {
    console.log('🎯 Custom project created:', { projectId, phase });
    setNewProjectContext({ projectId, phase });
    onNoteUpdate();
    
    // Add a delay to allow data to refresh before opening the dialog
    setTimeout(() => {
      setShowHourAllocation(true);
    }, 500);
  };

  // Create a proper ProjectPhase object for the new project context
  const getInitialProjectPhase = (): ProjectPhase | null => {
    try {
      if (selectedPhase) {
        console.log('🎯 Using selected phase:', selectedPhase);
        return selectedPhase;
      }
      
      if (newProjectContext) {
        console.log('🎯 Using new project context:', newProjectContext);
        // Find the project phase from the phases array
        const projectPhase = phases.find(p => 
          p.projectId === newProjectContext.projectId && 
          p.phase === newProjectContext.phase
        );
        
        if (projectPhase) {
          return projectPhase;
        }
        
        // If not found in phases (newly created project), create a minimal phase object
        const projectFromPhases = phases.find(p => p.projectId === newProjectContext.projectId);
        if (projectFromPhases) {
          return {
            ...projectFromPhases,
            phase: newProjectContext.phase as 'millwork' | 'boxConstruction' | 'stain' | 'install',
            id: `${newProjectContext.projectId}-${newProjectContext.phase}`,
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error getting initial project phase:', error);
      return null;
    }
  };

  const isSaving = upsertProjectNoteMutation.isPending || upsertDailyNoteMutation.isPending;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Details for {format(date, 'MMMM d, yyyy')}</DialogTitle>
            <DialogDescription>
              View scheduled phases, manage hour allocations, and add notes for projects or the day in general.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {/* Hour Allocation and Custom Project Management Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={() => setShowHourAllocation(true)}
                className="flex items-center gap-2"
                variant="outline"
              >
                <Clock className="h-4 w-4" />
                Manage Hour Allocations
              </Button>
              <Button 
                onClick={() => setShowCustomProject(true)}
                className="flex items-center gap-2"
                variant="outline"
              >
                <Plus className="h-4 w-4" />
                Create Custom Project
              </Button>
            </div>

            <Separator className="my-4" />

            <div>
              <label htmlFor={`note-daily`} className="text-sm font-medium text-muted-foreground mb-1 block">General Note for Day</label>
              <Textarea
                id={`note-daily`}
                placeholder={`Add a general note for this day...`}
                value={currentDailyNote}
                onChange={(e) => setCurrentDailyNote(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          
            {projectsOnDay.length > 0 && <Separator className="my-4" />}

            {projectsOnDay.length > 0 ? (
              projectsOnDay.map(project => {
                // Get phases for this project safely
                const projectPhases = Array.isArray(phases) 
                  ? phases.filter(p => p?.projectId === project.projectId)
                  : [];
                
                return (
                  <div key={project.projectId} className="p-4 border rounded-lg">
                    <h4 className="font-semibold text-lg mb-2">
                      {project.projectName || `Project ${project.projectId}`}
                    </h4>
                    <div className="space-y-2 mb-3">
                      {projectPhases.map(phase => (
                        <div key={phase.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                          <div className="flex items-center gap-2">
                            <span className={`h-3 w-3 rounded-full ${phase.color}`}></span>
                            <span className="font-medium">{phase.phase.toUpperCase()}</span>
                            <span className="text-sm text-muted-foreground">({phase.hours}h)</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => handlePhaseDelete(phase)}
                            disabled={addPhaseExceptionMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div>
                      <label htmlFor={`note-${project.projectId}`} className="text-sm font-medium text-muted-foreground mb-1 block">
                        Notes for {project.projectName || `Project ${project.projectId}`}
                      </label>
                      <Textarea
                        id={`note-${project.projectId}`}
                        placeholder={`Add a project-specific note for this day...`}
                        value={currentProjectNotes[project.projectId] || ''}
                        onChange={(e) => handleProjectNoteChange(project.projectId, e.target.value)}
                        className="min-h-[80px]"
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-muted-foreground text-center py-4">No projects scheduled for this day.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSaveNotes} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Notes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <HourAllocationDialog
        date={date}
        phases={phases}
        initialProjectPhase={getInitialProjectPhase()}
        open={showHourAllocation}
        onOpenChange={(open) => {
          setShowHourAllocation(open);
          if (!open) {
            setNewProjectContext(null);
          }
        }}
      />

      <CustomProjectDialog
        date={date}
        open={showCustomProject}
        onOpenChange={setShowCustomProject}
        onProjectCreated={handleCustomProjectCreated}
      />
    </>
  );
};

export default DayDialog;
