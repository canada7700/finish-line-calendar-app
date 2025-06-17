
import * as React from 'react';
import { ProjectPhase, ProjectNote, DailyNote } from '../types/project';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useUpsertNote as useUpsertProjectNote } from '@/hooks/useProjectNotes';
import { useUpsertDailyNote } from '@/hooks/useDailyNotes';
import { useAddPhaseException } from '@/hooks/usePhaseExceptions';
import { AlertTriangle, Trash2, Clock } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import HourAllocationDialog from './HourAllocationDialog';

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
  const [showHourAllocation, setShowHourAllocation] = React.useState(false);
  const upsertProjectNoteMutation = useUpsertProjectNote();
  const upsertDailyNoteMutation = useUpsertDailyNote();
  const addPhaseExceptionMutation = useAddPhaseException();

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
            {/* Hour Allocation Management Button */}
            <div className="flex justify-between items-center">
              <Button 
                onClick={() => setShowHourAllocation(true)}
                className="flex items-center gap-2"
                variant="outline"
              >
                <Clock className="h-4 w-4" />
                Manage Hour Allocations
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
              projectsOnDay.map(project => (
                <div key={project.projectId} className="p-4 border rounded-lg">
                  <h4 className="font-semibold text-lg mb-2">{project.projectName}</h4>
                  <div className="space-y-2 mb-3">
                    {phases.filter(p => p.projectId === project.projectId).map(phase => (
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
                    <label htmlFor={`note-${project.projectId}`} className="text-sm font-medium text-muted-foreground mb-1 block">Notes for {project.projectName}</label>
                    <Textarea
                      id={`note-${project.projectId}`}
                      placeholder={`Add a project-specific note for this day...`}
                      value={currentProjectNotes[project.projectId] || ''}
                      onChange={(e) => handleProjectNoteChange(project.projectId, e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>
                </div>
              ))
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
        open={showHourAllocation}
        onOpenChange={setShowHourAllocation}
      />
    </>
  );
};

export default DayDialog;
