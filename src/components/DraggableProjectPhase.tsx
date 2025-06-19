
import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { ProjectPhase } from '@/types/project';
import { AlertTriangle } from 'lucide-react';

interface DraggableProjectPhaseProps {
  phase: ProjectPhase;
  hasSchedulingConflict?: boolean;
  conflictReason?: string;
  children: React.ReactNode;
}

const DraggableProjectPhase = ({ 
  phase, 
  hasSchedulingConflict, 
  conflictReason,
  children 
}: DraggableProjectPhaseProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: phase.id,
    data: {
      phase,
      type: 'project-phase'
    }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  // Only make install phases draggable (these will be the "handle" for moving entire projects)
  const isDraggablePhase = phase.phase === 'install';

  if (!isDraggablePhase) {
    return <>{children}</>;
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        ${isDragging ? 'opacity-50 z-50' : ''} 
        ${isDraggablePhase ? 'cursor-grab active:cursor-grabbing' : ''}
        transition-opacity duration-200
      `}
      title={`Drag to reschedule ${phase.projectName}${hasSchedulingConflict ? ` - CONFLICT: ${conflictReason}` : ''}`}
    >
      {children}
      {isDraggablePhase && (
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full opacity-75" 
             title="Drag handle - drag to reschedule project" />
      )}
    </div>
  );
};

export default DraggableProjectPhase;
