"use client";

import { useCallback, useEffect, useState, type ReactElement } from "react";

import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { useReviewWorkbenchSelection } from "@/components/reviews/ReviewWorkbenchSelectionContext";
import { DispositionExportBeforeAfterPreview } from "@/components/operator/DispositionExportBeforeAfterPreview";
import { DispositionExportImpactNotice } from "@/components/operator/DispositionExportImpactNotice";
import { OperatorMutationInlineError } from "@/components/operator/OperatorMutationInlineError";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import {
  focusAdjacentFindingCard,
  getFocusedFindingId,
  useFindingCardShortcuts,
  type FindingCardShortcutDisposition,
} from "@/hooks/useFindingCardShortcuts";
import {
  COMMAND_PALETTE_FINDING_ACCEPT_EVENT,
  COMMAND_PALETTE_FINDING_NEXT_EVENT,
  COMMAND_PALETTE_FINDING_PREV_EVENT,
  COMMAND_PALETTE_FINDING_REJECT_EVENT,
  COMMAND_PALETTE_FINDING_REMEDIATE_EVENT,
} from "@/lib/command-palette-handler-actions";
import { recordFindingDisposition } from "@/lib/api/governance-stickiness-api";
import { findingDispositionKindLabel } from "@/lib/disposition-export-before-after";
import { createGovernanceMutationIdempotencyKey } from "@/lib/governance/governance-mutation-idempotency-key";
import {
  GOVERNANCE_BULK_DISPOSITION_FAILURE_MESSAGE,
  GOVERNANCE_BULK_DISPOSITION_REASON_REQUIRED,
} from "@/lib/governance/governance-mutation-outcome-copy";

export type FindingKeyboardTriageHostProps = {
  /** Resolves runId for the focused finding; return null to ignore the shortcut. */
  readonly resolveRunId: (findingId: string) => string | null;
  readonly onApplied?: () => void;
};

type PendingKeyboardDisposition = {
  readonly findingId: string;
  readonly runId: string;
  readonly disposition: FindingCardShortcutDisposition;
};

const CONFIRM_LABELS: Record<FindingCardShortcutDisposition, string> = {
  Accepted: "Accept this finding",
  Remediated: "Mark this finding remediated",
  RejectedAsNotApplicable: "Reject this finding as not applicable",
};

/**
 * Registers finding-card Alt+J/K and Alt+1–3 triage shortcuts and confirms disposition with rationale.
 * Mount once on a findings queue or review findings list that stamps `data-finding-id` on cards/rows.
 */
export function FindingKeyboardTriageHost(props: FindingKeyboardTriageHostProps): ReactElement | null {
  const canMutate = useOperateCapability();
  const workbenchSelection = useReviewWorkbenchSelection();
  const [pending, setPending] = useState<PendingKeyboardDisposition | null>(null);
  const [rationale, setRationale] = useState("");
  const [busy, setBusy] = useState(false);
  const [inlineErrorMessage, setInlineErrorMessage] = useState<string | null>(null);

  const onAction = useCallback(
    (findingId: string, disposition: FindingCardShortcutDisposition) => {
      const runId = props.resolveRunId(findingId);

      if (runId === null || runId.trim().length === 0) {
        return;
      }

      setInlineErrorMessage(null);
      setRationale("");
      setPending({ findingId, runId: runId.trim(), disposition });
    },
    [props],
  );

  useFindingCardShortcuts({
    onAction,
    mutationsEnabled: canMutate,
    onFindingFocus: workbenchSelection?.setSelectedFindingId,
  });

  useEffect(() => {
    const onFindingFocus = workbenchSelection?.setSelectedFindingId;

    function resolveFocusedFindingId(): string | null {
      const focused = getFocusedFindingId();

      if (focused !== null) {
        return focused;
      }

      focusAdjacentFindingCard(1, { onFindingFocus, startFromFirstWhenUnfocused: true });

      return getFocusedFindingId();
    }

    function onNext(): void {
      focusAdjacentFindingCard(1, { onFindingFocus, startFromFirstWhenUnfocused: true });
    }

    function onPrev(): void {
      focusAdjacentFindingCard(-1, { onFindingFocus, startFromFirstWhenUnfocused: true });
    }

    function onAccept(): void {
      if (!canMutate) {
        return;
      }

      const findingId = resolveFocusedFindingId();

      if (findingId !== null) {
        onAction(findingId, "Accepted");
      }
    }

    function onRemediate(): void {
      if (!canMutate) {
        return;
      }

      const findingId = resolveFocusedFindingId();

      if (findingId !== null) {
        onAction(findingId, "Remediated");
      }
    }

    function onReject(): void {
      if (!canMutate) {
        return;
      }

      const findingId = resolveFocusedFindingId();

      if (findingId !== null) {
        onAction(findingId, "RejectedAsNotApplicable");
      }
    }

    window.addEventListener(COMMAND_PALETTE_FINDING_NEXT_EVENT, onNext);
    window.addEventListener(COMMAND_PALETTE_FINDING_PREV_EVENT, onPrev);
    window.addEventListener(COMMAND_PALETTE_FINDING_ACCEPT_EVENT, onAccept);
    window.addEventListener(COMMAND_PALETTE_FINDING_REMEDIATE_EVENT, onRemediate);
    window.addEventListener(COMMAND_PALETTE_FINDING_REJECT_EVENT, onReject);

    return () => {
      window.removeEventListener(COMMAND_PALETTE_FINDING_NEXT_EVENT, onNext);
      window.removeEventListener(COMMAND_PALETTE_FINDING_PREV_EVENT, onPrev);
      window.removeEventListener(COMMAND_PALETTE_FINDING_ACCEPT_EVENT, onAccept);
      window.removeEventListener(COMMAND_PALETTE_FINDING_REMEDIATE_EVENT, onRemediate);
      window.removeEventListener(COMMAND_PALETTE_FINDING_REJECT_EVENT, onReject);
    };
  }, [canMutate, onAction, workbenchSelection?.setSelectedFindingId]);

  async function applyPending(): Promise<void> {
    if (pending === null) {
      return;
    }

    const trimmedReason = rationale.trim();

    if (trimmedReason.length === 0) {
      setInlineErrorMessage(GOVERNANCE_BULK_DISPOSITION_REASON_REQUIRED);

      return;
    }

    setBusy(true);
    setInlineErrorMessage(null);

    try {
      await recordFindingDisposition(
        pending.findingId,
        {
          disposition: pending.disposition,
          rationale: trimmedReason,
          runId: pending.runId,
        },
        { idempotencyKey: createGovernanceMutationIdempotencyKey() },
      );
      setPending(null);
      setRationale("");
      props.onApplied?.();
    } catch (err) {
      setInlineErrorMessage(err instanceof Error ? err.message : GOVERNANCE_BULK_DISPOSITION_FAILURE_MESSAGE);
    } finally {
      setBusy(false);
    }
  }

  if (pending === null) {
    return null;
  }

  return (
    <ConfirmationDialog
      open
      onOpenChange={(open) => {
        if (!open) {
          setPending(null);
          setInlineErrorMessage(null);
          setRationale("");
        }
      }}
      title="Confirm finding disposition"
      description={`${CONFIRM_LABELS[pending.disposition]} (${findingDispositionKindLabel(pending.disposition)}).`}
      confirmLabel="Apply disposition"
      variant="default"
      busy={busy}
      extraContent={
        <div className="mt-2 space-y-3">
          {inlineErrorMessage !== null ? (
            <OperatorMutationInlineError
              message={inlineErrorMessage}
              testId="finding-keyboard-disposition-inline-error"
            />
          ) : null}
          <div>
            <Label htmlFor="finding-keyboard-disposition-reason">Reason</Label>
            <Input
              id="finding-keyboard-disposition-reason"
              value={rationale}
              onChange={(event) => setRationale(event.target.value)}
              placeholder="Required for disposition audit trail"
              disabled={busy}
              data-testid="finding-keyboard-disposition-reason"
            />
          </div>
          <DispositionExportBeforeAfterPreview disposition={pending.disposition} />
          <DispositionExportImpactNotice disposition={pending.disposition} />
        </div>
      }
      reversibilityMutationId="governance_keyboard_finding_disposition"
      onConfirm={() => {
        void applyPending();
      }}
    />
  );
}