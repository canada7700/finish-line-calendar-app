
import { useState, useEffect } from 'react';
import { Project } from '../types/project';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, AlertTriangle, Users } from 'lucide-react';
import { format, isWeekend, subDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { ProjectScheduler } from '../utils/projectScheduler';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ProjectAssignmentManager } from './ProjectAssignmentManager';

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
    millworkHrs: 0,
    boxConstructionHrs: 0,
    stainHrs: 0,
    installHrs: 0,
  });

  const [installDate, setInstallDate] = useState<Date>();
  const [materialOrderDate, setMaterialOrderDate] = useState<Date | null>(null);
  const [dateWarning, setDateWarning] = useState<string>('');

  useEffect(() => {
    if (isEditing && projectToEdit) {
      setFormData({
        jobName: projectToEdit.jobName,
        jobDescription: projectToEdit.jobDescription,
        millworkHrs: projectToEdit.millworkHrs,
        boxConstructionHrs: projectToEdit.boxConstructionHrs,
        stainHrs: projectToEdit.stainHrs,
        installHrs: projectToEdit.installHrs,
      });
      if (projectToEdit.installDate) {
        const installD = new Date(`${projectToEdit.installDate}T00:00:00`);
        setInstallDate(installD);
        setMaterialOrderDate(subDays(installD, 60));
      }
      setDateWarning('');
    } else {
      setFormData({
        jobName: '',
        jobDescription: '',
        millworkHrs: 0,
        boxConstructionHrs: 0,
        stainHrs: 0,
        installHrs: 0,
      });
      setInstallDate(undefined);
      setMaterialOrderDate(null);
      setDateWarning('');
    }
  }, [projectToEdit, isEditing]);

  const handleInstallDateSelect = async (date: Date | undefined) => {
    setInstallDate(date);
    if (date) {
      setMaterialOrderDate(subDays(date, 60));
    } else {
      setMaterialOrderDate(null);
    }
    setDateWarning('');
    
    if (date) {
      await ProjectScheduler.loadHolidays();
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
    <div className="flex h-full max-h-[85vh]">
      {/* Left Side - Project Form */}
      <div className="w-1/3 border-r border-border pr-6">
        <div className="h-full">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="millworkHrs">Millwork Hours</Label>
                <Input
                  id="millworkHrs"
                  type="number"
                  min="0"
                  value={formData.millworkHrs}
                  onChange={(e) => handleInputChange('millworkHrs', parseInt(e.target.value) || 0)}
                  placeholder="e.g., 90"
                  disabled={isSubmitting}
                  className="bg-blue-50 border-blue-200 focus:bg-blue-50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="boxConstructionHrs">Box Construction Hours</Label>
                <Input
                  id="boxConstructionHrs"
                  type="number"
                  min="0"
                  value={formData.boxConstructionHrs}
                  onChange={(e) => handleInputChange('boxConstructionHrs', parseInt(e.target.value) || 0)}
                  placeholder="e.g., 93"
                  disabled={isSubmitting}
                  className="bg-green-50 border-green-200 focus:bg-green-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                  className="bg-orange-50 border-orange-200 focus:bg-orange-50"
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
                  className="bg-purple-50 border-purple-200 focus:bg-purple-50"
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
              
              {materialOrderDate && (
                <div className="p-3 bg-red-100 border border-red-200 rounded-md mt-2">
                  <p className="text-sm font-semibold text-red-700 text-center">
                    {formData.jobName ? `${formData.jobName} Material Order Date: ` : 'Material Order Date: '}
                    {format(materialOrderDate, 'PPP')}
                  </p>
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
        </div>
      </div>

      {/* Right Side - Assignment Manager with Independent Scroll */}
      <div className="flex-1 pl-6">
        <div className="h-full flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <Users className="h-6 w-6 text-blue-600" />
            <h3 className="text-xl font-semibold">Team Assignments</h3>
            <div className="text-sm text-muted-foreground ml-auto">
              Assign team members to project phases
            </div>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="pr-4">
              {isEditing && projectToEdit ? (
                <ProjectAssignmentManager project={projectToEdit} />
              ) : (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Assign Team Members After Creation</h4>
                      <p className="text-sm text-blue-800 mb-3">
                        Once you create this project, you'll be able to assign team members to each phase:
                      </p>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• <strong>Millwork</strong> ({formData.millworkHrs} hours)</li>
                        <li>• <strong>Box Construction</strong> ({formData.boxConstructionHrs} hours)</li>
                        <li>• <strong>Stain</strong> ({formData.stainHrs} hours)</li>
                        <li>• <strong>Install</strong> ({formData.installHrs} hours)</li>
                      </ul>
                    </div>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                      <p className="text-sm text-gray-600">
                        💡 <strong>Tip:</strong> After clicking "Add Project", this dialog will automatically switch to edit mode where you can manage team assignments for each phase.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export default ProjectForm;
