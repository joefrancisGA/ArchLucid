"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { FindingDispositionKind } from "@/lib/api/governance-stickiness-api";
import { recordFindingDisposition } from "@/lib/api/governance-stickiness-api-dispositions";
import { createGovernanceMutationIdempotencyKey } from "@/lib/governance/governance-mutation-idempotency-key";
import {
  clearFindingDispositionRestoreSnapshot,
  readFindingDispositionRestoreSnapshot,
} from "@/lib/findings/finding-disposition-restore-snapshot";

export type FindingDispositionRestoreButtonProps = {
  readonly findingId: string;
  readonly runId: string;
  readonly onRestored?: () => void;
};

const RESTORABLE_DISPOSITIONS = new Set<FindingDispositionKind>(["Accepted", "RejectedAsNotApplicable"]);

/** Restore accept/waive within the 24-hour revisit window (durable, not toast-only). */
export function FindingDispositionRestoreButton(props: FindingDispositionRestoreButtonProps) {
  const [busy, setBusy] = useState(false);
  const snapshot = readFindingDispositionRestoreSnapshot(props.findingId);

  if (snapshot === null) {
    return null;
  }

  if (!RESTORABLE_DISPOSITIONS.has(snapshot.appliedDisposition)) {
    return null;
  }

  const restoreDisposition: FindingDispositionKind =
    snapshot.previousDisposition === "Deferred" || snapshot.previousDisposition === null
      ? "Deferred"
      : snapshot.previousDisposition;

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={busy}
      data-testid={`finding-disposition-restore-${props.findingId}`}
      onClick={() => {
        setBusy(true);

        void recordFindingDisposition(
          props.findingId,
          {
            runId: props.runId,
            disposition: restoreDisposition,
            rationale: `Restore previous disposition after ${snapshot.appliedDisposition.toLowerCase()}.`,
            revisitDueUtc: snapshot.revisitDueUtc,
          },
          { idempotencyKey: createGovernanceMutationIdempotencyKey() },
        )
          .then(() => {
            clearFindingDispositionRestoreSnapshot(props.findingId);
            props.onRestored?.();
          })
          .finally(() => {
            setBusy(false);
          });
      }}
    >
      {busy ? "Restoring…" : "Restore previous disposition"}
    </Button>
  );
}
