
import * as React from 'react';
import { ProjectPhase, ProjectNote } from '../types/project';
import { format, parseISO } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useUpsertNote } from '@/hooks/useProjectNotes';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface DayDialogProps {
  date: Date | null;
  phases: ProjectPhase[];
  notes: ProjectNote[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNoteUpdate: () => void;
}

const DayDialog = ({ date, phases, notes, open, onOpenChange, onNoteUpdate }: DayDialogProps) => {
  const [currentNotes, setCurrentNotes] = React.useState<Record<string, string>>({});
  const upsertNoteMutation = useUpsertNote();

  React.useEffect(() => {
    if (date) {
      const initialNotes: Record<string, string> = {};
      notes.forEach(note => {
        initialNotes[note.project_id] = note.note;
      });
      setCurrentNotes(initialNotes);
    }
  }, [date, notes, open]);

  if (!date) return null;

  const projectsOnDay = Array.from(new Map(phases.map(p => [p.projectId, p])).values());

  const handleNoteChange = (projectId: string, value: string) => {
    setCurrentNotes(prev => ({ ...prev, [projectId]: value }));
  };
  
  const handleSaveNotes = async () => {
    if (!date) return;
    const dateString = format(date, 'yyyy-MM-dd');
    
    const notePromises = Object.entries(currentNotes).map(([projectId, note]) => {
      return upsertNoteMutation.mutateAsync({
        project_id: projectId,
        date: dateString,
        note: note,
      });
    });

    await Promise.all(notePromises);
    onNoteUpdate();
    onOpenChange(false);
  };

  const handlePhaseDelete = (phaseId: string) => {
      alert("As mentioned, deleting phases is not possible right now because a core scheduling file is read-only. This button is a placeholder for when that capability is enabled.");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Details for {format(date, 'MMMM d, yyyy')}</DialogTitle>
          <DialogDescription>
            View scheduled phases and add notes for projects on this day.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
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
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handlePhaseDelete(phase.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div>
                  <label htmlFor={`note-${project.projectId}`} className="text-sm font-medium text-muted-foreground mb-1 block">Notes for {project.projectName}</label>
                  <Textarea
                    id={`note-${project.projectId}`}
                    placeholder={`Add a note for this project on this day...`}
                    value={currentNotes[project.projectId] || ''}
                    onChange={(e) => handleNoteChange(project.projectId, e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-center py-8">No projects scheduled for this day.</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSaveNotes} disabled={upsertNoteMutation.isPending}>
            {upsertNoteMutation.isPending ? 'Saving...' : 'Save Notes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DayDialog;
