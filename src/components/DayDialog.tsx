
import * as React from 'react';
import { ProjectPhase, ProjectNote, DailyNote, ProjectAssignment } from '../types/project';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useUpsertNote as useUpsertProjectNote } from '@/hooks/useProjectNotes';
import { useUpsertDailyNote } from '@/hooks/useDailyNotes';
import { useAddPhaseException } from '@/hooks/usePhaseExceptions';
import { useAssignmentsByDateRange } from '@/hooks/useAssignmentsByDateRange';
import { AlertTriangle, Trash2, Users, ChevronDown, ChevronRight } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import PhaseAssignmentRow from './PhaseAssignmentRow';

interface DayDialogProps {
  date: Date | null;
  phases: ProjectPhase[];
  projectNotes: ProjectNote[];
  dailyNote?: DailyNote;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNoteUpdate: () => void;
}

const DayDialog = ({ date, phases, projectNotes, dailyNote, open, onOpenChange, onNoteUpdate }: DayDialogProps) => {
  const [currentProjectNotes, setCurrentProjectNotes] = React.useState<Record<string, string>>({});
  const [currentDailyNote, setCurrentDailyNote] = React.useState('');
  const [expandedProjects, setExpandedProjects] = React.useState<Set<string>>(new Set());
  
  const upsertProjectNoteMutation = useUpsertProjectNote();
  const upsertDailyNoteMutation = useUpsertDailyNote();
  const addPhaseExceptionMutation = useAddPhaseException();

  // Fetch assignments for the selected date
  const { data: assignments = [], refetch: refetchAssignments } = useAssignmentsByDateRange(
    date || new Date(),
    date || new Date()
  );

  React.useEffect(() => {
    if (date) {
      const initialProjectNotes: Record<string, string> = {};
      projectNotes.forEach(note => {
        initialProjectNotes[note.project_id] = note.note;
      });
      setCurrentProjectNotes(initialProjectNotes);
      setCurrentDailyNote(dailyNote?.note || '');
    }
  }, [date, projectNotes, dailyNote, open]);

  if (!date) return null;

  const projectsOnDay = Array.from(new Map(phases.map(p => [p.projectId, p])).values());

  const getAssignmentsForPhase = (projectId: string, phase: string): ProjectAssignment[] => {
    const dateString = format(date, 'yyyy-MM-dd');
    return assignments.filter(assignment => 
      assignment.projectId === projectId && 
      assignment.phase === phase &&
      assignment.startDate === dateString
    );
  };

  const getTotalAssignedHours = (projectId: string, phase: string): number => {
    return getAssignmentsForPhase(projectId, phase)
      .reduce((total, assignment) => total + assignment.assignedHours, 0);
  };

  const getPhaseUtilization = (projectId: string, phase: string, totalHours: number): number => {
    const assignedHours = getTotalAssignedHours(projectId, phase);
    return totalHours > 0 ? (assignedHours / totalHours) * 100 : 0;
  };

  const toggleProjectExpansion = (projectId: string) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  const handleProjectNoteChange = (projectId: string, value: string) => {
    setCurrentProjectNotes(prev => ({ ...prev, [projectId]: value }));
  };
  
  const handleSaveNotes = async () => {
    if (!date) return;
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
    onNoteUpdate();
    onOpenChange(false);
  };

  const handlePhaseDelete = async (phaseToDelete: ProjectPhase) => {
    if (!date) return;
    
    await addPhaseExceptionMutation.mutateAsync({
      project_id: phaseToDelete.projectId,
      phase: phaseToDelete.phase,
      date: format(date, 'yyyy-MM-dd'),
    });
    onNoteUpdate();
  };

  const handleAssignmentUpdate = () => {
    refetchAssignments();
    onNoteUpdate();
  };

  const isSaving = upsertProjectNoteMutation.isPending || upsertDailyNoteMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Details for {format(date, 'MMMM d, yyyy')}</DialogTitle>
          <DialogDescription>
            View scheduled phases, manage team assignments, and add notes for projects or the day in general.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
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
              const projectPhases = phases.filter(p => p.projectId === project.projectId);
              const isExpanded = expandedProjects.has(project.projectId);
              
              return (
                <div key={project.projectId} className="border rounded-lg overflow-hidden">
                  <Collapsible open={isExpanded} onOpenChange={() => toggleProjectExpansion(project.projectId)}>
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            <h4 className="font-semibold text-lg">{project.projectName}</h4>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>{projectPhases.length} phases</span>
                          </div>
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <div className="px-4 pb-4 space-y-4">
                        {projectPhases.map(phase => {
                          const phaseAssignments = getAssignmentsForPhase(project.projectId, phase.phase);
                          const totalAssignedHours = getTotalAssignedHours(project.projectId, phase.phase);
                          const utilization = getPhaseUtilization(project.projectId, phase.phase, phase.hours);
                          
                          return (
                            <div key={phase.id} className="border rounded-md overflow-hidden">
                              <div className="flex items-center justify-between p-3 bg-muted/20">
                                <div className="flex items-center gap-3">
                                  <span className={`h-3 w-3 rounded-full ${phase.color}`}></span>
                                  <span className="font-medium">{phase.phase.toUpperCase()}</span>
                                  <span className="text-sm text-muted-foreground">
                                    {totalAssignedHours}/{phase.hours}h assigned
                                  </span>
                                  <Progress value={utilization} className="w-20 h-2" />
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
                              
                              {phaseAssignments.length > 0 && (
                                <div className="p-3 space-y-2 bg-background">
                                  <div className="text-sm font-medium text-muted-foreground mb-2">
                                    Team Assignments ({phaseAssignments.length})
                                  </div>
                                  {phaseAssignments.map(assignment => (
                                    <PhaseAssignmentRow
                                      key={assignment.id}
                                      assignment={assignment}
                                      onUpdate={handleAssignmentUpdate}
                                    />
                                  ))}
                                </div>
                              )}
                              
                              {phaseAssignments.length === 0 && (
                                <div className="p-3 text-center text-sm text-muted-foreground bg-background">
                                  No team members assigned to this phase
                                </div>
                              )}
                            </div>
                          );
                        })}
                        
                        <div className="mt-4">
                          <label htmlFor={`note-${project.projectId}`} className="text-sm font-medium text-muted-foreground mb-1 block">
                            Notes for {project.projectName}
                          </label>
                          <Textarea
                            id={`note-${project.projectId}`}
                            placeholder={`Add a project-specific note for this day...`}
                            value={currentProjectNotes[project.projectId] || ''}
                            onChange={(e) => handleProjectNoteChange(project.projectId, e.target.value)}
                            className="min-h-[60px]"
                          />
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
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
  );
};

export default DayDialog;
