"use client";

import Link from "next/link";

import { formatUsd } from "@/components/BeforeAfterDelta/formatDelta";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { ProductLearningFeedbackControls } from "@/components/ProductLearningFeedbackControls";
import { SponsorArtifactEvidenceBadge } from "@/components/SponsorArtifactEvidenceBadge";
import { Button } from "@/components/ui/button";
import {
  OPERATOR_BODY_INLINE_LINK_CLASS,
  OPERATOR_LINK,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { PILOT_BASELINE_WIZARD_OPEN_EVENT } from "@/lib/pilot-baseline-wizard-events";
import { isProjectedUsdSponsorBadgeVisible } from "@/lib/pilot-proof-readiness";
import { cn } from "@/lib/utils";

import { EmailRunToSponsorExportActions } from "./EmailRunToSponsorExportActions";
import { EmailRunToSponsorReadinessCopy } from "./EmailRunToSponsorReadinessCopy";
import { useEmailRunToSponsorBanner } from "./use-email-run-to-sponsor-banner";

export type EmailRunToSponsorBannerProps = {
  runId: string;
  manifestId: string;
  /**
   * When true, show a one-click architecture review report DOCX (`GET /v1/runs/{runId}/export/docx`).
   * Prefer any committed finalized review — the former `architecture-review-board` artifact-id check was invalid (GUID routes).
   */
  sponsorDocxAvailable?: boolean;
  /**
   * Curated static demo / golden-path review — avoid “preparing…” copy that reads like an unresolved check in screenshots.
   */
  curatedSampleRun?: boolean;
  /** When true, {@link ReviewPackageDoThisNextStrip} owns the filled primary — demote package download CTAs. */
  pagePrimaryOwnedElsewhere?: boolean;
};

/**
 * Post-commit pilot ROI hub: primary PDF download (canonical sponsor projection), optional architecture review
 * report DOCX via {@link getRunPackageExportUrl}, plus links to Markdown, architecture package DOCX, ZIP
 * exports, and the in-product scorecard — no duplicate generation logic on the client.
 *
 * Render only when the server has confirmed a **Committed** manifest summary (see `runs/[reviewId]/page.tsx`).
 */
export function EmailRunToSponsorBanner({
  runId,
  manifestId,
  sponsorDocxAvailable = false,
  curatedSampleRun = false,
  pagePrimaryOwnedElsewhere = false,
}: EmailRunToSponsorBannerProps) {
  const proofPackZipVariant = pagePrimaryOwnedElsewhere ? "outline" : "primary";
  const banner = useEmailRunToSponsorBanner({ runId, manifestId, sponsorDocxAvailable, curatedSampleRun });

  return (
    <aside
      id="pilot-scorecard-package"
      data-testid="email-run-to-sponsor-banner"
      role="region"
      aria-label="Sponsor sponsor deliverables (downstream)"
      className="mb-6 rounded-md border border-neutral-200 bg-al-surface-raised dark:border-neutral-800 px-4 py-3"
    >
      <p className={cn("m-0 flex flex-wrap items-center font-semibold uppercase tracking-wide text-al-text-secondary dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
        <span>{banner.buyerPolishedShell ? "Downstream deliverable" : "Sponsor distribution"}</span>
        {banner.badgeDayN !== null ? (
          <span
            data-testid="email-run-to-sponsor-first-commit-badge"
            aria-label={`Day ${banner.badgeDayN} since your tenant's first finalized review record`}
            className={cn("ml-2 inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 font-medium text-al-text-primary dark:bg-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.helper)}
          >
            Day {banner.badgeDayN} since first finalization
          </span>
        ) : null}
        {banner.timeToFirstCommitHours !== null ? (
          <span
            data-testid="email-run-to-sponsor-time-to-first-commit"
            className={cn("ml-2 inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 font-medium text-al-text-primary dark:bg-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.helper)}
          >
            {banner.timeToFirstCommitHours.toFixed(2)} h to first finalization
          </span>
        ) : null}
        {banner.estimatedUsdSavings !== null
        && banner.proofGate.status === "ok"
        && isProjectedUsdSponsorBadgeVisible(banner.proofGate.payload) ? (
          <span
            data-testid="email-run-to-sponsor-estimated-usd-savings"
            className={cn("ml-2 inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 font-medium text-al-text-primary dark:bg-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.helper)}
          >
            {formatUsd(banner.estimatedUsdSavings)} projected savings (estimate)
          </span>
        ) : null}
        {banner.executionModeLabel !== null ? (
          <span
            data-testid="email-run-to-sponsor-execution-mode"
            className={cn("ml-2 inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 font-medium text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.helper)}
          >
            Execution mode: {banner.executionModeLabel}
          </span>
        ) : null}
      </p>

      <h2 className={cn("m-0 mt-2 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
        {banner.buyerPolishedShell ? "Create sponsor sponsor scorecard" : "Generate pilot scorecard package"}
      </h2>

      <p className={cn("m-0 mt-2 leading-relaxed text-neutral-800 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
        Sponsor narrative aligns with the{" "}
        <a
          className={OPERATOR_BODY_INLINE_LINK_CLASS}
          href={banner.executiveBriefHref}
          rel="noopener noreferrer"
          target="_blank"
        >
          sponsor sponsor brief
        </a>{" "}
        and conservative ROI framing in the{" "}
        <a
          className={OPERATOR_BODY_INLINE_LINK_CLASS}
          href={banner.pilotRoiModelHref}
          rel="noopener noreferrer"
          target="_blank"
        >
          pilot ROI estimate assumptions
        </a>
        .{banner.buyerPolishedShell ? " Downloads and readiness checks are split below." : " Use the exports below for export-ready collateral."}
      </p>

      {banner.proofGate.status === "ok" ? (
        <div className="mt-3">
          <SponsorArtifactEvidenceBadge
            isDemoTenant={banner.proofGate.payload.isDemoTenant}
            proofPackageCompleteness={banner.proofGate.payload.proofPackageCompleteness}
          />
        </div>
      ) : null}

      {banner.blockSponsorPdfForExecutionMode ? (
        <div
          role="alert"
          data-testid="email-run-to-sponsor-execution-mode-gap"
          className={cn("mt-3 rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 text-al-text-primary dark:border-amber-700/50", OPERATOR_TYPOGRAPHY.body)}
        >
          <p className="m-0 font-semibold">Execution mode blocks external sponsor PDF</p>
          <p className={cn("m-0 mt-1 leading-relaxed opacity-95", OPERATOR_TYPOGRAPHY.helper)}>
            This review is labeled{" "}
            <strong>{banner.executionModeLabel ?? "non-Real"}</strong>. Simulator, Fallback, and Mixed modes may be used for
            internal walkthroughs only — re-execute in Real mode or label exports explicitly before external sponsor send.
          </p>
        </div>
      ) : null}

      {banner.blockSponsorPdfForAiGate ? (
        <div
          role="alert"
          data-testid="email-run-to-sponsor-ai-readiness-gap"
          className={cn("mt-3 rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 text-al-text-primary dark:border-amber-700/50 px-3 py-2", OPERATOR_TYPOGRAPHY.body)}
        >
          <p className="m-0 font-semibold">AI readiness gate not satisfied</p>
          <p className={cn("m-0 mt-1 leading-relaxed opacity-95", OPERATOR_TYPOGRAPHY.helper)}>
            Strict AI quality signals failed for this review. Resolve faithfulness and citation gaps in the
            first-value report and observability summary before external sponsor PDF send on real-mode hosts.
          </p>
        </div>
      ) : null}

      {banner.blockSponsorPdfForProjectedDollar ? (
        <div
          role="alert"
          data-testid="email-run-to-sponsor-projected-dollar-gap"
          className={cn("mt-3 rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 text-al-text-primary dark:border-amber-700/50 px-3 py-2", OPERATOR_TYPOGRAPHY.body)}
        >
          <p className="m-0 font-semibold">Projected dollar claims not export-ready</p>
          <p className={cn("m-0 mt-1 leading-relaxed opacity-95", OPERATOR_TYPOGRAPHY.helper)}>
            ROI baseline fields are defaulted or incomplete. Capture buyer-provided baselines on{" "}
            <Link className={OPERATOR_BODY_INLINE_LINK_CLASS} href="/insights/architecture-scorecard#roi-baselines">
              the scorecard
            </Link>{" "}
            before downloading a sponsor PDF with dollar-led readouts.
          </p>
        </div>
      ) : null}

      {banner.blockSponsorPdfForRoi ? (
        <div
          role="alert"
          data-testid="email-run-to-sponsor-roi-baseline-gap"
          className={cn("mt-3 rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 text-al-text-primary dark:border-amber-700/50 px-3 py-2", OPERATOR_TYPOGRAPHY.body)}
        >
          <p className="m-0 font-semibold">Missing tenant ROI baselines</p>
          <p className={cn("m-0 mt-1 leading-relaxed opacity-95", OPERATOR_TYPOGRAPHY.helper)}>
            The sponsor PDF assumes captured review-cycle and manual-prep anchors from{" "}
            <a
              className={OPERATOR_BODY_INLINE_LINK_CLASS}
              href={banner.pilotRoiModelHref}
              rel="noopener noreferrer"
              target="_blank"
            >
              PILOT_ROI_MODEL §3
            </a>
            . Capture baselines before circulating this package externally.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                window.dispatchEvent(new Event(PILOT_BASELINE_WIZARD_OPEN_EVENT));
              }}
            >
              Guided baseline wizard
            </Button>
            <Link
              className={cn(OPERATOR_LINK.optional, "font-semibold")}
              href="/administration/baseline"
            >
              Baseline settings
            </Link>
          </div>
        </div>
      ) : null}

      <EmailRunToSponsorReadinessCopy
        buyerPolishedShell={banner.buyerPolishedShell}
        proofGate={banner.proofGate}
        curatedSampleRun={curatedSampleRun}
        readinessLoadingPhase={banner.readinessLoadingPhase}
        readinessCopy={banner.readinessCopy}
      />

      <EmailRunToSponsorExportActions
        runId={runId}
        manifestId={manifestId}
        proofPackZipVariant={proofPackZipVariant}
        sponsorDocxAvailable={sponsorDocxAvailable}
        curatedSampleRun={curatedSampleRun}
        buyerPolishedShell={banner.buyerPolishedShell}
        busy={banner.busy}
        markSentBusy={banner.markSentBusy}
        sentToSponsorUtc={banner.sentToSponsorUtc}
        blockSponsorPdf={banner.blockSponsorPdf}
        blockSponsorPdfForExecutionMode={banner.blockSponsorPdfForExecutionMode}
        blockSponsorPdfForAiGate={banner.blockSponsorPdfForAiGate}
        blockSponsorPdfForProjectedDollar={banner.blockSponsorPdfForProjectedDollar}
        blockSponsorPdfForRoi={banner.blockSponsorPdfForRoi}
        sponsorProofPackHref={banner.sponsorProofPackHref}
        SponsorReviewPacketHref={banner.SponsorReviewPacketHref}
        markdownHref={banner.markdownHref}
        onDownloadPdf={banner.onDownloadPdf}
        onMarkSentToSponsor={banner.onMarkSentToSponsor}
      />

      <div className="mt-3">
        {banner.buyerPolishedShell ? null : (
          <ProductLearningFeedbackControls
            runId={runId}
            subjectType="RunOutput"
            artifactHint="pilot-scorecard-package"
            patternKey="review-package:sponsor"
            detail={{ runId, manifestId, surface: "EmailRunToSponsorBanner" }}
            compact
            title="Did this review help your sponsor conversation?"
          />
        )}
      </div>

      {banner.markSentError !== null ? (
        <p className={cn("m-0 mt-2 font-medium text-amber-800 dark:text-amber-200", OPERATOR_TYPOGRAPHY.helper)} role="alert">
          {banner.markSentError}
        </p>
      ) : null}

      {banner.error !== null ? (
        <div className="mt-2">
          <OperatorApiProblem
            problem={banner.error.problem}
            fallbackMessage={banner.error.message}
            correlationId={banner.error.correlationId}
            variant="warning"
          />
        </div>
      ) : null}
    </aside>
  );
}
