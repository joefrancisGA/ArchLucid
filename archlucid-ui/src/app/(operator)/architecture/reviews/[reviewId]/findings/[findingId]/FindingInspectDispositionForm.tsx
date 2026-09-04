"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { useRef } from "react";

import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { DispositionExportBeforeAfterPreview } from "@/components/operator/DispositionExportBeforeAfterPreview";
import { DispositionExportImpactNotice } from "@/components/operator/DispositionExportImpactNotice";
import { type FindingDispositionKind } from "@/lib/api/governance-stickiness-api";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  dispositionTransitionCopy,
  markRemediatedTransitionCopy,
  remediationAssignmentTransitionCopy,
  REMEDIATION_OWNER_HELP,
  REMEDIATION_OWNER_LABEL,
} from "@/lib/findings/finding-governance-action-copy";
import {
  FINDING_APPLY_CHANGE_PREVIEW_OVERRIDE_LABEL,
  FINDING_APPLY_CHANGE_PREVIEW_REQUIRED_MESSAGE,
  findingApplyChangePreviewHref,
  isFindingApplyChangeDisposition,
} from "@/lib/findings/finding-apply-change-preview-gate";
import { incrementalRereviewAfterApplyHref } from "@/lib/review-quality/incremental-rereview-handoff";
import {
  dispositionRequiresRationale,
  DISPOSITION_RATIONALE_REQUIRED_MESSAGE,
  TRADE_OFF_ACKNOWLEDGMENT_REQUIRED_MESSAGE,
} from "@/lib/review-quality/finding-governance-gates";

import type { FindingInspectDispositionControlsViewModel } from "./use-finding-inspect-disposition-controls";

const DISPOSITION_OPTIONS: FindingDispositionKind[] = [
  "Accepted",
  "Deferred",
  "NeedsEvidence",
  "Remediated",
  "RejectedAsNotApplicable",
];

export type FindingInspectDispositionFormProps = Pick<
  FindingInspectDispositionControlsViewModel,
  | "findingId"
  | "runId"
  | "canMutate"
  | "assignedToUserId"
  | "setAssignedToUserId"
  | "remediationDueUtc"
  | "setRemediationDueUtc"
  | "disposition"
  | "setDisposition"
  | "rationale"
  | "setRationale"
  | "revisitDueUtc"
  | "setRevisitDueUtc"
  | "evidenceRequestText"
  | "setEvidenceRequestText"
  | "remediationOwnerError"
  | "setRemediationOwnerError"
  | "busyAction"
  | "pendingDispositionConfirm"
  | "setPendingDispositionConfirm"
  | "applyChangePreviewOverride"
  | "setApplyChangePreviewOverride"
  | "tradeOffAcknowledgment"
  | "setTradeOffAcknowledgment"
  | "showIncrementalRereviewLink"
  | "submitRemediationAssignment"
  | "submitDisposition"
  | "submitExplicitRemediation"
  | "currentDisposition"
  | "mutationDisabledHintId"
  | "mutationDisabledReason"
  | "pendingDispositionKind"
  | "pendingDispositionBlockedReason"
>;

export function FindingInspectDispositionForm(props: FindingInspectDispositionFormProps) {
  const {
    findingId,
    runId,
    canMutate,
    assignedToUserId,
    setAssignedToUserId,
    remediationDueUtc,
    setRemediationDueUtc,
    disposition,
    setDisposition,
    rationale,
    setRationale,
    revisitDueUtc,
    setRevisitDueUtc,
    evidenceRequestText,
    setEvidenceRequestText,
    remediationOwnerError,
    setRemediationOwnerError,
    busyAction,
    pendingDispositionConfirm,
    setPendingDispositionConfirm,
    applyChangePreviewOverride,
    setApplyChangePreviewOverride,
    tradeOffAcknowledgment,
    setTradeOffAcknowledgment,
    showIncrementalRereviewLink,
    submitRemediationAssignment,
    submitDisposition,
    submitExplicitRemediation,
    currentDisposition,
    mutationDisabledHintId,
    mutationDisabledReason,
    pendingDispositionKind,
    pendingDispositionBlockedReason,
  } = props;
  const rationaleRef = useRef<HTMLTextAreaElement | null>(null);

  return (
    <>
      <section id="finding-inspect-remediation-panel" className="space-y-3" aria-labelledby="governance-remediation-heading">
        <h3 id="governance-remediation-heading" className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Remediation assignment
        </h3>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {remediationAssignmentTransitionCopy()}
        </p>
        <label className="grid gap-1">
          <span className="font-medium">{REMEDIATION_OWNER_LABEL}</span>
          <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{REMEDIATION_OWNER_HELP}</span>
          <input
            className="rounded-md border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-950"
            value={assignedToUserId}
            onChange={(event) => {
              setAssignedToUserId(event.target.value);
              setRemediationOwnerError(null);
            }}
            aria-invalid={remediationOwnerError !== null}
            aria-describedby={remediationOwnerError !== null ? "remediation-owner-error" : undefined}
            data-testid="finding-remediation-assignee"
          />
          {remediationOwnerError !== null ? (
            <span id="remediation-owner-error" className="text-red-700 dark:text-red-400" role="alert">
              {remediationOwnerError}
            </span>
          ) : null}
        </label>
        <label className="grid gap-1">
          <span className="font-medium">Remediation due (local)</span>
          <input
            type="datetime-local"
            className="rounded-md border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-950"
            value={remediationDueUtc}
            onChange={(event) => setRemediationDueUtc(event.target.value)}
            data-testid="finding-remediation-due"
          />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="default"
            disabled={busyAction !== null || !canMutate}
            aria-describedby={mutationDisabledReason === null ? undefined : mutationDisabledHintId}
            onClick={() => void submitRemediationAssignment()}
            data-testid="finding-remediation-save"
            aria-busy={busyAction === "remediation"}
          >
            {busyAction === "remediation" ? "Saving remediation assignmentâ€¦" : "Save remediation assignment"}
          </Button>
        </div>
      </section>

      <section id="finding-inspect-disposition-panel" className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800" aria-labelledby="governance-disposition-heading">
        <h3 id="governance-disposition-heading" className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Disposition
        </h3>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Current state: <span className="font-medium text-al-text-primary">{currentDisposition}</span>
        </p>
        {currentDisposition !== "Open" ? (
          <div className="rounded-md border border-neutral-200 bg-neutral-50/80 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/40">
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              To amend this disposition, record a new rationale below. The original audit event stays on the evidence
              trail.
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-2"
              data-testid="finding-disposition-amend"
              onClick={() => {
                rationaleRef.current?.focus();
              }}
            >
              Amend disposition
            </Button>
          </div>
        ) : null}
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {dispositionTransitionCopy(disposition)}
        </p>
        <label className="grid gap-1">
          <span className="font-medium">Proposed disposition</span>
          <select
            className="rounded-md border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-950"
            value={disposition}
            onChange={(event) => setDisposition(event.target.value as FindingDispositionKind)}
          >
            {DISPOSITION_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          <span className="font-medium">Rationale</span>
          {dispositionRequiresRationale(disposition) ? (
            <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {DISPOSITION_RATIONALE_REQUIRED_MESSAGE}
            </span>
          ) : null}
          <textarea
            ref={rationaleRef}
            className="min-h-20 rounded-md border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-950"
            value={rationale}
            onChange={(event) => setRationale(event.target.value)}
          />
        </label>
        {disposition === "Accepted" ? (
          <label className="grid gap-1">
            <span className="font-medium">Trade-off you accept</span>
            <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {TRADE_OFF_ACKNOWLEDGMENT_REQUIRED_MESSAGE}
            </span>
            <textarea
              className="min-h-16 rounded-md border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-950"
              value={tradeOffAcknowledgment}
              onChange={(event) => setTradeOffAcknowledgment(event.target.value)}
              data-testid="finding-disposition-trade-off-ack"
            />
          </label>
        ) : null}
        {disposition === "Deferred" ? (
          <label className="grid gap-1">
            <span className="font-medium">Revisit due (local)</span>
            <input
              type="datetime-local"
              className="rounded-md border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-950"
              value={revisitDueUtc}
              onChange={(event) => setRevisitDueUtc(event.target.value)}
            />
          </label>
        ) : null}
        {disposition === "NeedsEvidence" ? (
          <label className="grid gap-1">
            <span className="font-medium">Evidence request</span>
            <textarea
              className="min-h-16 rounded-md border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-950"
              value={evidenceRequestText}
              onChange={(event) => setEvidenceRequestText(event.target.value)}
            />
          </label>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="default"
            disabled={busyAction !== null || !canMutate}
            aria-describedby={mutationDisabledReason === null ? undefined : mutationDisabledHintId}
            onClick={() => {
              setPendingDispositionConfirm("disposition");
            }}
            data-testid="finding-disposition-save"
            aria-busy={busyAction === "disposition"}
          >
            {busyAction === "disposition" ? "Saving dispositionâ€¦" : "Save disposition"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busyAction !== null || !canMutate}
            aria-describedby={mutationDisabledReason === null ? undefined : mutationDisabledHintId}
            onClick={() => {
              setPendingDispositionConfirm("mark-remediated");
            }}
            data-testid="finding-mark-remediated"
            aria-busy={busyAction === "mark-remediated"}
          >
            {busyAction === "mark-remediated" ? "Marking finding as remediatedâ€¦" : "Mark as remediated"}
          </Button>
        </div>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {markRemediatedTransitionCopy()}
        </p>
        {showIncrementalRereviewLink ? (
          <p className="m-0">
            <Link
              href={incrementalRereviewAfterApplyHref(runId, findingId)}
              className={OPERATOR_LINK.inline}
              data-testid="finding-incremental-rereview-link"
            >
              Run incremental re-review on the affected subgraph
            </Link>
          </p>
        ) : null}
      </section>

      <ConfirmationDialog
        open={pendingDispositionConfirm !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDispositionConfirm(null);
            setApplyChangePreviewOverride(false);
          }
        }}
        title="Confirm finding disposition"
        description="Review export impact before recording this disposition on the audit trail."
        confirmLabel="Record disposition"
        variant="default"
        busy={busyAction === "disposition" || busyAction === "mark-remediated"}
        confirmDisabled={pendingDispositionBlockedReason !== null}
        extraContent={
          pendingDispositionConfirm !== null ? (
            <div className="mt-2 space-y-2">
              <DispositionExportBeforeAfterPreview disposition={pendingDispositionKind} />
              <DispositionExportImpactNotice disposition={pendingDispositionKind} />
              {pendingDispositionBlockedReason !== null ? (
                <p className={cn("m-0 text-red-700 dark:text-red-400", OPERATOR_TYPOGRAPHY.helper)} role="alert">
                  {pendingDispositionBlockedReason}
                </p>
              ) : null}
              {isFindingApplyChangeDisposition(pendingDispositionKind) ? (
                <div className="space-y-2 rounded-md border border-neutral-200 p-3 dark:border-neutral-700">
                  <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                    {FINDING_APPLY_CHANGE_PREVIEW_REQUIRED_MESSAGE}
                  </p>
                  <Link
                    href={findingApplyChangePreviewHref(runId, findingId)}
                    className={OPERATOR_LINK.inline}
                    data-testid="finding-apply-change-preview-link"
                  >
                    Open impact preview for this finding
                  </Link>
                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={applyChangePreviewOverride}
                      onChange={(event) => {
                        setApplyChangePreviewOverride(event.target.checked);
                      }}
                      data-testid="finding-apply-change-preview-override"
                    />
                    <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                      {FINDING_APPLY_CHANGE_PREVIEW_OVERRIDE_LABEL}
                    </span>
                  </label>
                </div>
              ) : null}
            </div>
          ) : null
        }
        onConfirm={() => {
          const confirmKind = pendingDispositionConfirm;
          setPendingDispositionConfirm(null);

          if (confirmKind === "disposition") {
            void submitDisposition();
            return;
          }

          if (confirmKind === "mark-remediated") {
            void submitExplicitRemediation();
          }
        }}
      />
    </>
  );
}
