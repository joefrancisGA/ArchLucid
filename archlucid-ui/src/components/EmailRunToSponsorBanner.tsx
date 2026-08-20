"use client";

import Link from "next/link";

import { formatUsd } from "@/components/BeforeAfterDelta/formatDelta";
import { ExportTrackedAnchor } from "@/components/ExportTrackedAnchor";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { ProductLearningFeedbackControls } from "@/components/ProductLearningFeedbackControls";
import { SponsorArtifactEvidenceBadge } from "@/components/SponsorArtifactEvidenceBadge";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import {
  getArchitecturePackageDocxUrl,
  getBundleDownloadUrl,
  getRunExportDownloadUrl,
  getRunPackageExportUrl,
} from "@/lib/api";
import {
  OPERATOR_BODY_INLINE_LINK_CLASS,
  OPERATOR_CALLOUT_WARN_CLASS,
  OPERATOR_LINK,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { PILOT_BASELINE_WIZARD_OPEN_EVENT } from "@/lib/pilot-baseline-wizard-events";
import { isProjectedUsdSponsorBadgeVisible } from "@/lib/pilot-proof-readiness";
import { cn } from "@/lib/utils";
import { whyDisabledSampleReviewExport } from "@/lib/why-disabled-cta";

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
  const {
    busy,
    markSentBusy,
    sentToSponsorUtc,
    markSentError,
    error,
    badgeDayN,
    timeToFirstCommitHours,
    proofGate,
    estimatedUsdSavings,
    markdownHref,
    SponsorReviewPacketHref,
    sponsorProofPackHref,
    executiveBriefHref,
    pilotRoiModelHref,
    readinessLoadingPhase,
    onMarkSentToSponsor,
    onDownloadPdf,
    readinessCopy,
    buyerPolishedShell,
    blockSponsorPdfForRoi,
    blockSponsorPdfForProjectedDollar,
    blockSponsorPdfForAiGate,
    blockSponsorPdfForExecutionMode,
    blockSponsorPdf,
    executionModeLabel,
  } = useEmailRunToSponsorBanner({ runId, manifestId, sponsorDocxAvailable, curatedSampleRun });

  return (
    <aside
      id="pilot-scorecard-package"
      data-testid="email-run-to-sponsor-banner"
      role="region"
      aria-label="Sponsor sponsor deliverables (downstream)"
      className="mb-6 rounded-md border border-neutral-200 bg-al-surface-raised dark:border-neutral-800 px-4 py-3"
    >
      <p className={cn("m-0 flex flex-wrap items-center font-semibold uppercase tracking-wide text-teal-800 dark:text-teal-300", OPERATOR_TYPOGRAPHY.helper)}>
        <span>{buyerPolishedShell ? "Downstream deliverable" : "Sponsor distribution"}</span>
        {badgeDayN !== null ? (
          <span
            data-testid="email-run-to-sponsor-first-commit-badge"
            aria-label={`Day ${badgeDayN} since your tenant's first finalized review record`}
            className={cn("ml-2 inline-flex items-center rounded-full bg-teal-100 px-2 py-0.5 font-medium text-teal-900 dark:bg-teal-900 dark:text-teal-100", OPERATOR_TYPOGRAPHY.helper)}
          >
            Day {badgeDayN} since first finalization
          </span>
        ) : null}
        {timeToFirstCommitHours !== null ? (
          <span
            data-testid="email-run-to-sponsor-time-to-first-commit"
            className={cn("ml-2 inline-flex items-center rounded-full bg-teal-100 px-2 py-0.5 font-medium text-teal-900 dark:bg-teal-900 dark:text-teal-100", OPERATOR_TYPOGRAPHY.helper)}
          >
            {timeToFirstCommitHours.toFixed(2)} h to first finalization
          </span>
        ) : null}
        {estimatedUsdSavings !== null
        && proofGate.status === "ok"
        && isProjectedUsdSponsorBadgeVisible(proofGate.payload) ? (
          <span
            data-testid="email-run-to-sponsor-estimated-usd-savings"
            className={cn("ml-2 inline-flex items-center rounded-full bg-teal-100 px-2 py-0.5 font-medium text-teal-900 dark:bg-teal-900 dark:text-teal-100", OPERATOR_TYPOGRAPHY.helper)}
          >
            {formatUsd(estimatedUsdSavings)} projected savings (estimate)
          </span>
        ) : null}
        {executionModeLabel !== null ? (
          <span
            data-testid="email-run-to-sponsor-execution-mode"
            className={cn("ml-2 inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 font-medium text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.helper)}
          >
            Execution mode: {executionModeLabel}
          </span>
        ) : null}
      </p>

      <h2 className={cn("m-0 mt-2 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
        {buyerPolishedShell ? "Create sponsor sponsor scorecard" : "Generate pilot scorecard package"}
      </h2>

      <p className={cn("m-0 mt-2 leading-relaxed text-neutral-800 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
        Sponsor narrative aligns with the{" "}
        <a
          className={OPERATOR_BODY_INLINE_LINK_CLASS}
          href={executiveBriefHref}
          rel="noopener noreferrer"
          target="_blank"
        >
          sponsor sponsor brief
        </a>{" "}
        and conservative ROI framing in the{" "}
        <a
          className={OPERATOR_BODY_INLINE_LINK_CLASS}
          href={pilotRoiModelHref}
          rel="noopener noreferrer"
          target="_blank"
        >
          pilot ROI estimate assumptions
        </a>
        .{buyerPolishedShell ? " Downloads and readiness checks are split below." : " Use the exports below for export-ready collateral."}
      </p>

      {proofGate.status === "ok" ? (
        <div className="mt-3">
          <SponsorArtifactEvidenceBadge
            isDemoTenant={proofGate.payload.isDemoTenant}
            proofPackageCompleteness={proofGate.payload.proofPackageCompleteness}
          />
        </div>
      ) : null}

      {blockSponsorPdfForExecutionMode ? (
        <div
          role="alert"
          data-testid="email-run-to-sponsor-execution-mode-gap"
          className={cn("mt-3 rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 text-al-text-primary dark:border-amber-700/50", OPERATOR_TYPOGRAPHY.body)}
        >
          <p className="m-0 font-semibold">Execution mode blocks external sponsor PDF</p>
          <p className={cn("m-0 mt-1 leading-relaxed opacity-95", OPERATOR_TYPOGRAPHY.helper)}>
            This review is labeled{" "}
            <strong>{executionModeLabel ?? "non-Real"}</strong>. Simulator, Fallback, and Mixed modes may be used for
            internal walkthroughs only — re-execute in Real mode or label exports explicitly before external sponsor send.
          </p>
        </div>
      ) : null}

      {blockSponsorPdfForAiGate ? (
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

      {blockSponsorPdfForProjectedDollar ? (
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

      {blockSponsorPdfForRoi ? (
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
              href={pilotRoiModelHref}
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

      <h3 className={cn("m-0 mt-4 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>
        {buyerPolishedShell ? "Sponsor readiness (sample signals)" : "Sponsor readiness"}
      </h3>

      {proofGate.status === "skipped" ? null : proofGate.status === "loading" && curatedSampleRun ? (
        <p
          className={cn("m-0 mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="email-run-to-sponsor-readiness-sample-static"
        >
          {buyerPolishedShell ? (
            <>
              Sample walkthrough: sponsor readiness lines summarize pilot deltas when telemetry is connected — packages
              below are representative for this review.
            </>
          ) : (
            <>
              Sample review: readiness detail fills in when pilot deltas finish loading — export links below stay
              available for the walkthrough.
            </>
          )}
        </p>
      ) : proofGate.status === "loading" ? (
        <p
          className={cn("m-0 mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="email-run-to-sponsor-readiness-loading"
          aria-busy
        >
          {readinessLoadingPhase === "slow"
            ? "Still preparing sponsor package details — you can use the exports below in the meantime."
            : "Preparing sponsor package details…"}
        </p>
      ) : proofGate.status === "error" ? (
        <p
          className={cn("m-0 mt-2 font-medium text-amber-800 dark:text-amber-200", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="email-run-to-sponsor-readiness-error"
        >
          {buyerPolishedShell
            ? "Could not load every readiness signal — review outputs before sending to sponsors."
            : "Could not load every readiness signal — review the Markdown export above before sponsor send."}
        </p>
      ) : !readinessCopy ? (
        <p
          className={cn("m-0 mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="email-run-to-sponsor-readiness-incomplete"
        >
          {buyerPolishedShell
            ? "Readiness detail expands once pilot telemetry is fully connected."
            : "Readiness detail is unavailable — use the Markdown and ZIP exports on this page as the source of truth."}
        </p>
      ) : (
        <div
          data-testid="email-run-to-sponsor-readiness"
          data-readiness-variant={readinessCopy.variant}
          data-readiness-classification={readinessCopy.classification ?? ""}
          className={
            readinessCopy.variant === "blocked"
              ? cn("mt-2 px-3 py-2", OPERATOR_CALLOUT_WARN_CLASS)
              : readinessCopy.variant === "caveats"
                ? cn("mt-2 px-3 py-2", OPERATOR_CALLOUT_WARN_CLASS)
                : readinessCopy.variant === "ready"
                  ? cn(
                      "mt-2 rounded-md border border-teal-500 bg-white/90 px-3 py-2 text-teal-950 dark:border-teal-600 dark:bg-teal-950/30 dark:text-teal-50",
                      OPERATOR_TYPOGRAPHY.body,
                    )
                  : cn(
                      "mt-2 rounded-md border border-neutral-300 bg-neutral-50 px-3 py-2 text-neutral-900 dark:border-neutral-600 dark:bg-neutral-900/40 dark:text-neutral-100",
                      OPERATOR_TYPOGRAPHY.body,
                    )
          }
        >
          <p className="m-0 font-semibold leading-snug">{readinessCopy.title}</p>
          <p className={cn("m-0 mt-1 leading-relaxed opacity-90", OPERATOR_TYPOGRAPHY.helper)}>{readinessCopy.detail}</p>
        </div>
      )}

      <h3 className={cn("m-0 mt-5 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>
        {buyerPolishedShell ? "Primary package downloads" : "Download package"}
      </h3>

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <Button variant={proofPackZipVariant} asChild data-testid="email-run-to-sponsor-proof-pack-zip">
          <ExportTrackedAnchor href={sponsorProofPackHref} download={`sponsor-proof-pack-${runId}.zip`}>
            Download sponsor proof pack (ZIP)
          </ExportTrackedAnchor>
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={busy || blockSponsorPdf}
          onClick={() => void onDownloadPdf()}
          data-testid="email-run-to-sponsor-primary-action"
          aria-describedby={blockSponsorPdf ? "email-run-to-sponsor-pdf-block-hint" : undefined}
        >
          {busy
            ? "Preparing PDF…"
            : blockSponsorPdfForExecutionMode
              ? "Execution mode blocks PDF"
              : blockSponsorPdfForAiGate
              ? "AI readiness gate blocks PDF"
              : blockSponsorPdfForProjectedDollar
                ? "ROI basis blocks PDF"
                : blockSponsorPdfForRoi
                  ? "ROI baselines required for PDF"
                  : buyerPolishedShell
                    ? "Create sponsor scorecard (PDF)"
                    : "Generate pilot scorecard package"}
        </Button>
        {sponsorDocxAvailable && !curatedSampleRun ? (
          <Button variant="secondary" asChild>
            <ExportTrackedAnchor
              href={getRunPackageExportUrl(runId, "docx")}
              data-testid="email-run-to-sponsor-sponsor-docx"
            >
              Download Sponsor Export (DOCX)
            </ExportTrackedAnchor>
          </Button>
        ) : null}
        {sponsorDocxAvailable && curatedSampleRun ? (
          <div className="flex flex-col gap-1.5">
            <Button
              variant="secondary"
              disabled
              aria-describedby="email-run-to-sponsor-docx-disabled-hint"
              data-testid="email-run-to-sponsor-sponsor-docx"
            >
              Download Sponsor Export (DOCX)
            </Button>
            <WhyDisabledCtaHint
              id="email-run-to-sponsor-docx-disabled-hint"
              reason={whyDisabledSampleReviewExport()}
              testId="email-run-to-sponsor-docx-disabled-hint"
            />
          </div>
        ) : null}
        {sentToSponsorUtc !== null ? (
          <span className="inline-flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2">
            <StatusTag
              kind="ready"
              label="Sent to sponsor"
              data-testid="email-run-to-sponsor-sent-badge"
            />
            <time
              dateTime={sentToSponsorUtc}
              className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
            >
              Recorded at {sentToSponsorUtc}
            </time>
          </span>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={markSentBusy || blockSponsorPdf}
            onClick={() => void onMarkSentToSponsor()}
            data-testid="email-run-to-sponsor-mark-sent"
          >
            {markSentBusy ? "Recording…" : "Mark as sent to sponsor"}
          </Button>
        )}
        <span
          id="email-run-to-sponsor-pdf-block-hint"
          className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
        >
          {blockSponsorPdfForExecutionMode
            ? "PDF export stays disabled until execution mode is Real (or this is a labeled curated sample review)."
            : blockSponsorPdfForAiGate
            ? "PDF export stays disabled until strict AI quality readiness signals pass for this review."
            : blockSponsorPdfForProjectedDollar
              ? "PDF export stays disabled until ROI baselines are buyer-provided and projected-dollar claims are export-ready."
              : blockSponsorPdfForRoi
                ? "PDF export stays disabled until tenant ROI baselines are captured."
                : buyerPolishedShell
                  ? "Primary export is the sponsor one‑pager PDF — same storyline as the Markdown summary."
                  : "Step 1: generate the sponsor one‑pager PDF — same storyline as the Markdown narrative."}
        </span>
      </div>

      <ul className={cn("m-0 mt-3 list-none space-y-1.5 p-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
        <li>
          <a
            className={OPERATOR_BODY_INLINE_LINK_CLASS}
            href={SponsorReviewPacketHref}
            download={`archlucid-sponsor-review-packet-${runId}.md`}
            data-testid="email-run-to-sponsor-sponsor-review-packet"
          >
            {buyerPolishedShell ? "Sponsor review packet (one-click Markdown)" : "Sponsor review packet (Markdown)"}
          </a>
        </li>
        <li>
          <a
            className={OPERATOR_BODY_INLINE_LINK_CLASS}
            href={markdownHref}
            download={`archlucid-first-value-report-${runId}.md`}
          >
            {buyerPolishedShell ? "Sponsor value summary (Markdown)" : "First-value report (Markdown)"}
          </a>
        </li>
        <li>
          <a
            className={OPERATOR_BODY_INLINE_LINK_CLASS}
            href={getArchitecturePackageDocxUrl(runId)}
          >
            Architecture decision package (DOCX)
          </a>
        </li>
        <li>
          <a
            className={OPERATOR_BODY_INLINE_LINK_CLASS}
            href={getBundleDownloadUrl(manifestId)}
          >
            Review bundle (ZIP)
          </a>
          {" · "}
          <a
            className={OPERATOR_BODY_INLINE_LINK_CLASS}
            href={getRunExportDownloadUrl(runId)}
          >
            {buyerPolishedShell ? "Audit-ready review export (ZIP)" : "Architecture review export (ZIP)"}
          </a>
          {" · "}
          {buyerPolishedShell ? null : (
            <>
              <Link className={OPERATOR_BODY_INLINE_LINK_CLASS} href="/insights/architecture-scorecard">
                In-product pilot scorecard
              </Link>
              {" · "}
            </>
          )}
          <a className={OPERATOR_BODY_INLINE_LINK_CLASS} href="#artifacts-exports">
            {buyerPolishedShell ? "More export options on this review page" : "Artifacts &amp; exports on this page"}
          </a>
        </li>
      </ul>

      <div className="mt-3">
        {buyerPolishedShell ? null : (
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

      {markSentError !== null ? (
        <p className={cn("m-0 mt-2 font-medium text-amber-800 dark:text-amber-200", OPERATOR_TYPOGRAPHY.helper)} role="alert">
          {markSentError}
        </p>
      ) : null}

      {error !== null ? (
        <div className="mt-2">
          <OperatorApiProblem
            problem={error.problem}
            fallbackMessage={error.message}
            correlationId={error.correlationId}
            variant="warning"
          />
        </div>
      ) : null}
    </aside>
  );
}
