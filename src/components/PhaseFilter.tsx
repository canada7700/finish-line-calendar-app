
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
    return selectedPhases.includes('all') || selectedPhases.includes(phase);
  };

  return (
    <div className="sticky top-0 z-10 bg-background border-b border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Filter by Phase</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={clearAll}>
            Clear All
          </Button>
          <Button variant="outline" size="sm" onClick={selectAll}>
            Select All
          </Button>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {Object.entries(PHASE_CONFIG).map(([phaseKey, config]) => {
          if (phaseKey === 'all') {
            return (
              <Button
                key={phaseKey}
                variant={isSelected(phaseKey) ? "default" : "outline"}
                size="sm"
                onClick={() => handlePhaseToggle(phaseKey)}
                className="flex items-center gap-2"
              >
                <div className={`w-3 h-3 rounded ${config.color}`} />
                {config.label}
                <Badge variant="secondary" className="ml-1">
                  {phases.length}
                </Badge>
              </Button>
            );
          }
          
          const count = phaseCounts[phaseKey] || 0;
          if (count === 0) return null;
          
          return (
            <Button
              key={phaseKey}
              variant={isSelected(phaseKey) ? "default" : "outline"}
              size="sm"
              onClick={() => handlePhaseToggle(phaseKey)}
              className="flex items-center gap-2"
            >
              <div className={`w-3 h-3 rounded ${config.color}`} />
              {config.label}
              <Badge variant="secondary" className="ml-1">
                {count}
              </Badge>
            </Button>
          );
        })}
      </div>
      
      {selectedPhases.length > 0 && !selectedPhases.includes('all') && (
        <div className="text-sm text-muted-foreground">
          Showing {selectedPhases.length} phase type{selectedPhases.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};
