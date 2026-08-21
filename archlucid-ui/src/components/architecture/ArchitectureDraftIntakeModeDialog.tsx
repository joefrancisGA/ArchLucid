"use client";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  ARCHITECTURE_DRAFT_INTAKE_MODE_CANCEL_LABEL,
  ARCHITECTURE_DRAFT_INTAKE_MODE_CONTINUE_LABEL,
  ARCHITECTURE_DRAFT_INTAKE_MODE_TITLE,
  ARCHITECTURE_DRAFT_INTAKE_MODE_UNLOCK_LABEL,
  architectureDraftIntakeModeLead,
} from "@/lib/architecture/architecture-draft-intake-mode";
import type { DraftRequestStatus } from "@/types/draft-intake";

type ArchitectureDraftIntakeModeDialogProps = {
  readonly open: boolean;
  readonly status: DraftRequestStatus;
  readonly canUnlock: boolean;
  readonly busy?: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onContinueIntake: () => void;
  readonly onUnlock: () => void;
};

/** Intercepts navigation onto a frozen architecture so the operator chooses continue vs unlock. */
export function ArchitectureDraftIntakeModeDialog(
  props: ArchitectureDraftIntakeModeDialogProps,
): React.JSX.Element {
  const busy = props.busy === true;

  return (
    <AlertDialog open={props.open} onOpenChange={props.onOpenChange}>
      <AlertDialogContent data-testid="architecture-draft-intake-mode-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>{ARCHITECTURE_DRAFT_INTAKE_MODE_TITLE}</AlertDialogTitle>
          <AlertDialogDescription>{architectureDraftIntakeModeLead(props.status)}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>{ARCHITECTURE_DRAFT_INTAKE_MODE_CANCEL_LABEL}</AlertDialogCancel>
          {props.canUnlock ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={props.onUnlock}
              data-testid="architecture-draft-intake-mode-dialog-unlock"
            >
              {ARCHITECTURE_DRAFT_INTAKE_MODE_UNLOCK_LABEL}
            </Button>
          ) : null}
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={busy}
            onClick={props.onContinueIntake}
            data-testid="architecture-draft-intake-mode-dialog-continue"
          >
            {ARCHITECTURE_DRAFT_INTAKE_MODE_CONTINUE_LABEL}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
