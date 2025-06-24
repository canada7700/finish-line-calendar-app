
import React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckSquare, Square } from 'lucide-react';

interface HourBlockSelectorProps {
  selectedHourBlocks: number[];
  availableHourBlocks: Array<{
    hour: number;
    isAlreadyAllocated: boolean;
    label: string;
  }>;
  onHourBlockToggle: (hour: number, checked: boolean) => void;
  onSelectAllAvailable: () => void;
  onClearSelection: () => void;
}

const HourBlockSelector: React.FC<HourBlockSelectorProps> = ({
  selectedHourBlocks,
  availableHourBlocks,
  onHourBlockToggle,
  onSelectAllAvailable,
  onClearSelection
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Hour Blocks</label>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onSelectAllAvailable}
            disabled={availableHourBlocks.every(block => block.isAlreadyAllocated)}
            className="text-xs px-2 py-1 h-7"
          >
            <CheckSquare className="h-3 w-3 mr-1" />
            All
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClearSelection}
            disabled={selectedHourBlocks.length === 0}
            className="text-xs px-2 py-1 h-7"
          >
            <Square className="h-3 w-3 mr-1" />
            Clear
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-1">
        {availableHourBlocks.map((block) => (
          <div key={block.hour} className="flex items-center space-x-2">
            <Checkbox
              id={`hour-${block.hour}`}
              checked={selectedHourBlocks.includes(block.hour)}
              onCheckedChange={(checked) => onHourBlockToggle(block.hour, checked as boolean)}
              disabled={block.isAlreadyAllocated}
            />
            <label
              htmlFor={`hour-${block.hour}`}
              className={`text-xs ${block.isAlreadyAllocated ? 'text-muted-foreground line-through' : 'cursor-pointer'}`}
            >
              {block.hour}:00
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HourBlockSelector;
