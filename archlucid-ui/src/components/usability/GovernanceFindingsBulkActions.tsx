"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showError, showSuccess } from "@/lib/toast";

type GovernanceFindingsBulkActionsProps = {
  readonly selectedFindingIds: readonly string[];
  readonly onApplied: () => void;
};

type BulkDisposition = "Accepted" | "RejectedAsNotApplicable" | "Deferred";

/** Bulk accept / waive / defer for governance findings queue rows. */
export function GovernanceFindingsBulkActions(props: GovernanceFindingsBulkActionsProps) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  if (props.selectedFindingIds.length === 0) {
    return null;
  }

  async function applyDisposition(disposition: BulkDisposition): Promise<void> {
    const trimmedReason = reason.trim();

    if (trimmedReason.length === 0) {
      showError("Enter a shared reason before applying a bulk disposition.");
      return;
    }

    setBusy(true);

    try {
      const response = await fetch("/api/proxy/v1/governance/findings/bulk-disposition", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          findingIds: props.selectedFindingIds,
          disposition,
          rationale: trimmedReason,
        }),
      });

      if (!response.ok) {
        throw new Error(`Bulk disposition failed: ${response.statusText}`);
      }

      showSuccess(
        `Marked ${props.selectedFindingIds.length} finding(s) as ${disposition === "RejectedAsNotApplicable" ? "waived" : disposition.toLowerCase()}.`,
      );
      props.onApplied();
      setReason("");
      router.refresh();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to apply bulk disposition.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="flex flex-wrap items-end gap-3 rounded-lg border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40"
      data-testid="governance-findings-bulk-actions"
    >
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
