
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { DailyPhaseCapacity } from '../../types/project';

interface CapacityAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date;
  phase: string;
  currentCapacity: number;
  defaultCapacity: number;
  currentAllocated: number;
  currentOverride?: { adjustedCapacity: number; reason?: string };
  onAdjustCapacity: (adjustedCapacity: number, reason?: string) => void;
  onResetCapacity: () => void;
  isLoading: boolean;
}

const CapacityAdjustmentDialog: React.FC<CapacityAdjustmentDialogProps> = ({
  open,
  onOpenChange,
  date,
  phase,
  currentCapacity,
  defaultCapacity,
  currentAllocated,
  currentOverride,
  onAdjustCapacity,
  onResetCapacity,
  isLoading
}) => {
  const [adjustedCapacity, setAdjustedCapacity] = React.useState(currentCapacity);
  const [reason, setReason] = React.useState(currentOverride?.reason || '');

  React.useEffect(() => {
    if (open) {
      setAdjustedCapacity(currentCapacity);
      setReason(currentOverride?.reason || '');
    }
  }, [open, currentCapacity, currentOverride]);

  const handleAdjust = () => {
    onAdjustCapacity(adjustedCapacity, reason.trim() || undefined);
    onOpenChange(false);
  };

  const handleReset = () => {
    onResetCapacity();
    onOpenChange(false);
  };

  const isReduced = adjustedCapacity < currentAllocated;
  const hasOverride = currentOverride !== undefined;
  const phaseDisplayName = phase.charAt(0).toUpperCase() + phase.slice(1).replace(/([A-Z])/g, ' $1');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust {phaseDisplayName} Capacity</DialogTitle>
          <DialogDescription>
            Adjust the capacity for {phaseDisplayName} on {format(date, 'MMMM d, yyyy')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Default Capacity:</span>
              <div className="font-medium">{defaultCapacity} hours</div>
            </div>
            <div>
              <span className="text-muted-foreground">Currently Allocated:</span>
              <div className="font-medium">{currentAllocated} hours</div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adjusted-capacity">Adjusted Capacity</Label>
            <Input
              id="adjusted-capacity"
              type="number"
              min="0"
              value={adjustedCapacity}
              onChange={(e) => setAdjustedCapacity(Math.max(0, parseInt(e.target.value) || 0))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason (Optional)</Label>
            <Textarea
              id="reason"
              placeholder="e.g., John sick today, 2 casual helpers added"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
            />
          </div>

          {isReduced && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-amber-800">
                Warning: Setting capacity below current allocations ({currentAllocated} hours) may cause conflicts.
              </span>
            </div>
          )}

          <div className="flex justify-between pt-4">
            {hasOverride && (
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={isLoading}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Default
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAdjust}
                disabled={isLoading}
              >
                {hasOverride ? 'Update' : 'Adjust'} Capacity
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CapacityAdjustmentDialog;
