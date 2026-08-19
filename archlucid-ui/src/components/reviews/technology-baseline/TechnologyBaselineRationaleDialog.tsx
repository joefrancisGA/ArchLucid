"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

const RATIONALE_MAX_CHARS = 500;

export type TechnologyBaselineRationaleDialogProps = {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly initialRationale: string;
  readonly busy?: boolean;
  readonly onConfirm: (rationale: string) => void;
};

export function TechnologyBaselineRationaleDialog({
  open,
  onOpenChange,
  initialRationale,
  busy = false,
  onConfirm,
}: TechnologyBaselineRationaleDialogProps): React.JSX.Element {
  const [rationale, setRationale] = useState(initialRationale);

  useEffect(() => {
    if (open) {
      setRationale(initialRationale);
    }
  }, [initialRationale, open]);

  const trimmed = rationale.trim();
  const canSubmit = trimmed.length > 0 && trimmed.length <= RATIONALE_MAX_CHARS;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="technology-baseline-rationale-dialog">
        <DialogHeader>
          <DialogTitle>Edit technology choice rationale</DialogTitle>
          <DialogDescription>
            Record why this technology choice is authoritative for the architecture review before finalize.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="technology-baseline-rationale">Rationale</Label>
          <Textarea
            id="technology-baseline-rationale"
            value={rationale}
            onChange={(event) => setRationale(event.target.value)}
            rows={4}
            maxLength={RATIONALE_MAX_CHARS}
            data-testid="technology-baseline-rationale-input"
          />
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {trimmed.length} / {RATIONALE_MAX_CHARS} characters — required before saving.
          </p>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!canSubmit || busy}
            onClick={() => onConfirm(trimmed)}
            data-testid="technology-baseline-rationale-submit"
          >
            Save rationale
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
