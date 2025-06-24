
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckSquare, Square, X } from 'lucide-react';
import { TeamMember } from '../../types/project';

interface TeamMemberSelectorProps {
  selectedTeamMembers: string[];
  eligibleMembers: TeamMember[];
  teamMembers: TeamMember[] | undefined;
  onTeamMemberToggle: (memberId: string, checked: boolean) => void;
  onSelectAllEligibleMembers: () => void;
  onClearTeamMemberSelection: () => void;
  onRemoveTeamMember: (memberId: string) => void;
}

const TeamMemberSelector: React.FC<TeamMemberSelectorProps> = ({
  selectedTeamMembers,
  eligibleMembers,
  teamMembers,
  onTeamMemberToggle,
  onSelectAllEligibleMembers,
  onClearTeamMemberSelection,
  onRemoveTeamMember
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Team Members</label>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onSelectAllEligibleMembers}
            disabled={eligibleMembers.length === 0}
            className="text-xs px-2 py-1 h-7"
          >
            <CheckSquare className="h-3 w-3 mr-1" />
            All
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClearTeamMemberSelection}
            disabled={selectedTeamMembers.length === 0}
            className="text-xs px-2 py-1 h-7"
          >
            <Square className="h-3 w-3 mr-1" />
            Clear
          </Button>
        </div>
      </div>
      
      {/* Selected Team Members Display */}
      {selectedTeamMembers.length > 0 && (
        <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-xs font-medium mb-1">
            Selected ({selectedTeamMembers.length}):
          </div>
          <div className="flex flex-wrap gap-1">
            {selectedTeamMembers.map((memberId) => {
              const member = teamMembers?.find(m => m.id === memberId);
              return (
                <Badge key={memberId} variant="secondary" className="text-xs flex items-center gap-1">
                  {member?.name}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveTeamMember(memberId)}
                    className="h-3 w-3 p-0 hover:bg-transparent"
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </Badge>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Team Member Checkboxes - Compact */}
      <div className="grid grid-cols-1 gap-1 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2">
        {teamMembers?.filter(member => member.isActive).map((member) => {
          const isEligible = eligibleMembers.some(em => em.id === member.id);
          const isSelected = selectedTeamMembers.includes(member.id);
          
          return (
            <div key={member.id} className="flex items-center space-x-2">
              <Checkbox
                id={`member-${member.id}`}
                checked={isSelected}
                onCheckedChange={(checked) => onTeamMemberToggle(member.id, checked as boolean)}
                disabled={!isEligible}
              />
              <label
                htmlFor={`member-${member.id}`}
                className={`text-xs cursor-pointer ${
                  !isEligible ? 'text-muted-foreground' : ''
                }`}
              >
                {member.name} {!isEligible && '(Not eligible)'}
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TeamMemberSelector;
