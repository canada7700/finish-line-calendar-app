
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Filter } from 'lucide-react';
import { ProjectPhase } from '@/types/project';

interface PhaseFilterProps {
  phases: ProjectPhase[];
  onFilterChange: (selectedPhases: string[]) => void;
}

const PHASE_CONFIG = {
  all: { label: 'All', color: 'bg-gray-500' },
  materialOrder: { label: 'Material Order', color: 'bg-orange-500' },
  millwork: { label: 'Millwork', color: 'bg-purple-500' },
  boxConstruction: { label: 'Box Construction', color: 'bg-blue-500' },
  stain: { label: 'Stain', color: 'bg-amber-500' },
  install: { label: 'Install', color: 'bg-green-500' }
};

export const PhaseFilter = ({ phases, onFilterChange }: PhaseFilterProps) => {
  const [selectedPhases, setSelectedPhases] = useState<string[]>(['all']);

  // Get counts for each phase
  const phaseCounts = phases.reduce((acc, phase) => {
    acc[phase.phase] = (acc[phase.phase] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handlePhaseToggle = (phase: string) => {
    let newSelectedPhases: string[];
    
    if (phase === 'all') {
      newSelectedPhases = ['all'];
    } else {
      // Remove 'all' if it's selected and we're selecting a specific phase
      let filteredSelected = selectedPhases.filter(p => p !== 'all');
      
      if (filteredSelected.includes(phase)) {
        // Remove the phase
        filteredSelected = filteredSelected.filter(p => p !== phase);
        // If no phases selected, default to 'all'
        if (filteredSelected.length === 0) {
          filteredSelected = ['all'];
        }
      } else {
        // Add the phase
        filteredSelected = [...filteredSelected, phase];
      }
      
      newSelectedPhases = filteredSelected;
    }
    
    setSelectedPhases(newSelectedPhases);
    onFilterChange(newSelectedPhases);
  };

  const clearAll = () => {
    setSelectedPhases([]);
    onFilterChange([]);
  };

  const selectAll = () => {
    setSelectedPhases(['all']);
    onFilterChange(['all']);
  };

  const isSelected = (phase: string) => {
    if (phase === 'none') {
      return selectedPhases.length === 0;
    }
    return selectedPhases.includes('all') || selectedPhases.includes(phase);
  };

  const getFilterButtonText = () => {
    if (selectedPhases.includes('all')) {
      return 'All Phases';
    }
    if (selectedPhases.length === 0) {
      return 'No phases selected';
    }
    if (selectedPhases.length === 1) {
      const phase = selectedPhases[0];
      return PHASE_CONFIG[phase as keyof typeof PHASE_CONFIG]?.label || phase;
    }
    return `${selectedPhases.length} phases selected`;
  };

  return (
    <div className="sticky top-0 z-10 bg-background border-b border-border p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Project Timeline</h3>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              {getFilterButtonText()}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 bg-background">
            <DropdownMenuLabel>Filter by Phase</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
              onSelect={(e) => e.preventDefault()}
              onClick={(e) => {
                e.stopPropagation();
                selectAll();
              }}
              className="cursor-pointer"
            >
              <Checkbox
                checked={selectedPhases.includes('all')}
                className="mr-2"
              />
              <div className={`w-3 h-3 rounded mr-2 ${PHASE_CONFIG.all.color}`} />
              <span className="flex-1">All Phases</span>
              <Badge variant="secondary" className="ml-2">
                {phases.length}
              </Badge>
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              onSelect={(e) => e.preventDefault()}
              onClick={(e) => {
                e.stopPropagation();
                clearAll();
              }}
              className="cursor-pointer"
            >
              <Checkbox
                checked={isSelected('none')}
                className="mr-2"
              />
              <span className="ml-5">None</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {Object.entries(PHASE_CONFIG).map(([phaseKey, config]) => {
              if (phaseKey === 'all') return null;
              
              const count = phaseCounts[phaseKey] || 0;
              if (count === 0) return null;
              
              return (
                <DropdownMenuItem
                  key={phaseKey}
                  onSelect={(e) => e.preventDefault()}
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePhaseToggle(phaseKey);
                  }}
                  className="cursor-pointer"
                >
                  <Checkbox
                    checked={isSelected(phaseKey)}
                    className="mr-2"
                  />
                  <div className={`w-3 h-3 rounded mr-2 ${config.color}`} />
                  <span className="flex-1">{config.label}</span>
                  <Badge variant="secondary" className="ml-2">
                    {count}
                  </Badge>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {selectedPhases.length > 0 && !selectedPhases.includes('all') && (
        <div className="text-sm text-muted-foreground mt-2">
          Showing {selectedPhases.length} phase type{selectedPhases.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};
