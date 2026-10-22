"use client";

import type { ReactElement } from "react";

import { ArchitectureWhatIfCostCapChrome } from "@/components/architecture/ArchitectureWhatIfCostCapChrome";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { useDraftBranchQuotaQuery } from "@/hooks/use-draft-branch-quota-query";
import { useEffectiveWorkingCareerRehearsalDoor } from "@/hooks/use-effective-working-career-rehearsal-door";
import {
  resolveSystemNotJobCloneFromSnapshotConfirmCopy,
  SYSTEM_NOT_JOB_CLONE_FROM_SNAPSHOT_CONFIRM_CANCEL_ACTION,
} from "@/lib/system-not-job-clone-from-snapshot-entry";
import { resolveDraftBranchWhatIfCostCapChrome } from "@/lib/system-not-job-what-if-cost-cap-chrome";

export const ARCHITECTURE_DRAFT_CLONE_SNAPSHOT_CONFIRM_TEST_ID =
  "architecture-draft-clone-snapshot-confirm" as const;

export type ArchitectureDraftCloneSnapshotConfirmDialogProps = {
  readonly open: boolean;
  readonly draftId: string;
  readonly busy: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onConfirm: () => void;
};

/** SN-008 + SN-009 — confirm rehearsal stamp, CG door inheritance, and R12 branch cap before clone. */
export function ArchitectureDraftCloneSnapshotConfirmDialog(
  props: ArchitectureDraftCloneSnapshotConfirmDialogProps,
): ReactElement {
  const { effectiveDoor, mounted: doorMounted } = useEffectiveWorkingCareerRehearsalDoor();
  const quotaQuery = useDraftBranchQuotaQuery(props.draftId, { enabled: props.open });
  const capChrome = resolveDraftBranchWhatIfCostCapChrome({
    quota: quotaQuery.data,
    quotaLoading: quotaQuery.isLoading,
    quotaFailed: quotaQuery.isError,
  });
  const copy = resolveSystemNotJobCloneFromSnapshotConfirmCopy({
    effectiveDoor: doorMounted ? effectiveDoor : "rehearsal",
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
      confirmDisabled={capChrome.confirmDisabled}
      extraContent={
        <>
          <span data-testid={ARCHITECTURE_DRAFT_CLONE_SNAPSHOT_CONFIRM_TEST_ID} className="sr-only">
            {copy.description}
          </span>
          <ArchitectureWhatIfCostCapChrome chrome={capChrome} quotaLoading={quotaQuery.isLoading} />
        </>
      }
      onConfirm={props.onConfirm}
    />
  );
}
