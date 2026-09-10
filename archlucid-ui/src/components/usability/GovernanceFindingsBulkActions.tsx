"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { useCallback, useEffect, useState, type SetStateAction } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { DispositionExportBeforeAfterPreview } from "@/components/operator/DispositionExportBeforeAfterPreview";
import { DispositionExportImpactNotice } from "@/components/operator/DispositionExportImpactNotice";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OperatorMutationInlineError } from "@/components/operator/OperatorMutationInlineError";
import { createGovernanceMutationIdempotencyKey } from "@/lib/governance/governance-mutation-idempotency-key";
import { computeFindingDispositionRevisitDueUtc } from "@/lib/findings/finding-disposition-revisit-window";
import {
  buildDispositionRestoreRevisitDueUtc,
  recordFindingDispositionRestoreSnapshot,
} from "@/lib/findings/finding-disposition-restore-snapshot";
import {
  GOVERNANCE_BULK_DISPOSITION_FAILURE_MESSAGE,
  GOVERNANCE_BULK_DISPOSITION_REASON_REQUIRED,
  governanceBulkDispositionSuccessMessage,
} from "@/lib/governance/governance-mutation-outcome-copy";
import {
  GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH,
  GOVERNANCE_FINDINGS_PATH,
} from "@/lib/governance/governance-route-paths";
import {
  governanceAssignedToMeBulkDispositionConfirmHrefFromSearch,
  governanceFindingsBulkDispositionConfirmHrefFromSearch,
  governanceFindingsBulkDispositionFromUrlValue,
  governanceFindingsBulkDispositionToUrlValue,
  parseGovernanceFindingsBulkDispositionConfirmFromSearch,
  type GovernanceFindingsBulkDisposition,
} from "@/lib/governance/governance-findings-bulk-disposition-confirm-url";
import { recordBulkFindingDisposition } from "@/lib/api/governance-stickiness-api";
import { findingBulkDispositionBlockedReason } from "@/lib/governance/finding-bulk-disposition-blocked-reason";
import { collectExpectedCurrentDispositionRowVersionByFindingId } from "@/lib/findings/finding-collect-expected-disposition-row-versions";
import { FindingDispositionConflictPanel } from "@/components/governance/findings/FindingDispositionConflictPanel";
import {
  formatFindingDispositionBulkConflictMessage,
  readFindingDispositionConflictFromError,
  type FindingDispositionConflictDetail,
} from "@/lib/findings/finding-disposition-conflict";

import { toApiLoadFailure } from "@/lib/api-load-failure";

export type BulkDispositionSucceededPayload = {
  readonly message: string;
  readonly undo?: () => Promise<void>;
  readonly correctionFindingIds: readonly string[];
};

type GovernanceFindingsBulkActionsProps = {
  readonly selectedFindingIds: readonly string[];
  readonly onApplied: () => void;
  readonly onDispositionSucceeded: (payload: BulkDispositionSucceededPayload) => void;
};

type BulkDisposition = Extract<GovernanceFindingsBulkDisposition, "Accepted" | "RejectedAsNotApplicable" | "Deferred">;

const BULK_DISPOSITION_CONFIRM_LABELS: Record<BulkDisposition, string> = {
  Accepted: "Accept all selected findings",
  RejectedAsNotApplicable: "Waive all selected findings",
  Deferred: "Defer all selected findings",
};

function isAssignedToMeFindingsPath(pathname: string): boolean {
  return pathname === GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH
    || pathname.startsWith(`${GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH}/`);
}

/** Bulk accept / waive / defer for policy findings queue rows. */
export function GovernanceFindingsBulkActions(props: GovernanceFindingsBulkActionsProps) {
  const router = useRouter();
  const pathname = usePathname() ?? GOVERNANCE_FINDINGS_PATH;
  const searchParams = useSearchParams();
  const bulkDispConfirmParam = searchParams.get("bulkDispConfirm");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [inlineErrorMessage, setInlineErrorMessage] = useState<string | null>(null);
  const [dispositionConflict, setDispositionConflict] = useState<FindingDispositionConflictDetail | null>(
    null,
  );
  const [pendingDisposition, setPendingDispositionState] = useState<BulkDisposition | null>(() => {
    const parsed = parseGovernanceFindingsBulkDispositionConfirmFromSearch(bulkDispConfirmParam);

    return parsed === null ? null : governanceFindingsBulkDispositionFromUrlValue(parsed);
  });

  const syncBulkDispConfirmToUrl = useCallback(
    (confirm: BulkDisposition | null) => {
      const nextHref = isAssignedToMeFindingsPath(pathname)
        ? governanceAssignedToMeBulkDispositionConfirmHrefFromSearch(
            searchParams.toString(),
            confirm === null ? null : governanceFindingsBulkDispositionToUrlValue(confirm),
          )
        : governanceFindingsBulkDispositionConfirmHrefFromSearch(
            searchParams.toString(),
            confirm === null ? null : governanceFindingsBulkDispositionToUrlValue(confirm),
            pathname,
          );

      router.replace(nextHref, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const setPendingDisposition = useCallback(
    (value: SetStateAction<BulkDisposition | null>) => {
      setPendingDispositionState((current) => {
        const next = typeof value === "function" ? value(current) : value;
        syncBulkDispConfirmToUrl(next);

        return next;
      });
    },
    [syncBulkDispConfirmToUrl],
  );

  useEffect(() => {
    const parsed = parseGovernanceFindingsBulkDispositionConfirmFromSearch(bulkDispConfirmParam);

    setPendingDispositionState(parsed === null ? null : governanceFindingsBulkDispositionFromUrlValue(parsed));
  }, [bulkDispConfirmParam]);

  const reasonReady = reason.trim().length > 0;

  if (props.selectedFindingIds.length === 0) {
    return null;
  }

  function requestDisposition(disposition: BulkDisposition): void {
    const trimmedReason = reason.trim();

    if (trimmedReason.length === 0) {
      return;
    }

    setInlineErrorMessage(null);
    setDispositionConflict(null);
    setPendingDisposition(disposition);
  }

  async function applyDisposition(disposition: BulkDisposition): Promise<void> {
    const trimmedReason = reason.trim();

    if (trimmedReason.length === 0) {
      return;
    }

    setBusy(true);
    setInlineErrorMessage(null);
    setDispositionConflict(null);

    const idempotencyKey = createGovernanceMutationIdempotencyKey();
    const findingIds = [...props.selectedFindingIds];

    try {
      const revisitDueUtc = computeFindingDispositionRevisitDueUtc();
      const expectedCurrentDispositionRowVersionBase64ByFindingId =
        await collectExpectedCurrentDispositionRowVersionByFindingId(findingIds);

      const result = await recordBulkFindingDisposition(
        {
          findingIds,
          disposition,
          rationale: trimmedReason,
          revisitDueUtc: disposition === "Deferred" ? revisitDueUtc : undefined,
          ...(Object.keys(expectedCurrentDispositionRowVersionBase64ByFindingId).length === 0
            ? {}
            : { expectedCurrentDispositionRowVersionBase64ByFindingId }),
        },
        { idempotencyKey },
      );

      if (disposition === "Accepted" || disposition === "RejectedAsNotApplicable") {
        const appliedAtUtc = new Date().toISOString();

        for (const findingId of findingIds) {
          recordFindingDispositionRestoreSnapshot({
            findingId,
            previousDisposition: null,
            appliedDisposition: disposition,
            appliedAtUtc,
            revisitDueUtc: buildDispositionRestoreRevisitDueUtc(),
          });
        }
      }

      const successMessage = governanceBulkDispositionSuccessMessage(result.processedCount, disposition);

      if (result.processedCount !== findingIds.length) {
        setInlineErrorMessage(GOVERNANCE_BULK_DISPOSITION_FAILURE_MESSAGE);

        return;
      }

      const undoRationale = `Undo: deferred for revisit after bulk ${disposition.toLowerCase()}.`;

      props.onDispositionSucceeded({
        message: successMessage,
        undo: async () => {
          const undoExpectedCurrentDispositionRowVersionBase64ByFindingId =
            result.currentDispositionRowVersionBase64ByFindingId
            ?? await collectExpectedCurrentDispositionRowVersionByFindingId(findingIds);

          const undoResult = await recordBulkFindingDisposition(
            {
              findingIds,
              disposition: "Deferred",
              rationale: undoRationale,
              revisitDueUtc: computeFindingDispositionRevisitDueUtc(),
              ...(Object.keys(undoExpectedCurrentDispositionRowVersionBase64ByFindingId).length === 0
                ? {}
                : {
                    expectedCurrentDispositionRowVersionBase64ByFindingId:
                      undoExpectedCurrentDispositionRowVersionBase64ByFindingId,
                  }),
            },
            { idempotencyKey: createGovernanceMutationIdempotencyKey() },
          );

          if (undoResult.processedCount !== findingIds.length) {
            throw new Error(GOVERNANCE_BULK_DISPOSITION_FAILURE_MESSAGE);
          }

          props.onApplied();
          router.refresh();
        },
        correctionFindingIds: findingIds,
      });
      props.onApplied();
      setReason("");
      setPendingDisposition(null);
      router.refresh();
    } catch (err) {
      const conflict = readFindingDispositionConflictFromError(err);

      if (conflict !== null) {
        setDispositionConflict(conflict);
        setInlineErrorMessage(null);
        return;
      }


      const failure = toApiLoadFailure(err);
      const blockedReason = findingBulkDispositionBlockedReason(failure);
      setInlineErrorMessage(
        blockedReason ?? (err instanceof Error ? err.message : GOVERNANCE_BULK_DISPOSITION_FAILURE_MESSAGE),
      );
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
            aria-describedby={reasonReady ? undefined : "bulk-disposition-reason-helper"}
          />
          {!reasonReady ? (
            <p
              id="bulk-disposition-reason-helper"
              className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
            >
              {GOVERNANCE_BULK_DISPOSITION_REASON_REQUIRED}
            </p>
          ) : null}
        </div>
        <Button
          type="button"
          size="sm"
          disabled={busy || !reasonReady}
          onClick={() => requestDisposition("Accepted")}
        >
          Accept all
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy || !reasonReady}
          onClick={() => requestDisposition("RejectedAsNotApplicable")}
        >
          Waive all
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy || !reasonReady}
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
              {dispositionConflict !== null ? (
                <FindingDispositionConflictPanel
                  conflict={dispositionConflict}
                  message={formatFindingDispositionBulkConflictMessage(dispositionConflict)}
                  onReload={() => {
                    setDispositionConflict(null);
                    setPendingDisposition(null);
                    props.onApplied();
                    router.refresh();
                  }}
                  onDismiss={() => {
                    setDispositionConflict(null);
                  }}
                  testId="governance-bulk-disposition-conflict"
                />
              ) : null}
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
