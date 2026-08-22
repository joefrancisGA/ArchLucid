"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { CommitRunButton } from "@/components/CommitRunButton";
import { ExportFormatWhenToUseHint } from "@/components/ExportFormatWhenToUseHint";
import { CopyIdButton } from "@/components/CopyIdButton";
import { InAppHelpLink } from "@/components/InAppHelpLink";
import { ContextualHelp } from "@/components/ContextualHelp";
import { StatusTag } from "@/components/ui/status-tag";
import { GovernanceStatusTag } from "@/components/governance/GovernanceStatusTag";
import { buyerLabelForAgentType } from "@/lib/agent-type-buyer-label";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { CORE_PILOT_PATH_STREAMLINED_LABELS, isStreamlinedCorePilotPath } from "@/lib/vocabulary/core-pilot-path-vocabulary";
import { useNavCommittedArchitectureReview } from "@/components/operator/OperatorNavAuthorityProvider";
import { RunStatusBadge } from "@/components/runs/RunStatusBadge";
import { StructuralExecutionModeBadge } from "@/components/StructuralExecutionModeBadge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { EXPORT_FORMAT_DOCX, EXPORT_FORMAT_PDF } from "@/lib/export-format-when-to-use";
import { RUN_PACKAGE_EXPORT_LABELS } from "@/lib/i18n";
import { runSponsorReportExportHref } from "@/lib/api/run-summary-export-api";
import {
  getRunPackageExportUrl,
  SAMPLE_REVIEW_EXPORT_UNAVAILABLE_HINT,
} from "@/lib/api/downloads-api";
import {
  MARKETING_TYPOGRAPHY,
  OPERATOR_DISCLOSURE_TRIGGER_CLASS,
  OPERATOR_LINK,
  OPERATOR_NAV_GROUP_LABEL,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import type { RunSummary } from "@/types/authority";

/** Shown instead of a live download link when the page is rendering curated sample data (no backend-persisted review). */
function BuyerSponsorBriefExports({ runId, usedStaticDemoRun }: { runId: string; usedStaticDemoRun: boolean }) {
  return (
    <details className="text-right">
      <summary className={cn("cursor-pointer list-none marker:content-none", OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_LINK.nav)}>
        Download sponsor brief
      </summary>
      <div className="mt-2">
        <RunPackageExportButtons runId={runId} usedStaticDemoRun={usedStaticDemoRun} />
      </div>
    </details>
  );
}

function DisabledExportButton({ label }: { label: string }) {
  return (
    <Button variant="outline" size="sm" disabled aria-describedby="run-detail-package-export-disabled-hint">
      <Download className="mr-2 h-4 w-4" />
      {label}
    </Button>
  );
}

function RunPackageExportButtons({
  runId,
  usedStaticDemoRun,
}: {
  runId: string;
  usedStaticDemoRun: boolean;
}) {
  if (usedStaticDemoRun) {
    return (
      <div className="mt-1 flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          <DisabledExportButton label={EXPORT_FORMAT_DOCX.label} />
          <DisabledExportButton label={EXPORT_FORMAT_PDF.label} />
          <DisabledExportButton label={RUN_PACKAGE_EXPORT_LABELS.html} />
          <DisabledExportButton label="Download Sponsor Report" />
        </div>
        <p
          id="run-detail-package-export-disabled-hint"
          className={cn("m-0 max-w-xs text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
        >
          {SAMPLE_REVIEW_EXPORT_UNAVAILABLE_HINT}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-1 flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <div className="flex max-w-[14rem] flex-col gap-1">
          <Button variant="outline" size="sm" asChild>
            <Link href={getRunPackageExportUrl(runId, "docx")} prefetch={false} target="_blank">
              <Download className="mr-2 h-4 w-4" />
              {EXPORT_FORMAT_DOCX.label}
            </Link>
          </Button>
          <ExportFormatWhenToUseHint format="docx" />
        </div>
        <div className="flex max-w-[14rem] flex-col gap-1">
          <Button variant="outline" size="sm" asChild>
            <Link href={getRunPackageExportUrl(runId, "pdf")} prefetch={false} target="_blank">
              <Download className="mr-2 h-4 w-4" />
              {EXPORT_FORMAT_PDF.label}
            </Link>
          </Button>
          <ExportFormatWhenToUseHint format="pdf" />
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={getRunPackageExportUrl(runId, "html")} prefetch={false} target="_blank">
            <Download className="mr-2 h-4 w-4" />
            {RUN_PACKAGE_EXPORT_LABELS.html}
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={runSponsorReportExportHref(runId)} prefetch={false} target="_blank">
            <Download className="mr-2 h-4 w-4" />
            Download Sponsor Report
          </Link>
        </Button>
      </div>
    </div>
  );
}

export type RunDetailPageHeaderProps = {
  runSummary: RunSummary;
  runId: string;
  /** Shown with copy affordance when the review has a finalized manifest. */
  manifestId?: string | null;
  headline: string;
  hasGoldenManifest: boolean;
  executionFlavorBuyerSummary?: string | null;
  /**
   * Buyer-polished: governance gate label mapped for display (for example Passed → Approved with monitoring).
   */
  buyerGovernanceApprovalLabel?: string | null;
  /** Buyer-polished: one sentence beside the finalized pipeline pill. */
  buyerHeaderStatusCaption?: string | null;
  commitBlockedReason?: string | null;
  /** Open governance alerts linked to this review (TB-107). */
  hasGovernanceWarnings?: boolean;
  /** True when this page rendered curated sample data instead of a backend-persisted review (no exportable run). */
  usedStaticDemoRun?: boolean;
  /** Demote finalize to outline when the summary header owns the single primary CTA (TB-618). */
  demoteFinalizeButton?: boolean;
};

/**
 * Run detail header: title, derived pipeline cues, finalize affordance (operators), buyer read-only finalization cues.
 */
export function RunDetailPageHeader({
  runSummary,
  runId,
  manifestId,
  headline,
  hasGoldenManifest,
  executionFlavorBuyerSummary,
  buyerGovernanceApprovalLabel,
  buyerHeaderStatusCaption,
  commitBlockedReason,
  hasGovernanceWarnings,
  usedStaticDemoRun = false,
  demoteFinalizeButton = false,
}: RunDetailPageHeaderProps) {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const hasCommittedArchitectureReview = useNavCommittedArchitectureReview();
  const streamlinedPilotPath = isStreamlinedCorePilotPath(hasCommittedArchitectureReview);
  const approvalStatusLabel = streamlinedPilotPath
    ? CORE_PILOT_PATH_STREAMLINED_LABELS.reviewApproval
    : "Resolve outcomes";
  const approvalCheckLabel = streamlinedPilotPath
    ? CORE_PILOT_PATH_STREAMLINED_LABELS.approvalCheck
    : "Approval check";
  const reviewWarningsLabel = streamlinedPilotPath
    ? CORE_PILOT_PATH_STREAMLINED_LABELS.reviewWarnings
    : "Review warnings";
  const finalizedBuyerChrome = buyerPolishedShell === true && hasGoldenManifest === true;
  const showExecutionFlavorOperator =
    Boolean(executionFlavorBuyerSummary) && buyerPolishedShell !== true;
  const trimmedManifestId = (manifestId ?? "").trim();
  const showOperatorIdentifiers = buyerPolishedShell !== true;

  return (
    <header className="mb-6 space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-start gap-2">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                <h1 className={cn("m-0 flex min-w-0 flex-1 items-center text-neutral-900 dark:text-neutral-100", MARKETING_TYPOGRAPHY.heroTitle)}>
                  {headline}
                  {runSummary.idempotencyReplayed && buyerPolishedShell !== true ? (
                    <StatusTag kind="in-progress" label="Replayed" className="ml-2" />
                  ) : null}
                </h1>
                {buyerPolishedShell === true && finalizedBuyerChrome === true ? (
                  <RunStatusBadge run={runSummary} />
                ) : null}
              </div>
              {buyerPolishedShell === true && finalizedBuyerChrome === true && buyerHeaderStatusCaption ? (
                <p className={cn("m-0 max-w-3xl leading-snug text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                  {buyerHeaderStatusCaption}
                </p>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <InAppHelpLink helpSlug="first-architecture-review" label="Architecture review steps — guide" />
            </div>
          </div>
          {buyerPolishedShell === true && executionFlavorBuyerSummary ? (
            <>
              <p className={cn("m-0 max-w-3xl leading-relaxed text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
                {executionFlavorBuyerSummary}
              </p>
              <p className={cn("m-0 mt-1 max-w-3xl leading-relaxed text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                In production, workflows and evidence sources follow your tenant configuration.
              </p>
              <p className={cn("m-0 mt-2 inline-flex max-w-3xl flex-wrap items-center gap-2 rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-2 font-medium dark:border-neutral-800", OPERATOR_TYPOGRAPHY.body)}>
                <span>Traceable evidence and audit-ready history</span>
                <Link
                  href={`/architecture/reviews/${encodeURIComponent(runId)}#trust-evidence`}
                  className={cn("font-semibold", OPERATOR_LINK.nav)}
                >
                  View evidence basis
                </Link>
              </p>
            </>
          ) : null}
          {showExecutionFlavorOperator ? (
            <p className={cn("m-0 max-w-3xl leading-relaxed text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
              {executionFlavorBuyerSummary}
            </p>
          ) : null}
          {runSummary.runDegradedExecution === true ||
          !(buyerPolishedShell === true && finalizedBuyerChrome === true) ? (
            <div className="flex flex-wrap items-center gap-2">
              {!(buyerPolishedShell === true && finalizedBuyerChrome === true) ? (
                <RunStatusBadge run={runSummary} />
              ) : null}
              {runSummary.runDegradedExecution === true ? (
                <StatusTag
                  kind="needs-attention"
                  label="Degraded execution"
                  title={
                    runSummary.degradedExecutionAgents?.length
                      ? `Resource-level LLM fallback on: ${runSummary.degradedExecutionAgents
                          .map((agent) => buyerLabelForAgentType(agent))
                          .join(", ")}`
                      : "This architecture review used simulator substitution and/or a degraded LLM execution path."
                  }
                />
              ) : null}
              {buyerPolishedShell !== true ? (
                <StructuralExecutionModeBadge structuralExecutionMode={runSummary.structuralExecutionMode} />
              ) : null}
            </div>
          ) : null}
          {showOperatorIdentifiers ? (
            <div
              className={cn("flex flex-wrap items-center gap-x-4 gap-y-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="run-detail-header-identifiers"
            >
              <span className="inline-flex min-w-0 items-center gap-1">
                <span className="font-medium text-neutral-700 dark:text-neutral-300">Review ID</span>
                <code className="max-w-[14rem] truncate font-mono">{runId}</code>
                <CopyIdButton value={runId} aria-label="Copy review ID" />
              </span>
              {trimmedManifestId.length > 0 ? (
                <span className="inline-flex min-w-0 items-center gap-1">
                  <span className="font-medium text-neutral-700 dark:text-neutral-300">Review record ID</span>
                  <code className="max-w-[14rem] truncate font-mono">{trimmedManifestId}</code>
                  <CopyIdButton value={trimmedManifestId} aria-label="Copy review record ID" />
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
        {buyerPolishedShell === true ? (
          finalizedBuyerChrome === true ? (
            <div className="flex shrink-0 flex-col items-end gap-2 text-right">
              {buyerGovernanceApprovalLabel !== null &&
              buyerGovernanceApprovalLabel !== undefined &&
              buyerGovernanceApprovalLabel.trim().length > 0 ? (
                <div className="flex flex-col items-end gap-1">
                  <p className={cn("m-0", OPERATOR_NAV_GROUP_LABEL)}>
                    {approvalStatusLabel}
                  </p>
                  <GovernanceStatusTag
                    status={buyerGovernanceApprovalLabel.trim()}
                    className={cn("font-semibold normal-case tracking-normal", OPERATOR_TYPOGRAPHY.helper)}
                  />
                </div>
              ) : (
                <p className={cn("m-0 font-semibold text-neutral-950 dark:text-neutral-50", OPERATOR_TYPOGRAPHY.body)}>Finalized package</p>
              )}
              {hasGoldenManifest ? (
                <BuyerSponsorBriefExports runId={runId} usedStaticDemoRun={usedStaticDemoRun} />
              ) : null}
            </div>
          ) : (
            <div id="finalize-review" className="flex shrink-0 scroll-mt-24 flex-col gap-1.5">
              <div className={cn("m-0 flex items-center gap-1.5 font-medium text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
                Finalize review
                <ContextualHelp helpKey="commit-manifest" />
              </div>
              {hasGovernanceWarnings === true ? (
                <StatusTag
                  kind="needs-attention"
                  label={reviewWarningsLabel}
                  data-testid="run-detail-commit-governance-warning-badge"
                />
              ) : null}
              <CommitRunButton
                runId={runId}
                disabled={hasGoldenManifest}
                commitBlockedReason={commitBlockedReason}
                buttonVariant={demoteFinalizeButton ? "outline" : "primary"}
              />
              {hasGoldenManifest ? (
                <BuyerSponsorBriefExports runId={runId} usedStaticDemoRun={usedStaticDemoRun} />
              ) : null}
              <div className={cn("m-0 flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                <span className="whitespace-nowrap">{approvalStatusLabel}</span>
                <ContextualHelp helpKey="governance-gate" placement="left" />
              </div>
            </div>
          )
        ) : (
          <div className="flex shrink-0 flex-col gap-1.5">
            <div className={cn("m-0 flex items-center gap-1.5 font-medium text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
              Finalize
              <ContextualHelp helpKey="commit-manifest" />
            </div>
            {hasGovernanceWarnings === true ? (
              <StatusTag
                kind="needs-attention"
                label={reviewWarningsLabel}
                data-testid="run-detail-commit-governance-warning-badge"
              />
            ) : null}
            <CommitRunButton
              runId={runId}
              disabled={hasGoldenManifest}
              commitBlockedReason={commitBlockedReason}
              buttonVariant={demoteFinalizeButton ? "outline" : "primary"}
            />
            {hasGoldenManifest ? (
              <RunPackageExportButtons runId={runId} usedStaticDemoRun={usedStaticDemoRun} />
            ) : null}
            <div className={cn("m-0 flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              <span className="whitespace-nowrap">{approvalCheckLabel}</span>
              <ContextualHelp helpKey="governance-gate" placement="left" />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
