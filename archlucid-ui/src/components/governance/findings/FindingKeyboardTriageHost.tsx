"use client";

import { useCallback, useState, type ReactElement } from "react";

import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { DispositionExportBeforeAfterPreview } from "@/components/operator/DispositionExportBeforeAfterPreview";
import { DispositionExportImpactNotice } from "@/components/operator/DispositionExportImpactNotice";
import { OperatorMutationInlineError } from "@/components/operator/OperatorMutationInlineError";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import {
  useFindingCardShortcuts,
  type FindingCardShortcutDisposition,
} from "@/hooks/useFindingCardShortcuts";
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

  useFindingCardShortcuts({ onAction, mutationsEnabled: canMutate });

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