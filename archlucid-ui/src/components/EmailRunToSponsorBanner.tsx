"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { SponsorArtifactEvidenceBadge } from "@/components/SponsorArtifactEvidenceBadge";
import { formatUsd } from "@/components/BeforeAfterDelta/formatDelta";
import { FunnelTelemetryExportAnchor } from "@/components/FunnelTelemetryExportAnchor";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { ProductLearningFeedbackControls } from "@/components/ProductLearningFeedbackControls";
import { Button } from "@/components/ui/button";
import {
  downloadFirstValueReportPdf,
  getArchitecturePackageDocxUrl,
  getArtifactDownloadUrl,
  getBundleDownloadUrl,
  getRunExportDownloadUrl,
} from "@/lib/api";
import type { ApiProblemDetails } from "@/lib/api-problem";
import { isApiRequestError } from "@/lib/api-request-error";
import { AUTH_MODE } from "@/lib/auth-config";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { DEFAULT_GITHUB_BLOB_BASE } from "@/lib/docs-public-base";
import { isJwtAuthMode } from "@/lib/oidc/config";
import { isLikelySignedIn } from "@/lib/oidc/session";
import {
  describeSponsorProofReadiness,
  type PilotRunDeltasProofSummaryJson,
} from "@/lib/pilot-proof-readiness";
import { isPilotRoiBaselineComplete } from "@/lib/pilot-roi-baseline-completeness";
import { PILOT_BASELINE_WIZARD_OPEN_EVENT } from "@/lib/pilot-baseline-wizard-events";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { recordSponsorBannerFirstCommitBadge } from "@/lib/sponsor-banner-telemetry";

export type EmailRunToSponsorBannerProps = {
  runId: string;
  manifestId: string;
  /**
   * When true, the committed manifest includes the `architecture-review-board` artifact — show a one-click sponsor DOCX download.
   */
  sponsorDocxAvailable?: boolean;
  /**
   * Curated static demo / golden-path review — avoid “preparing…” copy that reads like an unresolved check in screenshots.
   */
  curatedSampleRun?: boolean;
};

type TrialStatusPayload = {
  firstCommitUtc?: string | null;
  timeToFirstCommittedManifestTotalSeconds?: number | null;
};

type TenantBaselineRoiGatePayload = {
  baselineReviewCycleHours?: unknown;
  manualPrepHoursPerReview?: unknown;
};

type ProofGateState =
  | { status: "skipped" }
  | { status: "loading" }
  | { status: "error" }
  | { status: "ok"; payload: PilotRunDeltasProofSummaryJson };

function computeUtcDayN(firstCommitIso: string, nowMs: number): number | null {
  const commitMs = new Date(firstCommitIso).getTime();

  if (Number.isNaN(commitMs)) {
    return null;
  }

  const msPerDay = 24 * 60 * 60 * 1000;

  return Math.max(0, Math.floor((nowMs - commitMs) / msPerDay));
}

/**
 * Post-commit pilot ROI hub: primary PDF download (canonical sponsor projection), optional direct sponsor DOCX when the
 * committed manifest includes `architecture-review-board`, plus links to Markdown, architecture package DOCX, ZIP
 * exports, and the in-product scorecard — no duplicate generation logic on the client.
 *
 * Render only when the server has confirmed a **Committed** manifest summary (see `runs/[runId]/page.tsx`).
 */
export function EmailRunToSponsorBanner({
  runId,
  manifestId,
  sponsorDocxAvailable = false,
  curatedSampleRun = false,
}: EmailRunToSponsorBannerProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{
    message: string;
    problem: ApiProblemDetails | null;
    correlationId: string | null;
  } | null>(null);
  const [badgeDayN, setBadgeDayN] = useState<number | null>(null);
  const [timeToFirstCommitHours, setTimeToFirstCommitHours] = useState<number | null>(null);
  const [estimatedUsdSavings, setEstimatedUsdSavings] = useState<number | null>(null);
  const [proofGate, setProofGate] = useState<ProofGateState>({ status: "loading" });
  const [roiBaselineGate, setRoiBaselineGate] = useState<boolean | null>(null);
  const telemetrySentRef = useRef(false);
  const [readinessLoadingPhase, setReadinessLoadingPhase] = useState<"quick" | "slow">("quick");

  const markdownHref = `/api/proxy/v1/pilots/runs/${encodeURIComponent(runId)}/first-value-report`;
  const executiveReviewPacketHref = `/api/proxy/v1/pilots/runs/${encodeURIComponent(runId)}/executive-review-packet`;
  const sponsorProofPackHref = `/api/proxy/v1/pilots/runs/${encodeURIComponent(runId)}/sponsor-proof-pack.zip`;
  const executiveBriefHref = `${DEFAULT_GITHUB_BLOB_BASE}/docs/EXECUTIVE_SPONSOR_BRIEF.md`;
  const pilotRoiModelHref = `${DEFAULT_GITHUB_BLOB_BASE}/docs/library/PILOT_ROI_MODEL.md`;

  useEffect(() => {
    let cancelled = false;

    async function loadSidecars(): Promise<void> {
      if (AUTH_MODE !== "development-bypass" && isJwtAuthMode() && !isLikelySignedIn()) {
        if (!cancelled) {
          setProofGate({ status: "skipped" });
          setRoiBaselineGate(null);
        }

        return;
      }

      if (!cancelled) setProofGate({ status: "loading" });

      const headers = mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" } });
      const deltasUrl = `/api/proxy/v1/pilots/runs/${encodeURIComponent(runId)}/pilot-run-deltas`;

      try {
        const [trialRes, deltasRes, baselineRes] = await Promise.all([
          fetch("/api/proxy/v1/tenant/trial-status", headers),
          fetch(deltasUrl, headers),
          fetch("/api/proxy/v1/tenant/baseline", headers),
        ]);

        if (cancelled) return;

        if (baselineRes.ok) {
          try {
            const baselinePayload = (await baselineRes.json()) as TenantBaselineRoiGatePayload;

            if (!cancelled) {
              setRoiBaselineGate(
                isPilotRoiBaselineComplete({
                  baselineReviewCycleHours: baselinePayload.baselineReviewCycleHours,
                  manualPrepHoursPerReview: baselinePayload.manualPrepHoursPerReview,
                }),
              );
            }
          } catch {
            if (!cancelled) setRoiBaselineGate(null);
          }
        } else if (!cancelled) {
          setRoiBaselineGate(null);
        }

        if (trialRes.ok) {
          try {
            const json = (await trialRes.json()) as TrialStatusPayload;
            const iso = json.firstCommitUtc;

            if (typeof json.timeToFirstCommittedManifestTotalSeconds === "number" &&
                Number.isFinite(json.timeToFirstCommittedManifestTotalSeconds) &&
                json.timeToFirstCommittedManifestTotalSeconds > 0) {
              setTimeToFirstCommitHours(json.timeToFirstCommittedManifestTotalSeconds / 3600);
            } else {
              setTimeToFirstCommitHours(null);
            }

            if (typeof iso !== "string" || iso.length === 0) {
              setBadgeDayN(null);
            } else {
              const n = computeUtcDayN(iso, Date.now());

              if (n === null) {
                setBadgeDayN(null);
              } else {
                if (!telemetrySentRef.current) {
                  telemetrySentRef.current = true;
                  recordSponsorBannerFirstCommitBadge(n);
                }

                setBadgeDayN(n);
              }
            }
          } catch {
            /* badge optional */
          }
        }

        if (deltasRes.ok) {
          try {
            const deltasJson = (await deltasRes.json()) as PilotRunDeltasProofSummaryJson;

            if (typeof deltasJson.estimatedUsdSavings === "number" && Number.isFinite(deltasJson.estimatedUsdSavings)) {
              setEstimatedUsdSavings(deltasJson.estimatedUsdSavings);
            } else {
              setEstimatedUsdSavings(null);
            }

            if (!cancelled) setProofGate({ status: "ok", payload: deltasJson });
          } catch {
            if (!cancelled) setProofGate({ status: "error" });
          }
        } else if (!cancelled) {
          setProofGate({ status: "error" });
        }
      } catch {
        if (!cancelled) {
          setProofGate({ status: "error" });
          setRoiBaselineGate(null);
        }
      }
    }

    void loadSidecars();

    return () => {
      cancelled = true;
    };
  }, [runId]);

  useEffect(() => {
    if (proofGate.status !== "loading") {
      setReadinessLoadingPhase("quick");

      return;
    }

    setReadinessLoadingPhase("quick");
    const timer = window.setTimeout(() => {
      setReadinessLoadingPhase("slow");
    }, 6000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [proofGate.status]);

  async function onDownloadPdf(): Promise<void> {
    setBusy(true);
    setError(null);

    try {
      await downloadFirstValueReportPdf(runId);
    } catch (e: unknown) {
      if (isApiRequestError(e)) {
        setError({
          message: e.message,
          problem: e.problem,
          correlationId: e.correlationId,
        });
      } else {
        setError({
          message: e instanceof Error ? e.message : "Could not generate sponsor PDF.",
          problem: null,
          correlationId: null,
        });
      }
    } finally {
      setBusy(false);
    }
  }

  const readinessCopy = proofGate.status === "ok" ? describeSponsorProofReadiness(proofGate.payload) : null;

  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const blockSponsorPdfForRoi = roiBaselineGate === false && !curatedSampleRun;

  return (
    <aside
      id="pilot-scorecard-package"
      data-testid="email-run-to-sponsor-banner"
      role="region"
      aria-label="Executive sponsor deliverables (downstream)"
      className="mb-6 max-w-3xl rounded-md border border-teal-300 bg-teal-50 px-4 py-3 dark:border-teal-700 dark:bg-teal-950/40"
    >
      <p className="m-0 flex flex-wrap items-center text-[11px] font-semibold uppercase tracking-wide text-teal-800 dark:text-teal-300">
        <span>{buyerPolishedShell ? "Downstream deliverable" : "Sponsor distribution"}</span>
        {badgeDayN !== null ? (
          <span
            data-testid="email-run-to-sponsor-first-commit-badge"
            title="UTC days since your tenant's first finalized manifest"
            aria-label={`Day ${badgeDayN} since your tenant's first finalized manifest`}
            className="ml-2 inline-flex items-center rounded-full bg-teal-100 px-2 py-0.5 text-[11px] font-medium text-teal-900 dark:bg-teal-900 dark:text-teal-100"
          >
            Day {badgeDayN} since first finalization
          </span>
        ) : null}
        {timeToFirstCommitHours !== null ? (
          <span
            data-testid="email-run-to-sponsor-time-to-first-commit"
            className="ml-2 inline-flex items-center rounded-full bg-teal-100 px-2 py-0.5 text-[11px] font-medium text-teal-900 dark:bg-teal-900 dark:text-teal-100"
          >
            {timeToFirstCommitHours.toFixed(2)} h to first finalization
          </span>
        ) : null}
        {estimatedUsdSavings !== null ? (
          <span
            data-testid="email-run-to-sponsor-estimated-usd-savings"
            className="ml-2 inline-flex items-center rounded-full bg-teal-100 px-2 py-0.5 text-[11px] font-medium text-teal-900 dark:bg-teal-900 dark:text-teal-100"
          >
            {formatUsd(estimatedUsdSavings)} projected savings
          </span>
        ) : null}
      </p>

      <h2 className="m-0 mt-2 text-base font-semibold text-neutral-900 dark:text-neutral-50">
        {buyerPolishedShell ? "Create executive sponsor scorecard" : "Generate pilot scorecard package"}
      </h2>

      <p className="m-0 mt-2 text-sm leading-relaxed text-neutral-800 dark:text-neutral-100">
        Sponsor narrative aligns with the{" "}
        <a
          className="font-medium text-teal-800 underline underline-offset-2 dark:text-teal-300"
          href={executiveBriefHref}
          rel="noopener noreferrer"
          target="_blank"
        >
          executive sponsor brief
        </a>{" "}
        and conservative ROI framing in the{" "}
        <a
          className="font-medium text-teal-800 underline underline-offset-2 dark:text-teal-300"
          href={pilotRoiModelHref}
          rel="noopener noreferrer"
          target="_blank"
        >
          pilot ROI estimate assumptions
        </a>
        .{buyerPolishedShell ? " Downloads and readiness checks are split below." : " Use the exports below for sponsor-ready collateral."}
      </p>

      {proofGate.status === "ok" ? (
        <div className="mt-3">
          <SponsorArtifactEvidenceBadge
            isDemoTenant={proofGate.payload.isDemoTenant}
            proofPackageCompleteness={proofGate.payload.proofPackageCompleteness}
          />
        </div>
      ) : null}

      {blockSponsorPdfForRoi ? (
        <div
          role="alert"
          data-testid="email-run-to-sponsor-roi-baseline-gap"
          className="mt-3 rounded-md border border-amber-400 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-600 dark:bg-amber-950/40 dark:text-amber-50"
        >
          <p className="m-0 font-semibold">Missing tenant ROI baselines</p>
          <p className="m-0 mt-1 text-xs leading-relaxed opacity-95">
            The sponsor PDF assumes captured review-cycle and manual-prep anchors from{" "}
            <a
              className="font-medium text-teal-900 underline underline-offset-2 dark:text-teal-200"
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
              className="text-xs font-semibold text-teal-900 underline underline-offset-2 dark:text-teal-200"
              href="/settings/baseline"
            >
              Baseline settings
            </Link>
          </div>
        </div>
      ) : null}

      <h3 className="m-0 mt-4 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
        {buyerPolishedShell ? "Executive readiness (sample signals)" : "Sponsor readiness"}
      </h3>

      {proofGate.status === "skipped" ? null : proofGate.status === "loading" && curatedSampleRun ? (
        <p
          className="m-0 mt-2 text-xs text-neutral-600 dark:text-neutral-400"
          data-testid="email-run-to-sponsor-readiness-sample-static"
        >
          {buyerPolishedShell ? (
            <>
              Sample walkthrough: executive readiness lines summarize pilot deltas when telemetry is connected — packages
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
          className="m-0 mt-2 text-xs text-neutral-600 dark:text-neutral-400"
          data-testid="email-run-to-sponsor-readiness-loading"
          aria-busy
        >
          {readinessLoadingPhase === "slow"
            ? "Still preparing executive package details — you can use the exports below in the meantime."
            : "Preparing executive package details…"}
        </p>
      ) : proofGate.status === "error" ? (
        <p
          className="m-0 mt-2 text-xs font-medium text-amber-800 dark:text-amber-200"
          data-testid="email-run-to-sponsor-readiness-error"
        >
          {buyerPolishedShell
            ? "Could not load every readiness signal — review outputs before sending to sponsors."
            : "Could not load every readiness signal — review the Markdown export above before sponsor send."}
        </p>
      ) : !readinessCopy ? (
        <p
          className="m-0 mt-2 text-xs text-neutral-600 dark:text-neutral-400"
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
              ? "mt-2 rounded-md border border-amber-400 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-600 dark:bg-amber-950/50 dark:text-amber-50"
              : readinessCopy.variant === "caveats"
                ? "mt-2 rounded-md border border-yellow-500 bg-yellow-50 px-3 py-2 text-sm text-yellow-950 dark:border-yellow-600 dark:bg-yellow-950/40 dark:text-yellow-50"
                : readinessCopy.variant === "ready"
                  ? "mt-2 rounded-md border border-teal-500 bg-white/90 px-3 py-2 text-sm text-teal-950 dark:border-teal-600 dark:bg-teal-950/30 dark:text-teal-50"
                  : "mt-2 rounded-md border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 dark:border-neutral-600 dark:bg-neutral-900/40 dark:text-neutral-100"
          }
        >
          <p className="m-0 font-semibold leading-snug">{readinessCopy.title}</p>
          <p className="m-0 mt-1 text-xs leading-relaxed opacity-90">{readinessCopy.detail}</p>
        </div>
      )}

      <h3 className="m-0 mt-5 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
        {buyerPolishedShell ? "Primary package downloads" : "Download package"}
      </h3>

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <Button variant="primary" asChild data-testid="email-run-to-sponsor-proof-pack-zip">
          <FunnelTelemetryExportAnchor href={sponsorProofPackHref} download={`sponsor-proof-pack-${runId}.zip`}>
            Download sponsor proof pack (ZIP)
          </FunnelTelemetryExportAnchor>
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={busy || blockSponsorPdfForRoi}
          onClick={() => void onDownloadPdf()}
          data-testid="email-run-to-sponsor-primary-action"
          title={
            blockSponsorPdfForRoi
              ? "Capture tenant ROI baselines before generating the sponsor PDF."
              : undefined
          }
        >
          {busy
            ? "Preparing PDF…"
            : buyerPolishedShell
              ? "Create sponsor scorecard (PDF)"
              : "Generate pilot scorecard package"}
        </Button>
        {sponsorDocxAvailable ? (
          <Button variant="secondary" asChild>
            <FunnelTelemetryExportAnchor
              href={getArtifactDownloadUrl(manifestId, "architecture-review-board")}
              data-testid="email-run-to-sponsor-sponsor-docx"
            >
              Download Sponsor Export (DOCX)
            </FunnelTelemetryExportAnchor>
          </Button>
        ) : null}
        <span className="text-xs text-neutral-600 dark:text-neutral-400">
          {blockSponsorPdfForRoi
            ? "PDF export stays disabled until tenant ROI baselines are captured."
            : buyerPolishedShell
              ? "Primary export is the sponsor one‑pager PDF — same storyline as the Markdown summary."
              : "Step 1: generate the sponsor one‑pager PDF — same storyline as the Markdown narrative."}
        </span>
      </div>

      <ul className="m-0 mt-3 list-none space-y-1.5 p-0 text-xs text-neutral-700 dark:text-neutral-300">
        <li>
          <a
            className="font-medium text-teal-800 underline underline-offset-2 dark:text-teal-300"
            href={executiveReviewPacketHref}
            download={`archlucid-executive-review-packet-${runId}.md`}
            data-testid="email-run-to-sponsor-executive-review-packet"
          >
            {buyerPolishedShell ? "Executive review packet (one-click Markdown)" : "Executive review packet (Markdown)"}
          </a>
        </li>
        <li>
          <a
            className="font-medium text-teal-800 underline underline-offset-2 dark:text-teal-300"
            href={markdownHref}
            download={`archlucid-first-value-report-${runId}.md`}
          >
            {buyerPolishedShell ? "Executive value summary (Markdown)" : "First-value report (Markdown)"}
          </a>
        </li>
        <li>
          <a
            className="font-medium text-teal-800 underline underline-offset-2 dark:text-teal-300"
            href={getArchitecturePackageDocxUrl(runId)}
          >
            Architecture decision package (DOCX)
          </a>
        </li>
        <li>
          <a
            className="font-medium text-teal-800 underline underline-offset-2 dark:text-teal-300"
            href={getBundleDownloadUrl(manifestId)}
          >
            Manifest bundle (ZIP)
          </a>
          {" · "}
          <a
            className="font-medium text-teal-800 underline underline-offset-2 dark:text-teal-300"
            href={getRunExportDownloadUrl(runId)}
          >
            {buyerPolishedShell ? "Audit-ready review export (ZIP)" : "Architecture review export (ZIP)"}
          </a>
          {" · "}
          {buyerPolishedShell ? null : (
            <>
              <Link className="font-medium text-teal-800 underline underline-offset-2 dark:text-teal-300" href="/scorecard">
                In-product pilot scorecard
              </Link>
              {" · "}
            </>
          )}
          <a className="font-medium text-teal-800 underline underline-offset-2 dark:text-teal-300" href="#artifacts-exports">
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
            title="Did this review package help your sponsor conversation?"
          />
        )}
      </div>

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
