
import { Project } from '../types/project';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Hammer, Paintbrush, Wrench } from 'lucide-react';
import { format } from 'date-fns';

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
}

const ProjectCard = ({ project, onClick }: ProjectCardProps) => {
  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'planning': return 'bg-gray-500';
      case 'shop': return 'bg-blue-500';
      case 'stain': return 'bg-amber-500';
      case 'install': return 'bg-green-500';
      case 'completed': return 'bg-emerald-600';
      default: return 'bg-gray-500';
    }
  };

  const totalHours = project.shopHrs + project.stainHrs + project.installHrs;

  return (
    <Card 
      className="hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-[1.02]"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold">{project.jobName}</CardTitle>
          <Badge className={`${getStatusColor(project.status)} text-white`}>
            {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
          </Badge>
        </div>
        <p className="text-sm text-gray-600">{project.jobDescription}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Hammer className="h-4 w-4 text-blue-600" />
            <span>{project.shopHrs}h Shop</span>
          </div>
          <div className="flex items-center gap-2">
            <Paintbrush className="h-4 w-4 text-amber-600" />
            <span>{project.stainHrs}h Stain</span>
          </div>
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-green-600" />
            <span>{project.installHrs}h Install</span>
          </div>
        </div>
        
        <div className="flex justify-between items-center pt-2 border-t">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>{totalHours}h Total</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>Install: {format(new Date(project.installDate), 'MMM dd')}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectCard;
