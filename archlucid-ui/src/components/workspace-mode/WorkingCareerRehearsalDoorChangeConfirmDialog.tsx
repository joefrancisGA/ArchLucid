"use client";

import type { ReactElement } from "react";

import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import {
  resolveWorkingCareerRehearsalDoorChangeConfirmCopy,
} from "@/lib/governance/working-career-rehearsal-door-mid-review-confirm";
import type { WorkingCareerRehearsalDoorId } from "@/lib/governance/working-career-rehearsal-door";

export const WORKING_CAREER_REHEARSAL_DOOR_CHANGE_CONFIRM_TEST_ID =
  "working-career-rehearsal-door-change-confirm" as const;

export type WorkingCareerRehearsalDoorChangeConfirmDialogProps = {
  readonly open: boolean;
  readonly currentDoor: WorkingCareerRehearsalDoorId;
  readonly nextDoor: WorkingCareerRehearsalDoorId | null;
  readonly onOpenChange: (open: boolean) => void;
  readonly onConfirm: () => void;
};

/** CG-018 — explicit door change during in-flight analysis. Does not cancel the run (AD-02). */
export function WorkingCareerRehearsalDoorChangeConfirmDialog(
  props: WorkingCareerRehearsalDoorChangeConfirmDialogProps,
): ReactElement {
  const copy = resolveWorkingCareerRehearsalDoorChangeConfirmCopy({
    currentDoor: props.currentDoor,
    nextDoor: props.nextDoor ?? props.currentDoor,
  });

  return (
    <ConfirmationDialog
      open={props.open}
      onOpenChange={props.onOpenChange}
      title={copy.title}
      description={copy.description}
      confirmLabel={copy.confirmLabel}
      cancelLabel={copy.cancelLabel}
      variant="default"
      extraContent={
        <span data-testid={WORKING_CAREER_REHEARSAL_DOOR_CHANGE_CONFIRM_TEST_ID} className="sr-only">
          {copy.description}
        </span>
      }
      onConfirm={props.onConfirm}
    />
  );
}
