"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { DispositionExportBeforeAfterPreview } from "@/components/operator/DispositionExportBeforeAfterPreview";
import { DispositionExportImpactNotice } from "@/components/operator/DispositionExportImpactNotice";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OperatorMutationInlineError } from "@/components/operator/OperatorMutationInlineError";
import { createGovernanceMutationIdempotencyKey } from "@/lib/governance/governance-mutation-idempotency-key";
import {
  GOVERNANCE_BULK_DISPOSITION_FAILURE_MESSAGE,
  GOVERNANCE_BULK_DISPOSITION_REASON_REQUIRED,
  governanceBulkDispositionSuccessMessage,
} from "@/lib/governance/governance-mutation-outcome-copy";
import {
  DISPOSITION_RATIONALE_REQUIRED_MESSAGE,
  isDispositionRationaleSatisfied,
} from "@/lib/review-quality/finding-governance-gates";
import {
  defaultDeferredRevisitDueUtc,
  recordBulkFindingDisposition,
  type FindingDispositionKind,
} from "@/lib/api/governance-stickiness-api";

type GovernanceFindingsBulkActionsProps = {
  readonly selectedFindingIds: readonly string[];
  readonly onApplied: () => void;
  readonly onDispositionSucceeded: (message: string, undo?: () => Promise<void>) => void;
};

type BulkDisposition = Extract<FindingDispositionKind, "Accepted" | "RejectedAsNotApplicable" | "Deferred">;

function isBulkDispositionReasonReady(disposition: BulkDisposition, reason: string): boolean {
  const trimmedReason = reason.trim();

  if (disposition === "Deferred") {
    return trimmedReason.length > 0;
  }

  return isDispositionRationaleSatisfied(reason);
}

const BULK_DISPOSITION_CONFIRM_LABELS: Record<BulkDisposition, string> = {
  Accepted: "Accept all selected findings",
  RejectedAsNotApplicable: "Waive all selected findings",
  Deferred: "Defer all selected findings",
};

/** Bulk accept / waive / defer for governance findings queue rows. */
export function GovernanceFindingsBulkActions(props: GovernanceFindingsBulkActionsProps) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [inlineErrorMessage, setInlineErrorMessage] = useState<string | null>(null);
  const [pendingDisposition, setPendingDisposition] = useState<BulkDisposition | null>(null);
  const router = useRouter();
  const trimmedReason = reason.trim();
  const acceptWaiveReasonReady = isDispositionRationaleSatisfied(reason);
  const deferReasonReady = trimmedReason.length > 0;

  if (props.selectedFindingIds.length === 0) {
    return null;
  }

  function requestDisposition(disposition: BulkDisposition): void {
    if (!isBulkDispositionReasonReady(disposition, reason)) {
      return;
    }

    setInlineErrorMessage(null);
    setPendingDisposition(disposition);
  }

  async function applyDisposition(disposition: BulkDisposition): Promise<void> {
    if (!isBulkDispositionReasonReady(disposition, reason)) {
      return;
    }

    setBusy(true);
    setInlineErrorMessage(null);

    const idempotencyKey = createGovernanceMutationIdempotencyKey();
    const findingIds = [...props.selectedFindingIds];

    try {
      const result = await recordBulkFindingDisposition(
        {
          findingIds,
          disposition,
          rationale: trimmedReason,
          revisitDueUtc: disposition === "Deferred" ? defaultDeferredRevisitDueUtc() : undefined,
        },
        { idempotencyKey },
      );

      const successMessage = governanceBulkDispositionSuccessMessage(result.processedCount, disposition);

      if (result.processedCount !== findingIds.length) {
        setInlineErrorMessage(GOVERNANCE_BULK_DISPOSITION_FAILURE_MESSAGE);

        return;
      }

      const undoRationale = `Undo: deferred for revisit after bulk ${disposition.toLowerCase()}.`;

      props.onDispositionSucceeded(successMessage, async () => {
        const undoResult = await recordBulkFindingDisposition(
          {
            findingIds,
            disposition: "Deferred",
            rationale: undoRationale,
            revisitDueUtc: defaultDeferredRevisitDueUtc(),
          },
          { idempotencyKey: createGovernanceMutationIdempotencyKey() },
        );

        if (undoResult.processedCount !== findingIds.length) {
          throw new Error(GOVERNANCE_BULK_DISPOSITION_FAILURE_MESSAGE);
        }

        props.onApplied();
        router.refresh();
      });
      props.onApplied();
      setReason("");
      setPendingDisposition(null);
      router.refresh();
    } catch (err) {
      setInlineErrorMessage(err instanceof Error ? err.message : GOVERNANCE_BULK_DISPOSITION_FAILURE_MESSAGE);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div
        className="flex flex-wrap items-end gap-3 rounded-lg border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40"
        data-testid="governance-findings-bulk-actions"
      >
        {inlineErrorMessage !== null ? (
          <OperatorMutationInlineError
            message={inlineErrorMessage}
            testId="governance-bulk-disposition-inline-error"
            className="w-full"
          />
        ) : null}

        <p className={cn("m-0 w-full font-medium text-neutral-900 dark:text-neutral-50", OPERATOR_TYPOGRAPHY.body)}>
          {props.selectedFindingIds.length} finding(s) selected
        </p>
        <div className="min-w-[16rem] flex-1">
          <Label htmlFor="bulk-disposition-reason">Shared reason</Label>
          <Input
            id="bulk-disposition-reason"
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);

              if (inlineErrorMessage !== null) {
                setInlineErrorMessage(null);
              }
            }}
            placeholder="Applies to all selected findings"
            disabled={busy}
            aria-describedby={acceptWaiveReasonReady ? undefined : "bulk-disposition-reason-helper"}
          />
          {!acceptWaiveReasonReady ? (
            <p
              id="bulk-disposition-reason-helper"
              className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
            >
              {trimmedReason.length === 0
                ? GOVERNANCE_BULK_DISPOSITION_REASON_REQUIRED
                : DISPOSITION_RATIONALE_REQUIRED_MESSAGE}
            </p>
          ) : null}
        </div>
        <Button
          type="button"
          size="sm"
          disabled={busy || !acceptWaiveReasonReady}
          onClick={() => requestDisposition("Accepted")}
        >
          Accept all
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy || !acceptWaiveReasonReady}
          onClick={() => requestDisposition("RejectedAsNotApplicable")}
        >
          Waive all
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy || !deferReasonReady}
          onClick={() => requestDisposition("Deferred")}
        >
          Defer all
        </Button>
      </div>

      <ConfirmationDialog
        open={pendingDisposition !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDisposition(null);
          }
        }}
        title="Confirm bulk disposition"
        description={
          pendingDisposition !== null
            ? `${BULK_DISPOSITION_CONFIRM_LABELS[pendingDisposition]} with the shared reason you entered.`
            : ""
        }
        confirmLabel="Apply disposition"
        variant="default"
        busy={busy}
        extraContent={
          pendingDisposition !== null ? (
            <div className="mt-2 space-y-2">
              <DispositionExportBeforeAfterPreview disposition={pendingDisposition} />
              <DispositionExportImpactNotice disposition={pendingDisposition} />
            </div>
          ) : null
        }
        reversibilityMutationId="governance_bulk_disposition"
        onConfirm={() => {
          if (pendingDisposition !== null) {
            void applyDisposition(pendingDisposition);
          }
        }}
      />
    </>
  );
}
