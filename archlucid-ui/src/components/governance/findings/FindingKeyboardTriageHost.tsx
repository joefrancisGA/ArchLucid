"use client";

import { useCallback, useEffect, useState, type ReactElement, type SetStateAction } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { GovernanceRecordCorrectionDialog } from "@/components/governance/GovernanceRecordCorrectionDialog";
import { ReversibleMutationSuccessCallout } from "@/components/operator/ReversibleMutationSuccessCallout";
import { useReviewWorkbenchSelection } from "@/components/reviews/ReviewWorkbenchSelectionContext";
import { DispositionExportBeforeAfterPreview } from "@/components/operator/DispositionExportBeforeAfterPreview";
import { DispositionExportImpactNotice } from "@/components/operator/DispositionExportImpactNotice";
import { OperatorMutationInlineError } from "@/components/operator/OperatorMutationInlineError";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import { useGovernanceRecordCorrectionUrlSync } from "@/hooks/use-governance-record-correction-url-sync";
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
import { recordFindingDisposition, listFindingDispositions } from "@/lib/api/governance-stickiness-api";
import { isApiRequestError } from "@/lib/api-request-error";
import { FindingDispositionConflictPanel } from "@/components/governance/findings/FindingDispositionConflictPanel";
import {
  readFindingDispositionConflictDetail,
  type FindingDispositionConflictDetail,
} from "@/lib/findings/finding-disposition-conflict";
import { findingDispositionKindLabel } from "@/lib/disposition-export-before-after";
import { computeFindingDispositionRevisitDueUtc } from "@/lib/findings/finding-disposition-revisit-window";
import {
  buildDispositionRestoreRevisitDueUtc,
  recordFindingDispositionRestoreSnapshot,
} from "@/lib/findings/finding-disposition-restore-snapshot";
import { createGovernanceMutationIdempotencyKey } from "@/lib/governance/governance-mutation-idempotency-key";
import {
  GOVERNANCE_MUTATION_CORRECTION_SUCCESS_MESSAGE,
  type GovernanceMutationCorrectionTarget,
} from "@/lib/governance/governance-mutation-correction-api";
import {
  GOVERNANCE_BULK_DISPOSITION_FAILURE_MESSAGE,
  GOVERNANCE_BULK_DISPOSITION_REASON_REQUIRED,
  governanceKeyboardFindingDispositionSuccessMessage,
} from "@/lib/governance/governance-mutation-outcome-copy";
import {
  findingKeyboardTriageConfirmHrefFromSearch,
  findingKeyboardTriageDispositionToUrlAction,
  findingKeyboardTriageUrlActionToDisposition,
  parseFindingKeyboardTriageActionFromSearch,
  parseFindingKeyboardTriageFindingIdFromSearch,
} from "@/lib/governance/finding-keyboard-triage-confirm-url";
import {
  FindingKeyboardTriageProvider,
  type FindingKeyboardTriageContextValue,
} from "@/components/governance/findings/FindingKeyboardTriageContext";

export type FindingKeyboardTriageHostProps = {
  /** Resolves runId for the focused finding; return null to ignore the shortcut. */
  readonly resolveRunId: (findingId: string) => string | null;
  /** Return a user-facing reason when disposition must be blocked (e.g. merge conflict). */
  readonly resolveDispositionBlockedReason?: (findingId: string) => string | null;
  readonly onApplied?: () => void;
  readonly children?: React.ReactNode;
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
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const kbDispFindingIdParam = searchParams.get("kbDispFindingId");
  const kbDispActionParam = searchParams.get("kbDispAction");
  const workbenchSelection = useReviewWorkbenchSelection();
  const [pending, setPendingState] = useState<PendingKeyboardDisposition | null>(null);
  const [rationale, setRationale] = useState("");
  const [busy, setBusy] = useState(false);
  const [inlineErrorMessage, setInlineErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [successUndo, setSuccessUndo] = useState<(() => Promise<void>) | null>(null);
  const [successUndoBusy, setSuccessUndoBusy] = useState(false);
  const [correctionTarget, setCorrectionTarget] = useState<GovernanceMutationCorrectionTarget | null>(null);
  const { correctionDialogOpen, setCorrectionDialogOpen } = useGovernanceRecordCorrectionUrlSync({
    correctionTarget,
  });
  const [correctionRecorded, setCorrectionRecorded] = useState(false);
  const [dispositionConflict, setDispositionConflict] = useState<FindingDispositionConflictDetail | null>(null);
  const [expectedRowVersion, setExpectedRowVersion] = useState<string | null>(null);

  const syncKeyboardTriageConfirmToUrl = useCallback(
    (state: PendingKeyboardDisposition | null) => {
      if (pathname.length === 0) {
        return;
      }

      router.replace(
        findingKeyboardTriageConfirmHrefFromSearch(
          searchParams.toString(),
          state === null
            ? { findingId: null, action: null }
            : {
                findingId: state.findingId,
                action: findingKeyboardTriageDispositionToUrlAction(state.disposition),
              },
          pathname,
        ),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setPending = useCallback(
    (value: SetStateAction<PendingKeyboardDisposition | null>) => {
      setPendingState((current) => {
        const next = typeof value === "function" ? value(current) : value;
        syncKeyboardTriageConfirmToUrl(next);

        return next;
      });
    },
    [syncKeyboardTriageConfirmToUrl],
  );

  useEffect(() => {
    if (pending === null) {
      setExpectedRowVersion(null);
      setDispositionConflict(null);

      return;
    }

    let canceled = false;

    void (async () => {
      try {
        const history = await listFindingDispositions(pending.findingId);
        const latest = history[0];

        if (!canceled) {
          setExpectedRowVersion(latest?.currentDispositionRowVersionBase64 ?? null);
        }
      } catch {
        if (!canceled) {
          setExpectedRowVersion(null);
        }
      }
    })();

    return () => {
      canceled = true;
    };
  }, [pending]);

  useEffect(() => {
    const findingId = parseFindingKeyboardTriageFindingIdFromSearch(kbDispFindingIdParam);
    const action = parseFindingKeyboardTriageActionFromSearch(kbDispActionParam);

    if (findingId.length === 0 || action === null) {
      setPendingState(null);

      return;
    }

    const blockedReason = props.resolveDispositionBlockedReason?.(findingId) ?? null;

    if (blockedReason !== null && blockedReason.trim().length > 0) {
      return;
    }

    const runId = props.resolveRunId(findingId);

    if (runId === null || runId.trim().length === 0) {
      return;
    }

    const disposition = findingKeyboardTriageUrlActionToDisposition(action);

    if (
      pending?.findingId === findingId
      && pending.disposition === disposition
    ) {
      return;
    }

    setPendingState({ findingId, runId: runId.trim(), disposition });
    setRationale("");
    setInlineErrorMessage(null);
  }, [kbDispActionParam, kbDispFindingIdParam, pending?.disposition, pending?.findingId, props]);

  const onAction = useCallback(
    (findingId: string, disposition: FindingCardShortcutDisposition) => {
      const blockedReason = props.resolveDispositionBlockedReason?.(findingId) ?? null;

      if (blockedReason !== null && blockedReason.trim().length > 0) {
        setInlineErrorMessage(blockedReason);

        return;
      }

      const runId = props.resolveRunId(findingId);

      if (runId === null || runId.trim().length === 0) {
        return;
      }

      setInlineErrorMessage(null);
      setRationale("");
      setPending({ findingId, runId: runId.trim(), disposition });
    },
    [props, setPending],
  );

  const triageContextValue: FindingKeyboardTriageContextValue = {
    requestDisposition: onAction,
    isDispositionBlocked: (findingId) => props.resolveDispositionBlockedReason?.(findingId) ?? null,
    mutationsEnabled: canMutate,
  };

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
    setDispositionConflict(null);

    const appliedFindingId = pending.findingId;
    const appliedRunId = pending.runId;
    const appliedDisposition = pending.disposition;

    try {
      await recordFindingDisposition(
        appliedFindingId,
        {
          disposition: appliedDisposition,
          rationale: trimmedReason,
          runId: appliedRunId,
          expectedCurrentDispositionRowVersionBase64: expectedRowVersion ?? undefined,
        },
        { idempotencyKey: createGovernanceMutationIdempotencyKey() },
      );

      if (appliedDisposition === "Accepted" || appliedDisposition === "RejectedAsNotApplicable") {
        const appliedAtUtc = new Date().toISOString();

        recordFindingDispositionRestoreSnapshot({
          findingId: appliedFindingId,
          previousDisposition: null,
          appliedDisposition,
          appliedAtUtc,
          revisitDueUtc: buildDispositionRestoreRevisitDueUtc(),
        });
      }

      const undoRationale = `Undo: deferred for revisit after keyboard ${appliedDisposition.toLowerCase()}.`;

      setSuccessMessage(governanceKeyboardFindingDispositionSuccessMessage(appliedDisposition));
      setCorrectionRecorded(false);
      setCorrectionTarget({
        mutationKind: "governance_keyboard_finding_disposition",
        subjectId: appliedFindingId,
        runId: appliedRunId,
      });
      setSuccessUndo(async () => {
        await recordFindingDisposition(
          appliedFindingId,
          {
            disposition: "Deferred",
            rationale: undoRationale,
            runId: appliedRunId,
            revisitDueUtc: computeFindingDispositionRevisitDueUtc(),
          },
          { idempotencyKey: createGovernanceMutationIdempotencyKey() },
        );
        props.onApplied?.();
        router.refresh();
      });
      setPending(null);
      setRationale("");
      props.onApplied?.();
      router.refresh();
    } catch (err) {
      if (isApiRequestError(err) && err.httpStatus === 409) {
        const conflict = readFindingDispositionConflictDetail(err.problem);

        if (conflict !== null) {
          setDispositionConflict(conflict);
          setInlineErrorMessage(null);

          return;
        }
      }

      setInlineErrorMessage(err instanceof Error ? err.message : GOVERNANCE_BULK_DISPOSITION_FAILURE_MESSAGE);
    } finally {
      setBusy(false);
    }
  }

  const resolvedSuccessMessage =
    successMessage === null
      ? null
      : correctionRecorded
        ? `${successMessage} ${GOVERNANCE_MUTATION_CORRECTION_SUCCESS_MESSAGE}`
        : successMessage;

  return (
    <FindingKeyboardTriageProvider value={triageContextValue}>
      {props.children}
      <>
      <span hidden data-finding-keyboard-triage-host="" />
      {resolvedSuccessMessage !== null ? (
        <ReversibleMutationSuccessCallout
          message={resolvedSuccessMessage}
          mutationId="governance_keyboard_finding_disposition"
          testId="finding-keyboard-disposition-success-callout"
          className="mb-2"
          undoBusy={successUndoBusy}
          onDismiss={() => {
            setSuccessMessage(null);
            setSuccessUndo(null);
            setCorrectionTarget(null);
            setCorrectionRecorded(false);
          }}
          onUndo={
            successUndo !== null
              ? async () => {
                  setSuccessUndoBusy(true);

                  try {
                    await successUndo();
                    setSuccessMessage(null);
                    setSuccessUndo(null);
                    setCorrectionTarget(null);
                    setCorrectionRecorded(false);
                  } catch (undoError) {
                    setSuccessMessage(
                      undoError instanceof Error
                        ? undoError.message
                        : GOVERNANCE_BULK_DISPOSITION_FAILURE_MESSAGE,
                    );
                    setSuccessUndo(null);
                  } finally {
                    setSuccessUndoBusy(false);
                  }
                }
              : undefined
          }
          onRecordCorrection={
            correctionTarget !== null
              ? () => {
                  setCorrectionDialogOpen(true);
                }
              : undefined
          }
        />
      ) : null}

      <GovernanceRecordCorrectionDialog
        open={correctionDialogOpen}
        onOpenChange={setCorrectionDialogOpen}
        target={correctionTarget}
        onRecorded={() => {
          setCorrectionRecorded(true);
        }}
      />

      {pending === null ? null : (
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
            {dispositionConflict !== null ? (
              <FindingDispositionConflictPanel
                conflict={dispositionConflict}
                onReload={() => {
                  setDispositionConflict(null);
                  setPending(null);
                  setRationale("");
                  props.onApplied?.();
                  router.refresh();
                }}
                onDismiss={() => {
                  setDispositionConflict(null);
                }}
              />
            ) : null}
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
      )}
      </>
    </FindingKeyboardTriageProvider>
  );
}