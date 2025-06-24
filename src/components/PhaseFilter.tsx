
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Eye, EyeOff } from 'lucide-react';
import { ProjectPhase } from '@/types/project';

interface PhaseFilterProps {
  phases: ProjectPhase[];
  onFilterChange: (selectedPhases: string[]) => void;
  showCapacityView?: boolean;
  onCapacityViewToggle?: (show: boolean) => void;
}

const PhaseFilter = ({ 
  phases, 
  onFilterChange, 
  showCapacityView = false, 
  onCapacityViewToggle 
}: PhaseFilterProps) => {
  const [selectedPhases, setSelectedPhases] = React.useState<string[]>(['all']);

  const uniquePhases = React.useMemo(() => {
    const phaseSet = new Set(phases.map(p => p.phase));
    return Array.from(phaseSet);
  }, [phases]);

  const handlePhaseToggle = (phase: string) => {
    let newSelectedPhases: string[];
    
    if (phase === 'all') {
      newSelectedPhases = selectedPhases.includes('all') ? [] : ['all'];
    } else if (phase === 'none') {
      newSelectedPhases = [];
    } else {
      // Remove 'all' if it's selected when selecting individual phases
      const filteredSelected = selectedPhases.filter(p => p !== 'all');
      
      if (filteredSelected.includes(phase)) {
        newSelectedPhases = filteredSelected.filter(p => p !== phase);
      } else {
        newSelectedPhases = [...filteredSelected, phase];
      }
      
      // If all individual phases are selected, switch to 'all'
      if (newSelectedPhases.length === uniquePhases.length) {
        newSelectedPhases = ['all'];
      }
    }
    
    setSelectedPhases(newSelectedPhases);
    onFilterChange(newSelectedPhases);
  };

  const clearFilters = () => {
    setSelectedPhases(['all']);
    onFilterChange(['all']);
  };

  const getPhaseColor = (phase: string) => {
    const samplePhase = phases.find(p => p.phase === phase);
    return samplePhase?.color || 'bg-gray-500';
  };

  const getPhaseDisplayName = (phase: string) => {
    switch (phase) {
      case 'millwork':
        return 'Millwork';
      case 'boxConstruction':
        return 'Box Construction';
      case 'stain':
        return 'Stain';
      case 'install':
        return 'Install';
      case 'materialOrder':
        return 'Material Order';
      default:
        return phase;
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-muted/30 border-b">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground mr-2">Phases:</span>
        
        <Button
          variant={selectedPhases.includes('all') ? 'default' : 'outline'}
          size="sm"
          onClick={() => handlePhaseToggle('all')}
          className="h-7"
        >
          All
        </Button>
        
        <Button
          variant={selectedPhases.length === 0 ? 'default' : 'outline'}
          size="sm"
          onClick={() => handlePhaseToggle('none')}
          className="h-7"
        >
          None
        </Button>
        
        {uniquePhases.map(phase => (
          <Button
            key={phase}
            variant={selectedPhases.includes(phase) ? 'default' : 'outline'}
            size="sm"
            onClick={() => handlePhaseToggle(phase)}
            className="h-7"
          >
            <div className={`w-3 h-3 rounded-full ${getPhaseColor(phase)} mr-2`} />
            {getPhaseDisplayName(phase)}
          </Button>
        ))}
        
        {selectedPhases.length > 0 && !selectedPhases.includes('all') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-7 px-2"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {onCapacityViewToggle && (
        <div className="flex items-center gap-2 ml-auto">
          <Button
            variant={showCapacityView ? 'default' : 'outline'}
            size="sm"
            onClick={() => onCapacityViewToggle(!showCapacityView)}
            className="h-7"
          >
            {showCapacityView ? <Eye className="h-3 w-3 mr-2" /> : <EyeOff className="h-3 w-3 mr-2" />}
            Capacity View
          </Button>
        </div>
      )}

      {selectedPhases.length > 0 && !selectedPhases.includes('all') && (
        <div className="flex flex-wrap gap-1">
          {selectedPhases.map(phase => (
            <Badge key={phase} variant="secondary" className="text-xs">
              <div className={`w-2 h-2 rounded-full ${getPhaseColor(phase)} mr-1`} />
              {getPhaseDisplayName(phase)}
              <button
                onClick={() => handlePhaseToggle(phase)}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                <X className="h-2 w-2" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export { PhaseFilter };
