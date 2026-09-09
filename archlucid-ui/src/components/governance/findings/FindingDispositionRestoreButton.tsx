"use client";

import { useState } from "react";

import { FindingDispositionConflictPanel } from "@/components/governance/findings/FindingDispositionConflictPanel";
import { OperatorMutationInlineError } from "@/components/operator/OperatorMutationInlineError";
import { Button } from "@/components/ui/button";
import type { FindingDispositionKind } from "@/lib/api/governance-stickiness-api";
import {
  listFindingDispositions,
  recordFindingDisposition,
} from "@/lib/api/governance-stickiness-api-dispositions";
import { createGovernanceMutationIdempotencyKey } from "@/lib/governance/governance-mutation-idempotency-key";
import {
  readFindingDispositionConflictFromError,
  type FindingDispositionConflictDetail,
} from "@/lib/findings/finding-disposition-conflict";
import { resolveExpectedCurrentDispositionRowVersion } from "@/lib/findings/finding-expected-current-disposition-row-version";
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
  const [inlineErrorMessage, setInlineErrorMessage] = useState<string | null>(null);
  const [dispositionConflict, setDispositionConflict] = useState<FindingDispositionConflictDetail | null>(
    null,
  );
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
    <div className="space-y-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={busy}
        data-testid={`finding-disposition-restore-${props.findingId}`}
        onClick={() => {
          setBusy(true);
          setInlineErrorMessage(null);
          setDispositionConflict(null);

          void (async () => {
            try {
              const history = await listFindingDispositions(props.findingId);
              const expectedCurrentDispositionRowVersionBase64 = resolveExpectedCurrentDispositionRowVersion({
                latestHistoryEvent: history[0] ?? null,
              });

              await recordFindingDisposition(
                props.findingId,
                {
                  runId: props.runId,
                  disposition: restoreDisposition,
                  rationale: `Restore previous disposition after ${snapshot.appliedDisposition.toLowerCase()}.`,
                  revisitDueUtc: snapshot.revisitDueUtc,
                  ...(expectedCurrentDispositionRowVersionBase64 === undefined
                    ? {}
                    : { expectedCurrentDispositionRowVersionBase64 }),
                },
                { idempotencyKey: createGovernanceMutationIdempotencyKey() },
              );

              clearFindingDispositionRestoreSnapshot(props.findingId);
              props.onRestored?.();
            } catch (error: unknown) {
              const conflict = readFindingDispositionConflictFromError(error);

              if (conflict !== null) {
                setDispositionConflict(conflict);
                return;
              }

              setInlineErrorMessage(error instanceof Error ? error.message : "Restore could not be saved.");
            } finally {
              setBusy(false);
            }
          })();
        }}
      >
        {busy ? "Restoring…" : "Restore previous disposition"}
      </Button>
      {dispositionConflict !== null ? (
        <FindingDispositionConflictPanel
          conflict={dispositionConflict}
          onReload={() => {
            setDispositionConflict(null);
            props.onRestored?.();
          }}
          onDismiss={() => {
            setDispositionConflict(null);
          }}
          testId={`finding-disposition-restore-conflict-${props.findingId}`}
        />
      ) : null}
      {dispositionConflict === null && inlineErrorMessage !== null ? (
        <OperatorMutationInlineError
          message={inlineErrorMessage}
          testId={`finding-disposition-restore-error-${props.findingId}`}
        />
      ) : null}
    </div>
  );
}
