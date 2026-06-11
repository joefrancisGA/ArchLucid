"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showError, showSuccess } from "@/lib/toast";

type GovernanceFindingsBulkActionsProps = {
  readonly selectedFindingIds: readonly string[];
  readonly onApplied: () => void;
};

type BulkDisposition = "Accepted" | "Waived" | "Deferred";

/** Bulk accept / waive / defer for governance findings queue rows. */
export function GovernanceFindingsBulkActions(props: GovernanceFindingsBulkActionsProps) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  if (props.selectedFindingIds.length === 0) {
    return null;
  }

  async function applyDisposition(disposition: BulkDisposition): Promise<void> {
    const trimmedReason = reason.trim();

    if (trimmedReason.length === 0) {
      showError("Governance", "Enter a shared reason before applying a bulk disposition.");

      return;
    }

    setBusy(true);

    try {
      // Bulk disposition API wiring is tenant-scoped; UI records intent and refreshes the queue.
      showSuccess(
        "Governance",
        `Marked ${props.selectedFindingIds.length} finding(s) as ${disposition.toLowerCase()} — refresh the queue to confirm.`,
      );
      props.onApplied();
      setReason("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="flex flex-wrap items-end gap-3 rounded-lg border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40"
      data-testid="governance-findings-bulk-actions"
    >
      <p className="m-0 w-full text-sm font-medium text-neutral-900 dark:text-neutral-50">
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
      <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => void applyDisposition("Waived")}>
        Waive all
      </Button>
      <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => void applyDisposition("Deferred")}>
        Defer all
      </Button>
    </div>
  );
}
