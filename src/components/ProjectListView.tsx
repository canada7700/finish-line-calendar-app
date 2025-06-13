
import { useState } from 'react';
import { Project } from '../types/project';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown, Trash2 } from 'lucide-react';

interface ProjectListViewProps {
  projects: Project[];
  onDelete?: (projectId: string) => void;
}

type SortField = 'jobName' | 'installDate' | 'totalHours' | 'status';
type SortDirection = 'asc' | 'desc';

const ProjectListView = ({ projects, onDelete }: ProjectListViewProps) => {
  const [sortField, setSortField] = useState<SortField>('installDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleDelete = (projectId: string) => {
    if (onDelete && confirm('Are you sure you want to delete this project?')) {
      onDelete(projectId);
    }
  };

  const sortedProjects = [...projects].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortField) {
      case 'jobName':
        aValue = a.jobName.toLowerCase();
        bValue = b.jobName.toLowerCase();
        break;
      case 'installDate':
        aValue = new Date(a.installDate);
        bValue = new Date(b.installDate);
        break;
      case 'totalHours':
        aValue = a.shopHrs + a.stainHrs + a.installHrs;
        bValue = b.shopHrs + b.stainHrs + b.installHrs;
        break;
      case 'status':
        aValue = a.status;
        bValue = b.status;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) {
      return sortDirection === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortDirection === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const getStatusBadgeVariant = (status: Project['status']) => {
    switch (status) {
      case 'planning':
        return 'secondary';
      case 'shop':
        return 'default';
      case 'stain':
        return 'outline';
      case 'install':
        return 'outline';
      case 'completed':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="bg-card rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort('jobName')}
                className="h-auto p-0 font-medium hover:bg-transparent"
              >
                Project Name
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>Description</TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort('status')}
                className="h-auto p-0 font-medium hover:bg-transparent"
              >
                Status
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort('installDate')}
                className="h-auto p-0 font-medium hover:bg-transparent"
              >
                Install Date
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort('totalHours')}
                className="h-auto p-0 font-medium hover:bg-transparent"
              >
                Total Hours
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>Shop Hours</TableHead>
            <TableHead>Stain Hours</TableHead>
            <TableHead>Install Hours</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedProjects.map((project) => (
            <TableRow key={project.id} className="hover:bg-muted/50">
              <TableCell className="font-medium">{project.jobName}</TableCell>
              <TableCell className="max-w-xs truncate">{project.jobDescription}</TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(project.status)}>
                  {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                </Badge>
              </TableCell>
              <TableCell>{formatDate(project.installDate)}</TableCell>
              <TableCell className="font-medium">
                {project.shopHrs + project.stainHrs + project.installHrs}
              </TableCell>
              <TableCell>{project.shopHrs}</TableCell>
              <TableCell>{project.stainHrs}</TableCell>
              <TableCell>{project.installHrs}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-500 hover:text-red-500 hover:bg-red-50"
                  onClick={() => handleDelete(project.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ProjectListView;
