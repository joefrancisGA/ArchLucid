"use client";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { IntegrationConnectChecklist } from "@/components/integrations/IntegrationConnectChecklist";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  createWaiverTransitionCopy,
  EVIDENCE_REFERENCE_HELP,
  EVIDENCE_REFERENCE_LABEL,
  EXCEPTION_OWNER_HELP,
  EXCEPTION_OWNER_LABEL,
  EXPIRATION_HELP,
  EXPIRATION_LABEL,
} from "@/lib/findings/finding-governance-action-copy";

import type { FindingInspectDispositionControlsViewModel } from "./use-finding-inspect-disposition-controls";

export type FindingInspectWaiverPanelProps = Pick<
  FindingInspectDispositionControlsViewModel,
  | "canMutate"
  | "history"
  | "activeWaiver"
  | "waiverRationale"
  | "setWaiverRationale"
  | "waiverOwnerUserId"
  | "setWaiverOwnerUserId"
  | "waiverExpiresAtUtc"
  | "setWaiverExpiresAtUtc"
  | "waiverEvidenceRef"
  | "setWaiverEvidenceRef"
  | "waiverOwnerError"
  | "setWaiverOwnerError"
  | "busyAction"
  | "pendingRevokeWaiverConfirm"
  | "setPendingRevokeWaiverConfirm"
  | "submitWaiver"
  | "revokeWaiver"
  | "mutationDisabledHintId"
  | "mutationDisabledReason"
  | "waiverCreateSteps"
  | "waiverCreateEmphasizedStepId"
>;

export function FindingInspectWaiverPanel(props: FindingInspectWaiverPanelProps) {
  const {
    canMutate,
    history,
    activeWaiver,
    waiverRationale,
    setWaiverRationale,
    waiverOwnerUserId,
    setWaiverOwnerUserId,
    waiverExpiresAtUtc,
    setWaiverExpiresAtUtc,
    waiverEvidenceRef,
    setWaiverEvidenceRef,
    waiverOwnerError,
    setWaiverOwnerError,
    busyAction,
    pendingRevokeWaiverConfirm,
    setPendingRevokeWaiverConfirm,
    submitWaiver,
    revokeWaiver,
    mutationDisabledHintId,
    mutationDisabledReason,
    waiverCreateSteps,
    waiverCreateEmphasizedStepId,
  } = props;

  return (
    <>
      <section id="finding-inspect-waiver-panel" className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800" aria-labelledby="governance-waiver-heading">
        <h3 id="governance-waiver-heading" className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Risk exception (waiver)
        </h3>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {createWaiverTransitionCopy()}
        </p>
        {activeWaiver ? (
          <p className="m-0 text-neutral-700 dark:text-neutral-300">
            Active waiver expires {activeWaiver.expiresAtUtc}  —  owner {activeWaiver.ownerUserId}
          </p>
        ) : (
          <>
            {canMutate ? (
              <IntegrationConnectChecklist
                title="Create waiver checklist"
                steps={waiverCreateSteps}
                emphasizedStepId={waiverCreateEmphasizedStepId}
                testIdPrefix="finding-waiver-create"
              />
            ) : null}
            <label className="grid gap-1">
              <span className="font-medium">{EXCEPTION_OWNER_LABEL}</span>
              <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{EXCEPTION_OWNER_HELP}</span>
              <input
                className="rounded-md border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-950"
                value={waiverOwnerUserId}
                onChange={(event) => {
                  setWaiverOwnerUserId(event.target.value);
                  setWaiverOwnerError(null);
                }}
                aria-invalid={waiverOwnerError !== null}
              />
              {waiverOwnerError !== null ? (
                <span className="text-red-700 dark:text-red-400" role="alert">
                  {waiverOwnerError}
                </span>
              ) : null}
            </label>
            <label className="grid gap-1">
              <span className="font-medium">Rationale</span>
              <textarea
                className="min-h-16 rounded-md border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-950"
                value={waiverRationale}
                onChange={(event) => setWaiverRationale(event.target.value)}
              />
            </label>
            <label className="grid gap-1">
              <span className="font-medium">{EVIDENCE_REFERENCE_LABEL}</span>
              <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{EVIDENCE_REFERENCE_HELP}</span>
              <input
                className="rounded-md border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-950"
                value={waiverEvidenceRef}
                onChange={(event) => setWaiverEvidenceRef(event.target.value)}
                placeholder="Artifact URI, ticket id, or audit correlation"
              />
            </label>
            <label className="grid gap-1">
              <span className="font-medium">{EXPIRATION_LABEL}</span>
              <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{EXPIRATION_HELP}</span>
              <input
                type="datetime-local"
                className="rounded-md border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-950"
                value={waiverExpiresAtUtc.slice(0, 16)}
                onChange={(event) => setWaiverExpiresAtUtc(new Date(event.target.value).toISOString())}
              />
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busyAction !== null || !canMutate}
                aria-describedby={mutationDisabledReason === null ? undefined : mutationDisabledHintId}
                onClick={() => void submitWaiver()}
                data-testid="finding-waiver-create"
                aria-busy={busyAction === "waiver"}
              >
                {busyAction === "waiver" ? "Creating waiverâ€¦" : "Create waiver"}
              </Button>
            </div>
          </>
        )}
        {activeWaiver ? (
          <div className="pt-2">
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={busyAction !== null || !canMutate}
              aria-describedby={mutationDisabledReason === null ? undefined : mutationDisabledHintId}
              onClick={() => {
                setPendingRevokeWaiverConfirm(true);
              }}
              data-testid="finding-waiver-revoke"
              aria-busy={busyAction === "revoke-waiver"}
            >
              {busyAction === "revoke-waiver" ? "Revoking waiverâ€¦" : "Revoke waiver"}
            </Button>
          </div>
        ) : null}
      </section>

      {history.length > 0 ? (
        <section className="space-y-2 border-t border-neutral-200 pt-4 dark:border-neutral-800">
          <h3 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Disposition history</h3>
          <ul className="m-0 list-disc space-y-1 pl-5">
            {history.map((event) => (
              <li key={event.eventId}>
                {event.disposition}  —  {event.occurredAtUtc}
                {event.rationale ? `  —  ${event.rationale}` : ""}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <ConfirmationDialog
        open={pendingRevokeWaiverConfirm}
        onOpenChange={(open) => {
          if (!open) {
            setPendingRevokeWaiverConfirm(false);
          }
        }}
        title="Revoke risk exception?"
        description="Revoking ends the active waiver for this finding. The revocation is recorded on the audit trail; the Finalized review record is not automatically changed."
        confirmLabel="Revoke waiver"
        variant="destructive"
        busy={busyAction === "revoke-waiver"}
        onConfirm={() => {
          void Promise.resolve(revokeWaiver()).finally(() => {
            setPendingRevokeWaiverConfirm(false);
          });
        }}
      />
    </>
  );
}
