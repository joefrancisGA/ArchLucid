"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OperatorMutationInlineError } from "@/components/operator/OperatorMutationInlineError";
import { OperatorSuccessCallout } from "@/components/operator/OperatorSuccessCallout";
import { createGovernanceMutationIdempotencyKey } from "@/lib/governance-mutation-idempotency-key";
import {
  GOVERNANCE_BULK_DISPOSITION_FAILURE_MESSAGE,
  GOVERNANCE_BULK_DISPOSITION_REASON_REQUIRED,
  governanceBulkDispositionSuccessMessage,
} from "@/lib/governance-mutation-outcome-copy";
import { recordBulkFindingDisposition, type FindingDispositionKind } from "@/lib/api/governance-stickiness-api";

type GovernanceFindingsBulkActionsProps = {
  readonly selectedFindingIds: readonly string[];
  readonly onApplied: () => void;
};

type BulkDisposition = Extract<FindingDispositionKind, "Accepted" | "RejectedAsNotApplicable" | "Deferred">;

/** Bulk accept / waive / defer for governance findings queue rows. */
export function GovernanceFindingsBulkActions(props: GovernanceFindingsBulkActionsProps) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [inlineErrorMessage, setInlineErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  if (props.selectedFindingIds.length === 0) {
    return null;
  }

  async function applyDisposition(disposition: BulkDisposition): Promise<void> {
    const trimmedReason = reason.trim();

    if (trimmedReason.length === 0) {
      setSuccessMessage(null);
      setInlineErrorMessage(GOVERNANCE_BULK_DISPOSITION_REASON_REQUIRED);

      return;
    }

    setBusy(true);
    setInlineErrorMessage(null);
    setSuccessMessage(null);

    const idempotencyKey = createGovernanceMutationIdempotencyKey();

    try {
      const result = await recordBulkFindingDisposition(
        {
          findingIds: props.selectedFindingIds,
          disposition,
          rationale: trimmedReason,
        },
        { idempotencyKey },
      );

      setSuccessMessage(governanceBulkDispositionSuccessMessage(result.processedCount, disposition));
      props.onApplied();
      setReason("");
      router.refresh();
    } catch (err) {
      setInlineErrorMessage(err instanceof Error ? err.message : GOVERNANCE_BULK_DISPOSITION_FAILURE_MESSAGE);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="flex flex-wrap items-end gap-3 rounded-lg border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40"
      data-testid="governance-findings-bulk-actions"
    >
      {successMessage !== null ? (
        <OperatorSuccessCallout
          message={successMessage}
          testId="governance-bulk-disposition-success-callout"
          className="w-full"
          onDismiss={() => setSuccessMessage(null)}
        />
      ) : null}

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
          onChange={(event) => setReason(event.target.value)}
          placeholder="Applies to all selected findings"
          disabled={busy}
        />
      </div>
      <Button type="button" size="sm" disabled={busy} onClick={() => void applyDisposition("Accepted")}>
        Accept all
      </Button>
      <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => void applyDisposition("RejectedAsNotApplicable")}>
        Waive all
      </Button>
      <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => void applyDisposition("Deferred")}>
        Defer all
      </Button>
    </div>
  );
}
