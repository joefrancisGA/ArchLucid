"use client";

import type { ReactElement } from "react";

import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { useDraftBranchQuotaQuery } from "@/hooks/use-draft-branch-quota-query";
import { useEffectiveWorkingCareerRehearsalDoor } from "@/hooks/use-effective-working-career-rehearsal-door";
import { formatDraftBranchQuotaSummary } from "@/lib/draft-branch-quota-display";
import {
  resolveSystemNotJobCloneFromSnapshotConfirmCopy,
  SYSTEM_NOT_JOB_CLONE_FROM_SNAPSHOT_CONFIRM_CANCEL_ACTION,
} from "@/lib/system-not-job-clone-from-snapshot-entry";

export const ARCHITECTURE_DRAFT_CLONE_SNAPSHOT_CONFIRM_TEST_ID =
  "architecture-draft-clone-snapshot-confirm" as const;

export type ArchitectureDraftCloneSnapshotConfirmDialogProps = {
  readonly open: boolean;
  readonly draftId: string;
  readonly busy: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onConfirm: () => void;
};

/** SN-008 — confirm rehearsal stamp, CG door inheritance, and full-run cost before clone. */
export function ArchitectureDraftCloneSnapshotConfirmDialog(
  props: ArchitectureDraftCloneSnapshotConfirmDialogProps,
): ReactElement {
  const { effectiveDoor, mounted: doorMounted } = useEffectiveWorkingCareerRehearsalDoor();
  const quotaQuery = useDraftBranchQuotaQuery(props.draftId, { enabled: props.open });
  const quotaSummary =
    quotaQuery.data !== undefined ? formatDraftBranchQuotaSummary(quotaQuery.data) : null;
  const copy = resolveSystemNotJobCloneFromSnapshotConfirmCopy({
    effectiveDoor: doorMounted ? effectiveDoor : "rehearsal",
    quotaSummary,
  });

  return (
    <ConfirmationDialog
      open={props.open}
      onOpenChange={props.onOpenChange}
      title={copy.title}
      description={copy.description}
      confirmLabel={copy.confirmLabel}
      cancelLabel={SYSTEM_NOT_JOB_CLONE_FROM_SNAPSHOT_CONFIRM_CANCEL_ACTION}
      variant="default"
      busy={props.busy}
      extraContent={
        <span data-testid={ARCHITECTURE_DRAFT_CLONE_SNAPSHOT_CONFIRM_TEST_ID} className="sr-only">
          {copy.description}
        </span>
      }
      onConfirm={props.onConfirm}
    />
  );
}
