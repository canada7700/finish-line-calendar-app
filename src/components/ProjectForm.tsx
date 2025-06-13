
import { useState } from 'react';
import { Project } from '../types/project';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ProjectFormProps {
  onSubmit: (project: Omit<Project, 'id'>) => void;
  onCancel: () => void;
}

const ProjectForm = ({ onSubmit, onCancel }: ProjectFormProps) => {
  const [formData, setFormData] = useState({
    jobName: '',
    jobDescription: '',
    shopHrs: 0,
    stainHrs: 0,
    installHrs: 0,
    installDate: '',
  });

  const [installDate, setInstallDate] = useState<Date>();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!installDate) return;

    onSubmit({
      ...formData,
      installDate: format(installDate, 'yyyy-MM-dd'),
      status: 'planning' as const,
    });
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
        <CardTitle>Add New Project</CardTitle>
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
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {installDate ? format(installDate, "PPP") : <span>Pick install date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={installDate}
                  onSelect={setInstallDate}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              Add Project
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProjectForm;
