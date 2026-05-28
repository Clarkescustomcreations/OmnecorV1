import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { CriticalAction } from '../phase2/services/HITLApprovalService';

interface CriticalActionChecklistProps {
  action: CriticalAction | null;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CriticalActionChecklist({ action, onApprove, onReject, open, onOpenChange }: CriticalActionChecklistProps) {
  if (!action) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-rose-500">Critical Action Required</DialogTitle>
          <DialogDescription>
            The agent is requesting to perform a critical action that requires your manual review.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="p-4 bg-muted rounded-md font-mono text-sm">
            <p><strong>Tool:</strong> {action.toolName}</p>
            <p><strong>Arguments:</strong> {JSON.stringify(action.args, null, 2)}</p>
          </div>
          <p className="text-sm">Please verify the integrity of this action before proceeding.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onReject(action.id)}>Reject</Button>
          <Button variant="default" onClick={() => onApprove(action.id)}>Approve Critical Action</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
