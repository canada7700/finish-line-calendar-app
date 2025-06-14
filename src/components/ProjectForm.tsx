
import { useState, useEffect } from 'react';
import { Project } from '../types/project';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, AlertTriangle } from 'lucide-react';
import { format, isWeekend } from 'date-fns';
import { cn } from '@/lib/utils';
import { ProjectScheduler } from '../utils/projectScheduler';

interface ProjectFormProps {
  onSubmit: (project: Omit<Project, 'id'> | Project) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  projectToEdit?: Project | null;
}

const ProjectForm = ({ onSubmit, onCancel, isSubmitting = false, projectToEdit = null }: ProjectFormProps) => {
  const isEditing = !!projectToEdit;

  const [formData, setFormData] = useState({
    jobName: '',
    jobDescription: '',
    shopHrs: 0,
    stainHrs: 0,
    installHrs: 0,
  });

  const [installDate, setInstallDate] = useState<Date>();
  const [dateWarning, setDateWarning] = useState<string>('');

  useEffect(() => {
    if (isEditing && projectToEdit) {
      setFormData({
        jobName: projectToEdit.jobName,
        jobDescription: projectToEdit.jobDescription,
        shopHrs: projectToEdit.shopHrs,
        stainHrs: projectToEdit.stainHrs,
        installHrs: projectToEdit.installHrs,
      });
      if (projectToEdit.installDate) {
        // By appending 'T00:00:00', we tell the Date constructor to parse the date
        // in the local timezone, which prevents it from shifting to the previous day.
        setInstallDate(new Date(`${projectToEdit.installDate}T00:00:00`));
      }
      setDateWarning('');
    } else {
      // Reset form when not editing
      setFormData({
        jobName: '',
        jobDescription: '',
        shopHrs: 0,
        stainHrs: 0,
        installHrs: 0,
      });
      setInstallDate(undefined);
      setDateWarning('');
    }
  }, [projectToEdit, isEditing]);

  const handleInstallDateSelect = async (date: Date | undefined) => {
    setInstallDate(date);
    setDateWarning('');
    
    if (date) {
      // Load holidays first
      await ProjectScheduler.loadHolidays();
      
      // Validate the selected date
      const validation = ProjectScheduler.validateWorkingDay(date);
      
      if (!validation.isValid && validation.suggestedDate) {
        const reason = isWeekend(date) ? 'weekend' : 'holiday';
        setDateWarning(
          `Selected date is a ${reason}. Consider ${format(validation.suggestedDate, 'MMMM do, yyyy')} instead.`
        );
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!installDate) return;

    const baseProjectData = {
        ...formData,
        installDate: format(installDate, 'yyyy-MM-dd'),
    };
    
    if (isEditing && projectToEdit) {
        onSubmit({
            ...projectToEdit,
            ...baseProjectData
        });
    } else {
        onSubmit({
            ...baseProjectData,
            status: 'planning' as const,
        });
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Project' : 'Add New Project'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jobName">Job Name</Label>
              <Input
                id="jobName"
                value={formData.jobName}
                onChange={(e) => handleInputChange('jobName', e.target.value)}
                placeholder="e.g., RACHEL WARKENTIN"
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jobDescription">Job Description</Label>
              <Input
                id="jobDescription"
                value={formData.jobDescription}
                onChange={(e) => handleInputChange('jobDescription', e.target.value)}
                placeholder="e.g., CABINETS"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shopHrs">Shop Hours</Label>
              <Input
                id="shopHrs"
                type="number"
                min="0"
                value={formData.shopHrs}
                onChange={(e) => handleInputChange('shopHrs', parseInt(e.target.value) || 0)}
                placeholder="183"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stainHrs">Stain Hours</Label>
              <Input
                id="stainHrs"
                type="number"
                min="0"
                value={formData.stainHrs}
                onChange={(e) => handleInputChange('stainHrs', parseInt(e.target.value) || 0)}
                placeholder="80"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="installHrs">Install Hours</Label>
              <Input
                id="installHrs"
                type="number"
                min="0"
                value={formData.installHrs}
                onChange={(e) => handleInputChange('installHrs', parseInt(e.target.value) || 0)}
                placeholder="102"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Install Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !installDate && "text-muted-foreground"
                  )}
                  disabled={isSubmitting}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {installDate ? format(installDate, "PPP") : <span>Pick install date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={installDate}
                  onSelect={handleInstallDateSelect}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            
            {dateWarning && (
              <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-800">{dateWarning}</span>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? (isEditing ? 'Saving...' : 'Adding...') : (isEditing ? 'Save Changes' : 'Add Project')}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel} 
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProjectForm;
