"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { StatusTag } from "@/components/ui/status-tag";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import { recordSponsorPreliminaryArchitectureShare } from "@/lib/api/architecture-sponsor-sharing-api";
import type { BuildArchitectureCreatedHomeModelInput } from "@/lib/architecture/architecture-created-home-model";
import {
  ARCHITECTURE_SPONSOR_AUDIT_RECORDED,
  ARCHITECTURE_SPONSOR_COPY_SUMMARY_ACTION,
  ARCHITECTURE_SPONSOR_DISTINCTION_ASSESSMENT,
  ARCHITECTURE_SPONSOR_DISTINCTION_COMPLETENESS,
  ARCHITECTURE_SPONSOR_DISTINCTION_GOVERNANCE,
  ARCHITECTURE_SPONSOR_DISTINCTION_READINESS,
  ARCHITECTURE_SPONSOR_READINESS_INCOMPLETE_WARNING,
  ARCHITECTURE_SPONSOR_POLICY_BLOCKED,
  ARCHITECTURE_SPONSOR_PRELIMINARY_CONFIRMATION,
  ARCHITECTURE_SPONSOR_PRELIMINARY_DIALOG_DESCRIPTION,
  ARCHITECTURE_SPONSOR_PRELIMINARY_DIALOG_TITLE,
  ARCHITECTURE_SPONSOR_READINESS_HELPER,
  ARCHITECTURE_SPONSOR_READINESS_STATUS_LABELS,
  ARCHITECTURE_SPONSOR_READINESS_TITLE,
  ARCHITECTURE_SPONSOR_RESOLVE_READINESS_ACTION,
  ARCHITECTURE_SPONSOR_RESTRICTED_INFORMATION,
  ARCHITECTURE_SPONSOR_SHARE_PRELIMINARY_ACTION,
  ARCHITECTURE_SPONSOR_SHARING_PERMISSION_DENIED,
  ARCHITECTURE_SPONSOR_UNRESOLVED_HEADING,
} from "@/lib/architecture/architecture-sponsor-readiness-copy";
import {
  assessArchitectureSponsorReadiness,
  type SponsorReadinessStatus,
} from "@/lib/architecture/architecture-sponsor-readiness";
import { buildArchitectureSponsorShareMarkdown } from "@/lib/architecture/architecture-sponsor-preliminary-draft";
import { writeWorkItemBodyToClipboard } from "@/lib/copy-finding-as-work-item";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY, type EnterpriseStatusKind } from "@/lib/design-tokens";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import { REVIEWS_NEW_CREATE_ARCHITECTURE_HREF } from "@/lib/reviews-new-path-copy";
import { showError, showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";

export type ArchitectureSponsorSharingPanelProps = {
  readonly runId: string;
  readonly architecture: BuildArchitectureCreatedHomeModelInput;
  readonly architectureSourceText: string;
  readonly findings: readonly QuickDecisionFinding[];
};

function readinessStatusTagKind(status: SponsorReadinessStatus): EnterpriseStatusKind {
  switch (status) {
    case "ready":
      return "ready";

    case "needs-attention":
      return "needs-attention";

    case "preliminary-only":
      return "neutral";

    default: {
      const exhaustive: never = status;

      return exhaustive;
    }
  }
}

/** Collapsed sponsor-readiness and controlled preliminary sharing for architecture-creation review detail. */
export function ArchitectureSponsorSharingPanel(
  props: ArchitectureSponsorSharingPanelProps,
): React.JSX.Element {
  const canShare = useOperateCapability();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [overrideConfirmed, setOverrideConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);

  const assessment = useMemo(
    () =>
      assessArchitectureSponsorReadiness({
        architecture: props.architecture,
        architectureSourceText: props.architectureSourceText,
        findings: props.findings,
        canShare,
      }),
    [canShare, props.architecture, props.architectureSourceText, props.findings],
  );

  const resolveHref =
    assessment.issues.length > 0
      ? assessment.issues[0]?.resolveHref ?? REVIEWS_NEW_CREATE_ARCHITECTURE_HREF
      : REVIEWS_NEW_CREATE_ARCHITECTURE_HREF;

  const knownGaps = assessment.issues.map((issue) => issue.label);
  const requiresPreliminaryOverride = assessment.status !== "ready";

  async function copySponsorMarkdown(overrideAcknowledged: boolean, deliveryMethod: string): Promise<void> {
    setBusy(true);

    try {
      const siteOrigin = typeof window !== "undefined" ? window.location.origin : "";
      const markdown = buildArchitectureSponsorShareMarkdown({
        runId: props.runId,
        architectureName: props.architecture.architectureName,
        architectureOverview: props.architecture.architectureOverview,
        businessOutcome: props.architecture.businessOutcome,
        ownerLabel: props.architecture.ownerLabel,
        knownGaps,
        confidentialityLabel: assessment.confidentialityLabel,
        generatedAtIso: new Date().toISOString(),
        readinessStatus: assessment.status,
        siteOrigin,
      });

      const copied = await writeWorkItemBodyToClipboard(markdown);

      if (!copied) {
        showError("Could not copy sponsor summary");

        return;
      }

      await recordSponsorPreliminaryArchitectureShare(props.runId, {
        readinessStatus: assessment.status,
        knownGaps,
        overrideAcknowledged,
        confidentialityLabel: assessment.confidentialityLabel,
        deliveryMethod,
      });

      showSuccess(ARCHITECTURE_SPONSOR_AUDIT_RECORDED);
      setDialogOpen(false);
      setOverrideConfirmed(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sponsor share could not be recorded.";
      showError(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <details
      className="rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950"
      data-workspace-disclosure
      data-testid="architecture-sponsor-sharing-panel"
    >
      <summary className={cn("cursor-pointer list-none font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
        {ARCHITECTURE_SPONSOR_READINESS_TITLE}
      </summary>

      <div className="mt-3 space-y-4">
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {ARCHITECTURE_SPONSOR_READINESS_HELPER}
        </p>

        <div className="flex flex-wrap items-center gap-2" data-testid="architecture-sponsor-readiness-status">
          <StatusTag
            kind={readinessStatusTagKind(assessment.status)}
            label={ARCHITECTURE_SPONSOR_READINESS_STATUS_LABELS[assessment.status]}
          />
        </div>

        <dl className={cn("m-0 grid gap-2", OPERATOR_TYPOGRAPHY.helper)}>
          <div>
            <dt className="font-medium text-al-text-secondary">{ARCHITECTURE_SPONSOR_DISTINCTION_COMPLETENESS}</dt>
            <dd className="m-0 text-al-text-primary">{assessment.architectureCompletenessLabel}</dd>
          </div>
          <div>
            <dt className="font-medium text-al-text-secondary">{ARCHITECTURE_SPONSOR_DISTINCTION_READINESS}</dt>
            <dd className="m-0 text-al-text-primary">{ARCHITECTURE_SPONSOR_READINESS_STATUS_LABELS[assessment.status]}</dd>
          </div>
          <div>
            <dt className="font-medium text-al-text-secondary">{ARCHITECTURE_SPONSOR_DISTINCTION_GOVERNANCE}</dt>
            <dd className="m-0 text-al-text-primary">{assessment.governanceApprovalLabel}</dd>
          </div>
          <div>
            <dt className="font-medium text-al-text-secondary">{ARCHITECTURE_SPONSOR_DISTINCTION_ASSESSMENT}</dt>
            <dd className="m-0 text-al-text-primary">{assessment.assessmentCompletionLabel}</dd>
          </div>
        </dl>

        {assessment.issues.length > 0 ? (
          <div data-testid="architecture-sponsor-readiness-issues">
            <h3 className={cn("m-0 mb-2 text-sm font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
              {ARCHITECTURE_SPONSOR_UNRESOLVED_HEADING}
            </h3>
            <ul className={cn("m-0 list-disc space-y-1 pl-5", OPERATOR_TYPOGRAPHY.helper)}>
              {assessment.issues.map((entry) => (
                <li key={entry.id}>{entry.label}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {requiresPreliminaryOverride ? (
          <p
            className={cn("m-0", DESIGN_TOKENS.callout.warn, "p-3", OPERATOR_TYPOGRAPHY.body)}
            data-testid="architecture-sponsor-incomplete-warning"
          >
            {ARCHITECTURE_SPONSOR_READINESS_INCOMPLETE_WARNING}
          </p>
        ) : null}

        {assessment.sharingBlocked ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} role="status">
            {assessment.sharingBlockReason === "permission"
              ? ARCHITECTURE_SPONSOR_SHARING_PERMISSION_DENIED
              : assessment.sharingBlockReason === "policy"
                ? ARCHITECTURE_SPONSOR_POLICY_BLOCKED
                : ARCHITECTURE_SPONSOR_RESTRICTED_INFORMATION}
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {assessment.issues.length > 0 ? (
              <Button type="button" variant="primary" size="sm" asChild data-testid="architecture-sponsor-resolve">
                <Link href={resolveHref}>{ARCHITECTURE_SPONSOR_RESOLVE_READINESS_ACTION}</Link>
              </Button>
            ) : null}
            {requiresPreliminaryOverride ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setDialogOpen(true);
                }}
                data-testid="architecture-sponsor-share-preliminary"
              >
                {ARCHITECTURE_SPONSOR_SHARE_PRELIMINARY_ACTION}
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => {
                  void copySponsorMarkdown(false, "sponsor-summary");
                }}
                data-testid="architecture-sponsor-copy-summary"
              >
                {busy ? "Copying…" : ARCHITECTURE_SPONSOR_COPY_SUMMARY_ACTION}
              </Button>
            )}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-testid="architecture-sponsor-preliminary-dialog">
          <DialogHeader>
            <DialogTitle>{ARCHITECTURE_SPONSOR_PRELIMINARY_DIALOG_TITLE}</DialogTitle>
            <DialogDescription>{ARCHITECTURE_SPONSOR_PRELIMINARY_DIALOG_DESCRIPTION}</DialogDescription>
          </DialogHeader>

          <div
            className="rounded-md border border-neutral-200 bg-neutral-50 p-3 text-sm dark:border-neutral-800 dark:bg-neutral-900/40"
            data-testid="architecture-sponsor-preliminary-watermark"
          >
            <p className="m-0 font-semibold">Preliminary draft</p>
            <p className="m-0 mt-1">Not approved</p>
            <p className="m-0 mt-1">Known gaps: {knownGaps.join("; ") || "None listed"}</p>
            <p className="m-0 mt-1">
              Confidentiality: {assessment.confidentialityLabel ?? "Internal — preliminary architecture draft"}
            </p>
          </div>

          <div className="flex items-start gap-2">
            <Checkbox
              id="architecture-sponsor-preliminary-confirm"
              checked={overrideConfirmed}
              onCheckedChange={(checked) => {
                setOverrideConfirmed(checked === true);
              }}
              data-testid="architecture-sponsor-preliminary-confirm"
            />
            <Label htmlFor="architecture-sponsor-preliminary-confirm" className={OPERATOR_TYPOGRAPHY.body}>
              {ARCHITECTURE_SPONSOR_PRELIMINARY_CONFIRMATION}
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={!overrideConfirmed || busy}
              onClick={() => {
                void copySponsorMarkdown(true, "preliminary-draft");
              }}
              data-testid="architecture-sponsor-preliminary-submit"
            >
              {busy ? "Copying…" : ARCHITECTURE_SPONSOR_SHARE_PRELIMINARY_ACTION}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </details>
  );
}
