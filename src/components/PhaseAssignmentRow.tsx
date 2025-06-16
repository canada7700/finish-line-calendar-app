
import React, { useState } from 'react';
import { ProjectAssignment, TeamMember } from '../types/project';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Edit2, Save, X, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useUpdateProjectAssignment, useDeleteProjectAssignment } from '@/hooks/useProjectAssignments';
import { useTeamMembers } from '@/hooks/useTeamMembers';

interface PhaseAssignmentRowProps {
  assignment: ProjectAssignment;
  onUpdate: () => void;
}

const PhaseAssignmentRow = ({ assignment, onUpdate }: PhaseAssignmentRowProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    assignedHours: assignment.assignedHours,
    startDate: assignment.startDate ? new Date(assignment.startDate) : null,
    endDate: assignment.endDate ? new Date(assignment.endDate) : null,
  });

  const { data: teamMembers = [] } = useTeamMembers();
  const updateAssignmentMutation = useUpdateProjectAssignment();
  const deleteAssignmentMutation = useDeleteProjectAssignment();

  const handleSave = async () => {
    await updateAssignmentMutation.mutateAsync({
      id: assignment.id,
      assignedHours: editData.assignedHours,
      startDate: editData.startDate ? format(editData.startDate, 'yyyy-MM-dd') : undefined,
      endDate: editData.endDate ? format(editData.endDate, 'yyyy-MM-dd') : undefined,
    });
    setIsEditing(false);
    onUpdate();
  };

  const handleDelete = async () => {
    await deleteAssignmentMutation.mutateAsync(assignment.id);
    onUpdate();
  };

  const handleCancel = () => {
    setEditData({
      assignedHours: assignment.assignedHours,
      startDate: assignment.startDate ? new Date(assignment.startDate) : null,
      endDate: assignment.endDate ? new Date(assignment.endDate) : null,
    });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/30">
        <div className="flex-1">
          <span className="font-medium text-sm">{assignment.teamMember?.name}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={editData.assignedHours}
            onChange={(e) => setEditData(prev => ({ ...prev, assignedHours: parseInt(e.target.value) || 0 }))}
            className="w-16 h-8"
            min="0"
          />
          <span className="text-xs text-muted-foreground">hrs</span>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 px-2">
                <CalendarIcon className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={editData.startDate || undefined}
                onSelect={(date) => setEditData(prev => ({ ...prev, startDate: date || null }))}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          
          <Button 
            size="sm" 
            onClick={handleSave}
            disabled={updateAssignmentMutation.isPending}
            className="h-8 px-2"
          >
            <Save className="h-3 w-3" />
          </Button>
          
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleCancel}
            className="h-8 px-2"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-2 border rounded-md bg-muted/10">
      <div className="flex items-center gap-3">
        <span className="font-medium text-sm">{assignment.teamMember?.name}</span>
        <span className="text-sm text-muted-foreground">
          {assignment.assignedHours}h assigned
        </span>
        {assignment.startDate && (
          <span className="text-xs text-muted-foreground">
            {format(new Date(assignment.startDate), 'MMM d')}
          </span>
        )}
      </div>
      
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsEditing(true)}
          className="h-7 w-7 p-0"
        >
          <Edit2 className="h-3 w-3" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={deleteAssignmentMutation.isPending}
          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

export default PhaseAssignmentRow;
