"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { ArchitectureDraftCloneSnapshotConfirmDialog } from "@/components/architecture/ArchitectureDraftCloneSnapshotConfirmDialog";
import { OperatorMutationInlineError } from "@/components/operator/OperatorMutationInlineError";
import { Button } from "@/components/ui/button";
import {
  buildArchitectureDraftRegistryEntry,
  upsertArchitectureDraftRegistryEntry,
} from "@/lib/architecture/architecture-draft-registry";
import {
  architectureDraftPath,
  architectureIdentityDraftHref,
} from "@/lib/architecture/architecture-routes";
import { cloneDraftSnapshot } from "@/lib/api/draft-intake-api";
import { architectureDraftIntakeMutationBlockedReason } from "@/lib/architecture/architecture-draft-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { formatVerboseApiFailureMessage } from "@/lib/resolve-api-error-message";
import {
  SYSTEM_NOT_JOB_CLONE_FROM_SNAPSHOT_DESK_CTA_LABEL,
  SYSTEM_NOT_JOB_CLONE_FROM_SNAPSHOT_SPAWN_LOCK_DOM_TEST_ID,
} from "@/lib/system-not-job-clone-from-snapshot-entry";

export const ARCHITECTURE_DRAFT_CLONE_SNAPSHOT_LABEL = "Start a new draft from this snapshot";

type ArchitectureDraftCloneSnapshotControlProps = {
  readonly draftId: string;
  readonly parentArchitectureId?: string;
  readonly buttonLabel?: string;
  readonly testId?: string;
  readonly variant?: "primary" | "outline" | "secondary";
  /** SN-008: confirm rehearsal stamp + full-run cost before clone. */
  readonly confirmBeforeClone?: boolean;
  /** SN-008: spawn-locked desk / palette discovery defaults. */
  readonly spawnLockedDeskAction?: boolean;
};

/** Creates a new editable draft under the same architecture identity when parentArchitectureId is set (CA-28). */
export function ArchitectureDraftCloneSnapshotControl(
  props: ArchitectureDraftCloneSnapshotControlProps,
): React.JSX.Element {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const confirmBeforeClone = props.confirmBeforeClone ?? props.spawnLockedDeskAction === true;

  const handleClone = useCallback(async () => {
    if (busy) {
      return;
    }

    setInlineError(null);
    setBusy(true);

    try {
      const response = await cloneDraftSnapshot(props.draftId);
      upsertArchitectureDraftRegistryEntry(
        buildArchitectureDraftRegistryEntry(response.clone, { linkedReviewId: null }),
      );
      const parentArchitectureId = props.parentArchitectureId?.trim() ?? "";
      const cloneArchitectureId = response.clone.architectureId?.trim() ?? parentArchitectureId;
      const nextHref =
        cloneArchitectureId.length > 0
          ? architectureIdentityDraftHref(cloneArchitectureId, response.clone.draftId)
          : architectureDraftPath(response.clone.draftId);
      router.push(nextHref);
    } catch (error) {
      const failure = toApiLoadFailure(error);
      const blocked = architectureDraftIntakeMutationBlockedReason(failure);
      setInlineError(
        blocked
          ?? formatVerboseApiFailureMessage(error, "Could not start a new draft from this snapshot."),
      );
    } finally {
      setBusy(false);
      setConfirmOpen(false);
    }
  }, [busy, props.draftId, props.parentArchitectureId, router]);

  const defaultTestId = props.spawnLockedDeskAction === true
    ? SYSTEM_NOT_JOB_CLONE_FROM_SNAPSHOT_SPAWN_LOCK_DOM_TEST_ID
    : "architecture-draft-clone-snapshot";
  const testId = props.testId ?? defaultTestId;
  const defaultButtonLabel = props.spawnLockedDeskAction === true
    ? SYSTEM_NOT_JOB_CLONE_FROM_SNAPSHOT_DESK_CTA_LABEL
    : ARCHITECTURE_DRAFT_CLONE_SNAPSHOT_LABEL;
  const buttonLabel = props.buttonLabel ?? defaultButtonLabel;

  const openCloneFlow = () => {
    if (busy) {
      return;
    }

    if (confirmBeforeClone) {
      setConfirmOpen(true);

      return;
    }

    void handleClone();
  };

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant={props.variant ?? "outline"}
        size="sm"
        disabled={busy}
        data-testid={testId}
        data-spawn-lock-clone-action={props.spawnLockedDeskAction === true ? "true" : undefined}
        onClick={openCloneFlow}
      >
        {busy ? "Starting new draft…" : buttonLabel}
      </Button>
      {inlineError !== null ? (
        <OperatorMutationInlineError message={inlineError} testId={`${testId}-inline-error`} />
      ) : null}
      {confirmBeforeClone ? (
        <ArchitectureDraftCloneSnapshotConfirmDialog
          open={confirmOpen}
          draftId={props.draftId}
          busy={busy}
          onOpenChange={setConfirmOpen}
          onConfirm={() => {
            void handleClone();
          }}
        />
      ) : null}
    </div>
  );
}
