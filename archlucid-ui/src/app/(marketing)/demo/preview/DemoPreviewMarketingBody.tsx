import Link from "next/link";

import { DemoPreviewGuidedCallouts } from "@/app/(marketing)/demo/preview/DemoPreviewGuidedCallouts";
import { AuthorityPipelineTimeline } from "@/components/AuthorityPipelineTimeline";
import { ExplanationEvidenceBasisBadges } from "@/components/ExplanationEvidenceBasisBadges";
import { ShowcaseOutcomeStrip } from "@/components/showcase/ShowcaseOutcomeStrip";
import { ShowcasePipelineReviewTrailCards } from "@/components/showcase/ShowcasePipelineReviewTrailCards";
import type { DemoCommitPagePreviewResponse } from "@/types/demo-preview";
import type { PipelineTimelineItem } from "@/types/authority";
import { getArtifactBusinessLabel, stripArtifactFilenameExtension } from "@/lib/artifact-review-helpers";
import { manifestStatusForDisplay } from "@/lib/manifest-status-display";
import { policyPackBuyerLabel } from "@/lib/policy-pack-buyer-label";
import { BUYER_OUTCOME_LED_VALUE_PROPOSITION } from "@/lib/buyer-polish-copy";
import { isBuyerSafeDemoMarketingChromeEnv } from "@/lib/demo-ui-env";
import { isStaticDemoPayloadFallbackActiveForRun } from "@/lib/operator-static-demo";
import {
  SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID,
  SHOWCASE_STATIC_DEMO_RUN_ID,
} from "@/lib/showcase-static-demo";
import { isDeterministicExplanationFallback } from "@/types/explanation";

/**
 * Customer-safe fallback when the demo preview route cannot load (no API routing, network error, or HTTP error).
 * Avoids env var names, internal URLs, and localhost hints — operators see diagnostics in server logs instead.
 */
export function DemoPreviewFriendlyUnavailable() {
  return (
    <div
      data-testid="demo-preview-friendly-unavailable"
      role="status"
      className="rounded border border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
    >
      <p className="m-0 font-medium text-neutral-900 dark:text-neutral-100">
        This preview is not available right now.
      </p>
      <p className="mt-2 m-0 text-neutral-600 dark:text-neutral-400">
        You can still explore a completed example output without signing in, or start from the product home.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href="/showcase/claims-intake-modernization"
          className="inline-flex rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white no-underline hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500"
        >
          View example output
        </Link>
        <Link
          href="/get-started"
          className="inline-flex rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 no-underline hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
        >
          Get started
        </Link>
      </div>
    </div>
  );
}

export function DemoPreviewNotAvailable() {
  return (
    <div
      data-testid="demo-preview-not-available"
      role="status"
      className="rounded border border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
    >
      <p className="font-medium text-neutral-900 dark:text-neutral-100">This live preview is not available on this site right now.</p>
      <p className="mt-2 text-neutral-600 dark:text-neutral-400">
        You can still open a completed sample output without signing in, or continue from the product home.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href="/showcase/claims-intake-modernization"
          className="inline-flex rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white no-underline hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500"
        >
          View example output
        </Link>
        <Link
          href="/see-it"
          className="inline-flex rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 no-underline hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
        >
          See it in 30 seconds
        </Link>
      </div>
    </div>
  );
}

function DemoStatusBanner({
  payload,
  buyerAudienceChrome,
}: {
  readonly payload: DemoCommitPagePreviewResponse;
  readonly buyerAudienceChrome: boolean;
}) {
  const runIdLabel = typeof payload.run?.runId === "string" ? payload.run.runId : "—";
  const generatedUtc = typeof payload.generatedUtc === "string" ? payload.generatedUtc : "—";

  if (buyerAudienceChrome) {
    return (
      <div
        data-testid="demo-preview-status-banner"
        className="rounded border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900/50 dark:text-neutral-200"
        role="status"
      >
        <span className="font-semibold">Sample review package</span>
        {" · "}
        <span className="text-neutral-600 dark:text-neutral-400">Claims Intake modernization (illustrative)</span>
      </div>
    );
  }

  return (
    <div
      data-testid="demo-preview-status-banner"
      className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200"
    >
      <span className="font-semibold">{payload.demoStatusMessage ?? "Demonstration preview"}</span> · review{" "}
      <code>{runIdLabel}</code> · generated{" "}
      <code>
        {generatedUtc === "—"
          ? "—"
          : new Date(generatedUtc).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
              timeZone: "UTC",
            })}
      </code>
    </div>
  );
}

/** Maps marketing preview timeline rows to operator pipeline timeline shape for shared timeline UI. */
function toAuthorityPipelineItems(
  timeline: DemoCommitPagePreviewResponse["pipelineTimeline"],
): PipelineTimelineItem[] {
  if (!Array.isArray(timeline)) {
    return [];
  }

  return timeline.map((e, index) => ({
    eventId:
      typeof e.eventId === "string" && e.eventId.trim().length > 0 ? e.eventId.trim() : `timeline-row-${index}`,
    occurredUtc: typeof e.occurredUtc === "string" ? e.occurredUtc : "",
    eventType: typeof e.eventType === "string" ? e.eventType : "",
    actorUserName: typeof e.actorUserName === "string" ? e.actorUserName : "",
    correlationId: e.correlationId ?? null,
  }));
}

export type DemoPreviewMarketingBodyProps = {
  readonly payload: DemoCommitPagePreviewResponse;
  /** Parent surfaces its own demo banner — omit duplicate banner noise on `/showcase`. */
  readonly suppressStatusBanner?: boolean;
  /**
   * When true (default), hide raw identifiers and engineer phrasing suitable for procurement viewers.
   * Pass false only in tests or tooling that assert fixture metadata.
   */
  readonly buyerAudienceChrome?: boolean;
};

/** Marketing-only commit page projection (no operator CTAs). */
export function DemoPreviewMarketingBody({
  payload,
  suppressStatusBanner = false,
  buyerAudienceChrome = true,
}: DemoPreviewMarketingBodyProps) {
  const demoMode = buyerAudienceChrome || isBuyerSafeDemoMarketingChromeEnv();
  const payloadRunId = typeof payload.run?.runId === "string" ? payload.run.runId.trim() : "";
  const isRunDetailAvailable = payloadRunId.length > 0 && isStaticDemoPayloadFallbackActiveForRun(payloadRunId);
  const chain = payload.authorityChain ?? {};
  const runEx = payload.runExplanation ?? null;
  const themeRaw = Array.isArray(runEx?.themeSummaries) ? runEx.themeSummaries : [];
  const themesDisplay = themeRaw.slice(0, 5).map((t) => (typeof t === "string" ? t : String(t)));
  const themes = themesDisplay.length > 0 ? themesDisplay.join(" · ") : "—";
  const citationCount =
    Array.isArray(runEx?.citations) && runEx.citations !== null ? runEx.citations.length : 0;
  const pipelineTimeline = Array.isArray(payload.pipelineTimeline) ? payload.pipelineTimeline : [];
  const pipelineItems = toAuthorityPipelineItems(pipelineTimeline);
  const artifacts = Array.isArray(payload.artifacts) ? payload.artifacts : [];
  const manifest = payload.manifest ?? null;

  return (
    <div className="space-y-8">
      <ShowcaseOutcomeStrip
        runId={typeof payload.run?.runId === "string" ? payload.run.runId : "—"}
        manifestId={manifest?.manifestId}
        primaryFindingId={
          typeof payload.run?.runId === "string" && payload.run.runId === SHOWCASE_STATIC_DEMO_RUN_ID
            ? SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID
            : undefined
        }
        isRunDetailAvailable={isRunDetailAvailable}
      />

      {suppressStatusBanner ? null : <DemoStatusBanner payload={payload} buyerAudienceChrome={demoMode} />}

      {demoMode ? (
        <p
          className="max-w-3xl text-sm leading-relaxed text-neutral-700 dark:text-neutral-300"
          data-testid="demo-preview-outcome-led-lead"
        >
          {BUYER_OUTCOME_LED_VALUE_PROPOSITION}
        </p>
      ) : null}

      <DemoPreviewGuidedCallouts />

      <section data-testid="demo-preview-run">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
          {demoMode ? "Sample review" : "Review"}
        </h2>
        {demoMode ? (
          <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">
            <strong>Review:</strong> Claims Intake Modernization Review
          </p>
        ) : (
          <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">
            <strong>Review ID:</strong>{" "}
            <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs dark:bg-neutral-800">
              {typeof payload.run?.runId === "string" ? payload.run.runId : "—"}
            </code>
          </p>
        )}
        {!demoMode ? (
          <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">
            <strong>Project:</strong> {payload.run?.projectId ?? "—"}
          </p>
        ) : null}
        {!demoMode ? (
          <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">
            <strong>Description:</strong> {payload.run?.description ?? ""}
          </p>
        ) : null}
        {!demoMode ? (
          <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">
            <strong>Created (UTC):</strong> {typeof payload.run?.createdUtc === "string" ? payload.run.createdUtc : "—"}
          </p>
        ) : null}
      </section>

      <section data-testid="demo-preview-review-trail">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
          {demoMode ? "Review lifecycle timeline" : "Review trail"}
        </h2>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          {demoMode
            ? "Key lifecycle milestones for this completed review — mirrors the in-product trail you will see after signing in (oldest first)."
            : "Audit milestones for this completed output — same timeline as the in-product review trail (oldest first)."}
        </p>
        <div className="mt-3 space-y-4" data-testid="demo-preview-pipeline-timeline">
          <ShowcasePipelineReviewTrailCards
            items={pipelineItems}
            runId={typeof payload.run?.runId === "string" ? payload.run.runId : "—"}
            goldenManifestId={manifest?.manifestId ?? chain.goldenManifestId}
            primaryFindingId={
              typeof payload.run?.runId === "string" && payload.run.runId === SHOWCASE_STATIC_DEMO_RUN_ID
                ? SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID
                : undefined
            }
          />
          <details className="rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-800">
            <summary className="cursor-pointer select-none font-medium text-neutral-900 dark:text-neutral-100">
              {demoMode ? "Full audit trail" : "Classic vertical timeline"}
            </summary>
            <div className="mt-3">
              <AuthorityPipelineTimeline items={pipelineItems} omitEventTechnicalDetails={demoMode} />
            </div>
          </details>
        </div>

        {demoMode ? (
          <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
            <Link className="text-teal-700 underline dark:text-teal-300" href="/auth/signin">
              Sign in
            </Link>{" "}
            to view the full interactive timeline in your workspace.
          </p>
        ) : (
          <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
            Show the full timeline after{" "}
            <Link className="text-teal-700 underline dark:text-teal-300" href="/auth/signin">
              opening in workspace
            </Link>
            .
          </p>
        )}

        <details className="mt-4 rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-800">
          <summary className="cursor-pointer select-none font-medium text-neutral-900 dark:text-neutral-100">
            Technical details
          </summary>
          <dl className="m-0 mt-3 grid gap-2 text-xs text-neutral-700 dark:text-neutral-300 sm:grid-cols-[minmax(10rem,auto)_1fr] sm:gap-x-4">
            <dt className="font-medium text-neutral-600 dark:text-neutral-400">Context snapshot ID</dt>
            <dd className="m-0 font-mono break-all">{chain.contextSnapshotId ?? "—"}</dd>
            <dt className="font-medium text-neutral-600 dark:text-neutral-400">Graph snapshot ID</dt>
            <dd className="m-0 font-mono break-all">{chain.graphSnapshotId ?? "—"}</dd>
            <dt className="font-medium text-neutral-600 dark:text-neutral-400">Findings snapshot ID</dt>
            <dd className="m-0 font-mono break-all">{chain.findingsSnapshotId ?? "—"}</dd>
            <dt className="font-medium text-neutral-600 dark:text-neutral-400">Reviewed manifest ID</dt>
            <dd className="m-0 font-mono break-all">{chain.goldenManifestId ?? "—"}</dd>
            <dt className="font-medium text-neutral-600 dark:text-neutral-400">Decision trace ID</dt>
            <dd className="m-0 font-mono break-all">{chain.decisionTraceId ?? "—"}</dd>
            <dt className="font-medium text-neutral-600 dark:text-neutral-400">Artifact bundle ID</dt>
            <dd className="m-0 font-mono break-all">{chain.artifactBundleId ?? "—"}</dd>
          </dl>
        </details>
      </section>

      <section data-testid="demo-preview-manifest-summary">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">Manifest summary</h2>
        {manifest?.operatorSummary ? (
          <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">{manifest.operatorSummary}</p>
        ) : null}
        {!manifest ? (
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">Manifest summary unavailable.</p>
        ) : (
          <>
            <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">
              <strong>Status:</strong> {manifestStatusForDisplay(manifest.status)}
            </p>
            <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">
              <strong>Policy pack:</strong> {policyPackBuyerLabel(manifest.ruleSetId ?? "", manifest.ruleSetVersion ?? "")}
            </p>
            <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">
              <strong>Decisions:</strong>{" "}
              {typeof manifest.decisionCount === "number" ? manifest.decisionCount : "—"}
            </p>
            <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">
              <strong>{demoMode ? "Monitored risks:" : "Warnings:"}</strong>{" "}
              {typeof manifest.warningCount === "number" ? manifest.warningCount : "—"}
            </p>
            <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">
              <strong>Unresolved issues:</strong>{" "}
              {typeof manifest.unresolvedIssueCount === "number" ? manifest.unresolvedIssueCount : "—"}
            </p>
          </>
        )}
      </section>

      <section data-testid="demo-preview-aggregate-explanation">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">Architecture review explanation</h2>
        <div
          className="mt-3 rounded-lg border border-teal-200 bg-teal-50/80 p-4 text-sm text-teal-950 dark:border-teal-900 dark:bg-teal-950/30 dark:text-teal-50"
          data-testid="demo-preview-sponsor-mode-summary"
        >
          <p className="m-0 text-xs font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-200">
            Sponsor-mode summary
          </p>
          <p className="mt-2 m-0">
            {runEx?.overallAssessment ??
              "This sample review shows how ArchLucid turns architecture evidence into a sponsor-readable risk narrative."}
          </p>
          <p className="mt-2 m-0 text-xs text-teal-800 dark:text-teal-200">
            Evidence basis: committed sample manifest, persisted citations, and demo-labeled review artifacts. Treat the
            story as illustrative until you run the same path on buyer evidence.
          </p>
          <div className="mt-3">
            <ExplanationEvidenceBasisBadges
              citationCount={citationCount}
              faithfulnessSupportRatio={runEx?.faithfulnessSupportRatio}
              deterministicFallbackUsed={runEx ? isDeterministicExplanationFallback(runEx) : false}
              demoDerived
            />
          </div>
        </div>
        <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">
          <strong>Overall assessment:</strong> {runEx?.overallAssessment ?? "—"}
        </p>
        <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">
          <strong>Risk posture:</strong> {runEx?.riskPosture ?? "—"}
        </p>
        <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">
          <strong>Themes (up to 5):</strong> {themes}
        </p>
        <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">
          <strong>Citation count:</strong> {citationCount}
        </p>
      </section>

      <section data-testid="demo-preview-artifacts">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
          {demoMode ? "Deliverables" : "Artifacts"}
        </h2>
        <div className="mt-2 overflow-x-auto rounded border border-neutral-200 dark:border-neutral-800">
          <table className="min-w-full text-left text-sm text-neutral-800 dark:text-neutral-200">
            <thead className="bg-neutral-100 text-xs uppercase tracking-wide text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400">
              <tr>
                <th className="px-3 py-2">{demoMode ? "Deliverable" : "Artifact"}</th>
                <th className="px-3 py-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {artifacts.map((a, index) => {
                const artifactKey =
                  typeof a.artifactId === "string" && a.artifactId.trim().length > 0
                    ? a.artifactId
                    : `artifact-${index}-${a.name ?? index}`;

                const typeLabel =
                  typeof a.artifactType === "string" && a.artifactType.trim().length > 0
                    ? getArtifactBusinessLabel(a.artifactType)
                    : "—";

                const createdLabel =
                  typeof a.createdUtc === "string"
                    ? new Date(a.createdUtc).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "—";

                return (
                  <tr
                    key={artifactKey}
                    className="border-t border-neutral-200 dark:border-neutral-800"
                    title={typeof a.contentHash === "string" ? `Content hash: ${a.contentHash}` : undefined}
                  >
                    <td
                      className="px-3 py-2"
                      title={
                        demoMode && typeof a.name === "string" && a.name.trim().length > 0
                          ? a.name.trim()
                          : undefined
                      }
                    >
                      <span className="font-medium">{typeLabel}</span>
                      {typeof a.name === "string" && a.name.trim().length > 0 ? (
                        <p className="m-0 mt-0.5 text-[11px] text-neutral-500 dark:text-neutral-400">
                          {demoMode ? stripArtifactFilenameExtension(a.name.trim()) : a.name.trim()}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-3 py-2">{createdLabel}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section data-testid="demo-preview-signup-cta" className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50">
        <h2 className="m-0 text-base font-semibold text-neutral-900 dark:text-neutral-50">
          Evaluate ArchLucid for your program
        </h2>
        <p className="mt-2 m-0 text-sm text-neutral-600 dark:text-neutral-400">
          Schedule an enterprise demo — bring your material and walk through a governed architecture review comparable to what you
          see here.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/pricing#pricing-quote-request"
            className="inline-flex rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white no-underline hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500"
            data-testid="demo-preview-cta-signup"
          >
            Schedule enterprise demo
          </Link>
          <Link
            href="/auth/signin"
            className="inline-flex rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 no-underline hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
          >
            Sign in
          </Link>
        </div>
      </section>

      <p
        data-testid="demo-preview-footer"
        className="border-t border-neutral-200 pt-3 text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-400"
      >
        Structured architecture review output — manifest, findings, and audit trail.
      </p>
    </div>
  );
}
