
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wand2, Loader2 } from 'lucide-react';
import { TeamMember } from '../../types/project';

interface AutoFillCardProps {
  selectedProject: string;
  selectedPhase: string;
  availableProjects: Array<{ id: string; name: string }>;
  availablePhases: string[];
  eligibleMembers: TeamMember[];
  isAutoFilling: boolean;
  autoFillProgress: number;
  autoFillTotal: number;
  onProjectChange: (value: string) => void;
  onPhaseChange: (value: string) => void;
  onAutoFill: () => void;
}

const AutoFillCard: React.FC<AutoFillCardProps> = ({
  selectedProject,
  selectedPhase,
  availableProjects,
  availablePhases,
  eligibleMembers,
  isAutoFilling,
  autoFillProgress,
  autoFillTotal,
  onProjectChange,
  onPhaseChange,
  onAutoFill
}) => {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle>Quick Auto-Fill</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col flex-1">
        <div className="flex-1 space-y-4">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Project</label>
              <Select value={selectedProject} onValueChange={onProjectChange} disabled={isAutoFilling}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {availableProjects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Phase</label>
              <Select value={selectedPhase} onValueChange={onPhaseChange} disabled={!selectedProject || isAutoFilling}>
                <SelectTrigger>
                  <SelectValue placeholder="Select phase" />
                </SelectTrigger>
                <SelectContent>
                  {availablePhases.map((phase) => (
                    <SelectItem key={phase} value={phase}>
                      {phase.charAt(0).toUpperCase() + phase.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {selectedPhase && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="text-sm font-medium mb-2">
                Eligible Team Members ({eligibleMembers.length})
              </div>
              <div className="text-sm text-muted-foreground">
                {eligibleMembers.map(member => member.name).join(', ') || 'None available'}
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-4">
          <Button 
            onClick={onAutoFill} 
            disabled={!selectedProject || !selectedPhase || eligibleMembers.length === 0 || isAutoFilling}
            className="w-full"
          >
            {isAutoFilling ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Auto-Filling... ({autoFillProgress}/{autoFillTotal})
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Auto-Fill to Phase Capacity
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AutoFillCard;
