
import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useProjects } from '@/hooks/useProjects';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

interface CustomProjectDialogProps {
  date: Date | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectCreated: (projectId: string, phase: string) => void;
}

const CustomProjectDialog = ({ date, open, onOpenChange, onProjectCreated }: CustomProjectDialogProps) => {
  const [jobName, setJobName] = React.useState('');
  const [phase, setPhase] = React.useState<string>('');
  const [hours, setHours] = React.useState<number>(1);
  const { addProject, isAddingProject } = useProjects();

  React.useEffect(() => {
    if (!open) {
      // Reset form when dialog closes
      setJobName('');
      setPhase('');
      setHours(1);
    }
  }, [open]);

  if (!date) return null;

  const handleCreateProject = () => {
    if (!jobName.trim() || !phase || hours <= 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const dateString = format(date, 'yyyy-MM-dd');

    // For custom projects, set the phase-specific start date to the selected date
    const projectData = {
      jobName: jobName.trim(),
      jobDescription: `Custom project for ${format(date, 'MMMM d, yyyy')}`,
      millworkHrs: phase === 'millwork' ? hours : 0,
      boxConstructionHrs: phase === 'boxConstruction' ? hours : 0,
      stainHrs: phase === 'stain' ? hours : 0,
      installHrs: phase === 'install' ? hours : 0,
      installDate: phase === 'install' ? dateString : null,
      materialOrderDate: null,
      boxToekickAssemblyDate: null,
      millingFillersDate: null,
      stainLacquerDate: null,
      millworkStartDate: phase === 'millwork' ? dateString : null,
      boxConstructionStartDate: phase === 'boxConstruction' ? dateString : null,
      stainStartDate: phase === 'stain' ? dateString : null,
      status: 'custom' as const
    };

    addProject(projectData, {
      onSuccess: (data) => {
        toast({
          title: "Custom Project Created",
          description: `"${jobName}" has been created for ${format(date, 'MMMM d, yyyy')}`,
        });
        onOpenChange(false);
        onProjectCreated(data.id, phase);
      },
      onError: (error) => {
        console.error('Failed to create custom project:', error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Custom Project</DialogTitle>
          <DialogDescription>
            Quickly book a custom project for {date && format(date, 'MMMM d, yyyy')}. Perfect for walk-in customers or one-off jobs.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="jobName">Job Name</Label>
            <Input
              id="jobName"
              placeholder="e.g., John Smith - Kitchen Repair"
              value={jobName}
              onChange={(e) => setJobName(e.target.value)}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="phase">Phase Type</Label>
            <Select value={phase} onValueChange={setPhase}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select phase type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="millwork">Millwork</SelectItem>
                <SelectItem value="boxConstruction">Box Construction</SelectItem>
                <SelectItem value="stain">Stain</SelectItem>
                <SelectItem value="install">Install</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="hours">Hours Needed</Label>
            <Input
              id="hours"
              type="number"
              min="1"
              max="24"
              value={hours}
              onChange={(e) => setHours(parseInt(e.target.value) || 1)}
              className="mt-1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateProject} disabled={isAddingProject}>
            {isAddingProject ? 'Creating...' : 'Create & Assign Hours'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CustomProjectDialog;
