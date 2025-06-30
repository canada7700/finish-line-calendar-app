
import React, { useState, useEffect } from 'react';
import { Project } from '../types/project';
import { ProjectScheduler } from '../utils/projectScheduler';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Save, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import ProjectAssignmentManager from './ProjectAssignmentManager';

interface ProjectFormProps {
  projectToEdit?: Project | null;
  onSubmit: (project: Omit<Project, 'id'> | Project) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ projectToEdit, onSubmit, onCancel, isSubmitting = false }) => {
  const [formData, setFormData] = useState<Omit<Project, 'id'>>({
    jobName: '',
    jobDescription: '',
    millworkHrs: 0,
    boxConstructionHrs: 0,
    stainHrs: 0,
    installHrs: 0,
    installDate: '',
    status: 'planning',
    materialOrderDate: undefined,
    boxToekickAssemblyDate: undefined,
    millingFillersDate: undefined,
    stainLacquerDate: undefined,
    millworkStartDate: undefined,
    boxConstructionStartDate: undefined,
    stainStartDate: undefined,
  });

  const [installDateOpen, setInstallDateOpen] = useState(false);

  useEffect(() => {
    if (projectToEdit) {
      setFormData({
        jobName: projectToEdit.jobName,
        jobDescription: projectToEdit.jobDescription,
        millworkHrs: projectToEdit.millworkHrs,
        boxConstructionHrs: projectToEdit.boxConstructionHrs,
        stainHrs: projectToEdit.stainHrs,
        installHrs: projectToEdit.installHrs,
        installDate: projectToEdit.installDate,
        status: projectToEdit.status,
        materialOrderDate: projectToEdit.materialOrderDate,
        boxToekickAssemblyDate: projectToEdit.boxToekickAssemblyDate,
        millingFillersDate: projectToEdit.millingFillersDate,
        stainLacquerDate: projectToEdit.stainLacquerDate,
        millworkStartDate: projectToEdit.millworkStartDate,
        boxConstructionStartDate: projectToEdit.boxConstructionStartDate,
        stainStartDate: projectToEdit.stainStartDate,
      });
    }
  }, [projectToEdit]);

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleInstallDateSelect = (date: Date | undefined) => {
    if (date) {
      const dateString = format(date, 'yyyy-MM-dd');
      
      // Validate that the selected date is a working day
      if (!ProjectScheduler.validateWorkingDay(date)) {
        toast({
          title: "Invalid Install Date",
          description: "Install date must be a working day (Monday-Friday, excluding holidays).",
          variant: "destructive",
        });
        return;
      }
      
      handleInputChange('installDate', dateString);
      setInstallDateOpen(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.jobName.trim()) {
      toast({
        title: "Validation Error",
        description: "Job name is required.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.installDate) {
      toast({
        title: "Validation Error",
        description: "Install date is required.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (projectToEdit) {
        await onSubmit({ ...formData, id: projectToEdit.id });
      } else {
        await onSubmit(formData);
      }
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const isEditing = !!projectToEdit;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{isEditing ? 'Edit Project' : 'Add New Project'}</h2>
        <Button variant="outline" onClick={onCancel} className="flex items-center gap-2">
          <X className="h-4 w-4" />
          Cancel
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Project Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="jobName">Job Name *</Label>
                    <Input
                      id="jobName"
                      value={formData.jobName}
                      onChange={(e) => handleInputChange('jobName', e.target.value)}
                      placeholder="Enter job name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planning">Planning</SelectItem>
                        <SelectItem value="shop">In Shop</SelectItem>
                        <SelectItem value="stain">Staining</SelectItem>
                        <SelectItem value="install">Installing</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="jobDescription">Job Description</Label>
                  <Textarea
                    id="jobDescription"
                    value={formData.jobDescription}
                    onChange={(e) => handleInputChange('jobDescription', e.target.value)}
                    placeholder="Enter job description"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Phase Hours */}
            <Card>
              <CardHeader>
                <CardTitle>Phase Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="millworkHrs">Millwork Hours</Label>
                    <Input
                      id="millworkHrs"
                      type="number"
                      min="0"
                      value={formData.millworkHrs}
                      onChange={(e) => handleInputChange('millworkHrs', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="boxConstructionHrs">Box Construction Hours</Label>
                    <Input
                      id="boxConstructionHrs"
                      type="number"
                      min="0"
                      value={formData.boxConstructionHrs}
                      onChange={(e) => handleInputChange('boxConstructionHrs', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="stainHrs">Stain Hours</Label>
                    <Input
                      id="stainHrs"
                      type="number"
                      min="0"
                      value={formData.stainHrs}
                      onChange={(e) => handleInputChange('stainHrs', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="installHrs">Install Hours</Label>
                    <Input
                      id="installHrs"
                      type="number"
                      min="0"
                      value={formData.installHrs}
                      onChange={(e) => handleInputChange('installHrs', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Install Date */}
            <Card>
              <CardHeader>
                <CardTitle>Install Date</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label>Install Date *</Label>
                  <Popover open={installDateOpen} onOpenChange={setInstallDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal mt-2",
                          !formData.installDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.installDate ? format(parseISO(formData.installDate), 'PPP') : 'Select install date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.installDate ? parseISO(formData.installDate) : undefined}
                        onSelect={handleInstallDateSelect}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                {isSubmitting ? 'Saving...' : (isEditing ? 'Update Project' : 'Create Project')}
              </Button>
            </div>
          </form>
        </div>

        {/* Assignment Manager */}
        <div className="lg:col-span-1">
          {isEditing && projectToEdit && (
            <ProjectAssignmentManager project={projectToEdit} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectForm;
