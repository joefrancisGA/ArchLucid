"use client";

import Link from "next/link";
import { useState } from "react";

import { CopyIdButton } from "@/components/CopyIdButton";
import { RunStatusBadge } from "@/components/RunStatusBadge";
import { Button } from "@/components/ui/button";
import { buyerFacingReviewTitleFromSummary } from "@/lib/buyer-facing-review-title";
import { BUYER_SURFACE_VOCABULARY } from "@/lib/buyer-surface-vocabulary";
import {
  isBuyerPolishedOperatorShellEnv,
  isBuyerSafeDemoMarketingChromeEnv,
  isNextPublicDemoMode,
} from "@/lib/demo-ui-env";
import { formatInstantForBuyerGovernance, formatInstantForLocale } from "@/lib/locale-datetime";
import { formatOperatorProjectIdDisplay } from "@/lib/operator-project-display";
import {
  getBuyerSafeReviewsTableLink,
  getBuyerSafeReviewsTableLinkForRun,
  getBuyerSafeSignedManifestTableLink,
  getCanonicalReviewWorkspaceHref,
  getShowcaseExecutiveHref,
  getShowcaseWalkthroughHref,
  isBuyerSafePrimaryReviewNavigationPreferred,
} from "@/lib/buyer-safe-review-navigation";
import { comparePageHrefAdaptive } from "@/lib/compare-url-query-params";
import { buyerDemoPackageCardMeta } from "@/lib/buyer-demo-package-card-meta";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { cn } from "@/lib/utils";
import {
  SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID,
  SHOWCASE_STATIC_DEMO_RUN_ID,
  SHOWCASE_STATIC_DEMO_SPINE_COUNTS,
} from "@/lib/showcase-static-demo";
import type { RunSummary } from "@/types/authority";

function snapshotLabel(ok: boolean | undefined): string {
  if (ok === true) {
    return "✓";
  }

  return "—";
}

export type RunInspectorPreviewProps = {
  run: RunSummary;
};

/**
 * Read-only run preview for list inspectors — uses only {@link RunSummary} fields from the list payload.
 */
export function RunInspectorPreview({ run }: RunInspectorPreviewProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [technicalOpen, setTechnicalOpen] = useState(false);
  const demoChrome = isNextPublicDemoMode() || isBuyerSafeDemoMarketingChromeEnv();
  const showcaseStory = canonicalizeDemoRunId(run.runId) === SHOWCASE_STATIC_DEMO_RUN_ID;
  const buyerSafePrimary = isBuyerSafePrimaryReviewNavigationPreferred(run.runId);
  const buyerPolished = isBuyerPolishedOperatorShellEnv();
  const primaryExplore = buyerPolished
    ? getBuyerSafeReviewsTableLinkForRun(run)
    : getBuyerSafeReviewsTableLink(run.runId);
  const signedManifestExplore = getBuyerSafeSignedManifestTableLink(run.runId);
  const workspaceHref = getCanonicalReviewWorkspaceHref(run.runId);
  const showcaseWalkthroughHref = getShowcaseWalkthroughHref();
  const showcaseUseWorkspaceQuickLinks = showcaseStory && buyerPolished;
  const headline = buyerFacingReviewTitleFromSummary(run);
  const createdLabel = showcaseStory
    ? demoChrome
      ? "Sample finalized (illustrative)"
      : formatInstantForBuyerGovernance(run.createdUtc)
    : buyerPolished
      ? formatInstantForBuyerGovernance(run.createdUtc)
      : formatInstantForLocale(run.createdUtc);
  const compareHref = comparePageHrefAdaptive(run.runId);
  const graphEvidenceHref = `/graph?runId=${encodeURIComponent(run.runId)}`;
  const replayHref = `/replay?runId=${encodeURIComponent(run.runId)}`;
  const manifestHref = signedManifestExplore.href;
  const findingHref = showcaseStory
    ? showcaseUseWorkspaceQuickLinks
      ? `${workspaceHref}/findings/${encodeURIComponent(SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID)}`
      : showcaseWalkthroughHref
    : `${workspaceHref}/findings/${encodeURIComponent(SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID)}`;
  const artifactNote =
    showcaseStory && demoChrome
      ? `${SHOWCASE_STATIC_DEMO_SPINE_COUNTS.decisionCount} decisions · ${SHOWCASE_STATIC_DEMO_SPINE_COUNTS.findingCount} findings · ${
          SHOWCASE_STATIC_DEMO_SPINE_COUNTS.warningCount
        } ${buyerPolished ? "monitored risks" : "warnings"}${buyerPolished ? "" : " (demo totals)"}`
      : run.hasArtifactBundle
        ? buyerPolished
          ? "Browse sponsor-ready deliverables and exports from the full review. Open review detail when you need the complete workspace view."
          : "Artifacts are summarized alongside the finalized manifest — open the Manifest link below."
        : buyerPolished
          ? "Evidence package available from the signed manifest."
          : "Artifact bundle not reported in list payload";

  const hasFindingsLink = run.hasFindingsSnapshot === true || showcaseStory;
  const hasArtifactsLink = run.hasArtifactBundle === true || showcaseStory;
  const showEvidenceGraphCta = showcaseStory || run.hasGraphSnapshot === true;
  const graphTrailReady = showcaseStory || run.hasGraphSnapshot === true;
  const findingsQuickHref = showcaseStory
    ? showcaseUseWorkspaceQuickLinks
      ? `${workspaceHref}#run-explanation`
      : showcaseWalkthroughHref
    : `${workspaceHref}#run-explanation`;
  const artifactsQuickHref = showcaseStory
    ? manifestHref
    : `${workspaceHref}#artifacts-exports`;
  const timelineQuickHref = showcaseStory
    ? showcaseUseWorkspaceQuickLinks
      ? `${workspaceHref}#pipeline-timeline`
      : showcaseWalkthroughHref
    : `${workspaceHref}#pipeline-timeline`;
  const findingsQuickLabel = showcaseStory && !showcaseUseWorkspaceQuickLinks ? "Findings (walkthrough)" : "Findings";
  const timelineQuickLabel = showcaseStory && !showcaseUseWorkspaceQuickLinks ? "Timeline (walkthrough)" : "Timeline";

  return (
    <div className="space-y-4 text-sm text-neutral-800 dark:text-neutral-200" data-testid="run-inspector-preview">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="m-0 break-words text-sm font-semibold leading-snug text-neutral-900 dark:text-neutral-100">
            {headline}
          </p>
          {showcaseStory && demoChrome ? (
            <span className="inline-flex shrink-0 rounded border border-teal-200 bg-teal-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal-900 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-200">
              Sample
            </span>
          ) : null}
        </div>
        {buyerPolished ? null : (
        <button
          type="button"
          className="mt-1 text-xs font-medium text-teal-800 underline dark:text-teal-300"
          onClick={() => setTechnicalOpen((v) => !v)}
          aria-expanded={technicalOpen ? "true" : "false"}
        >
          {technicalOpen ? "Hide technical details" : "Technical details (IDs)"}
        </button>
        )}
        {!buyerPolished && technicalOpen ? (
          <dl className="m-0 mt-2 grid gap-2 sm:grid-cols-[minmax(5rem,auto)_1fr] sm:gap-x-3">
            <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Review ID
            </dt>
            <dd className="m-0 flex min-w-0 items-center gap-1">
              <code className="truncate font-mono text-[11px] text-neutral-900 dark:text-neutral-100">{run.runId}</code>
              <CopyIdButton value={run.runId} aria-label="Copy review ID" />
            </dd>
            <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              {buyerPolished ? "Project" : "Workspace"}
            </dt>
            <dd className="m-0 text-xs text-neutral-800 dark:text-neutral-200">
              {formatOperatorProjectIdDisplay(run.projectId)}
            </dd>
            <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Created</dt>
            <dd className="m-0">{createdLabel}</dd>
          </dl>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <RunStatusBadge run={run} />
      </div>

      {buyerPolished && showcaseStory ? (
        <section
          aria-label="Review package outcome summary"
          className="space-y-2 rounded-lg border border-teal-200 bg-teal-50/40 p-3 dark:border-teal-800 dark:bg-teal-950/30"
        >
          <p className="m-0 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Decision: Package finalized</p>
          <p className="m-0 text-xs text-neutral-800 dark:text-neutral-200">Governance approval: Approved with monitoring</p>
          <p className="m-0 text-xs text-neutral-800 dark:text-neutral-200">
            Remaining monitored risk: {SHOWCASE_STATIC_DEMO_SPINE_COUNTS.warningCount} (tracked in finalized signed manifest)
          </p>
          <p className="m-0 text-xs text-neutral-800 dark:text-neutral-200">Evidence trail: Ready</p>
          <p className="m-0 text-xs text-neutral-800 dark:text-neutral-200">Audit trail: Complete</p>
          <Button variant="primary" size="sm" className="mt-1 w-full" asChild>
            <Link href={primaryExplore.href}>{primaryExplore.label}</Link>
          </Button>
        </section>
      ) : null}

      {buyerPolished && !showcaseStory ? (() => {
        const meta = buyerDemoPackageCardMeta(run.runId);

        if (meta === null) return null;

        return (
          <section
            aria-label="Review package decision summary"
            className="space-y-1.5 rounded-lg border border-neutral-200 bg-neutral-50/60 p-3 dark:border-neutral-700 dark:bg-neutral-900/30"
          >
            <p className="m-0 text-sm font-semibold text-neutral-900 dark:text-neutral-100">{meta.decisionSummary}</p>
            <dl className="m-0 grid gap-y-1 text-xs">
              <div className="flex gap-x-2">
                <dt className="shrink-0 font-medium text-neutral-500 dark:text-neutral-400">Authority</dt>
                <dd className="m-0 text-neutral-800 dark:text-neutral-200">{meta.approvalAuthority}</dd>
              </div>
              <div className="flex gap-x-2">
                <dt className="shrink-0 font-medium text-neutral-500 dark:text-neutral-400">Risk owner</dt>
                <dd className="m-0 text-neutral-800 dark:text-neutral-200">{meta.riskOwner}</dd>
              </div>
              <div className="flex gap-x-2">
                <dt className="shrink-0 font-medium text-neutral-500 dark:text-neutral-400">Last event</dt>
                <dd className="m-0 text-neutral-800 dark:text-neutral-200">{meta.lastAuditEvent}</dd>
              </div>
            </dl>
            <Button variant="primary" size="sm" className="mt-1 w-full" asChild>
              <Link href={primaryExplore.href}>{primaryExplore.label}</Link>
            </Button>
          </section>
        );
      })() : null}

      <div>
        <p className="m-0 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          {buyerPolished ? "Evidence status" : "Pipeline output"}
        </p>
        <p className="m-0 mt-1 text-xs text-neutral-700 dark:text-neutral-200">{artifactNote}</p>
        <ul className="m-0 mt-2 list-none space-y-1 p-0 text-xs">
          <li className="flex justify-between gap-2">
            <span>Source context captured</span>
            <span aria-label={run.hasContextSnapshot ? "Context snapshot present" : "Context snapshot missing"}>
              {snapshotLabel(run.hasContextSnapshot)}
            </span>
          </li>
          <li className="flex justify-between gap-2">
            <span>{buyerPolished ? BUYER_SURFACE_VOCABULARY.evidenceGraph : "Graph generated"}</span>
            <span
              aria-label={
                graphTrailReady ? "Decision traceability graph ready for this package" : "Graph snapshot missing"
              }
            >
              {snapshotLabel(graphTrailReady)}
            </span>
          </li>
          <li className="flex justify-between gap-2">
            <span>{buyerPolished ? "Risks reviewed" : "Findings reviewed"}</span>
            <span aria-label={run.hasFindingsSnapshot ? "Findings snapshot present" : "Findings snapshot missing"}>
              {snapshotLabel(run.hasFindingsSnapshot)}
            </span>
          </li>
          <li className="flex justify-between gap-2">
            <span>{buyerPolished ? "Package finalized" : "Manifest finalized"}</span>
            <span aria-label={run.hasGoldenManifest ? "Reviewed manifest present" : "Reviewed manifest missing"}>
              {snapshotLabel(run.hasGoldenManifest)}
            </span>
          </li>
        </ul>
      </div>

      {/* Primary exploration — buyer shell leads with the full package; secondary links stay one click away under collapsible groups. */}
      <div className="space-y-2 border-t border-neutral-200 pt-3 dark:border-neutral-700">
        {buyerPolished ? (
          <>
            {!showcaseStory ? (
              <Button variant="primary" size="sm" className="w-full" asChild>
                <Link href={primaryExplore.href}>{primaryExplore.label}</Link>
              </Button>
            ) : null}
            <details className="rounded-md border border-neutral-200 bg-neutral-50/40 dark:border-neutral-700 dark:bg-neutral-950/20">
              <summary className="cursor-pointer select-none px-3 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
                Related actions
              </summary>
              <div className="flex flex-col gap-2 border-t border-neutral-200 px-3 py-3 dark:border-neutral-700">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href={signedManifestExplore.href}>{signedManifestExplore.label}</Link>
                </Button>
                {showEvidenceGraphCta ? (
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href={graphEvidenceHref}>View evidence graph</Link>
                  </Button>
                ) : null}
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href={`/governance?runId=${encodeURIComponent(run.runId)}`}>View governance approval</Link>
                </Button>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href={`/audit?runId=${encodeURIComponent(run.runId)}`}>View audit trail</Link>
                </Button>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href={`/ask?runId=${encodeURIComponent(run.runId)}`}>Ask about this review</Link>
                </Button>
              </div>
            </details>
            <details className="rounded-md border border-neutral-200 bg-neutral-50/40 dark:border-neutral-700 dark:bg-neutral-950/20">
              <summary className="cursor-pointer select-none px-3 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
                Open specific artifact
              </summary>
              <div className="flex flex-col gap-2 border-t border-neutral-200 px-3 py-3 dark:border-neutral-700">
                {buyerSafePrimary ? (
                  <>
                    {showcaseStory ? (
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <Link href={getShowcaseExecutiveHref()}>Executive summary</Link>
                      </Button>
                    ) : null}
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href={showcaseWalkthroughHref}>Read-only walkthrough</Link>
                    </Button>
                    {!(buyerPolished && showcaseStory) ? (
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <Link href={workspaceHref}>Full review detail</Link>
                      </Button>
                    ) : null}
                  </>
                ) : null}

                {!(buyerSafePrimary && showcaseStory && !buyerPolished) ? (
                  <>
                    {!buyerSafePrimary ? (
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <Link href={manifestHref}>Open manifest</Link>
                      </Button>
                    ) : null}
                    {hasFindingsLink ? (
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <Link href={findingsQuickHref}>{findingsQuickLabel}</Link>
                      </Button>
                    ) : null}
                    {hasArtifactsLink ? (
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <Link href={artifactsQuickHref}>Deliverables</Link>
                      </Button>
                    ) : null}
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href={timelineQuickHref}>{timelineQuickLabel}</Link>
                    </Button>
                  </>
                ) : null}
              </div>
            </details>
          </>
        ) : (
          <div
            className={cn(
              "grid gap-2",
              showEvidenceGraphCta ? "sm:grid-cols-3" : "sm:grid-cols-2",
            )}
          >
            <Button variant="primary" size="sm" className="w-full" asChild>
              <Link href={primaryExplore.href}>{primaryExplore.label}</Link>
            </Button>
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link href={signedManifestExplore.href}>{signedManifestExplore.label}</Link>
            </Button>
            {showEvidenceGraphCta ? (
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href={graphEvidenceHref}>View evidence graph</Link>
              </Button>
            ) : null}
          </div>
        )}
        {!buyerPolished ? (
          <>
            {showcaseStory || run.hasGraphSnapshot === true ? (
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href={graphEvidenceHref}>View evidence graph</Link>
              </Button>
            ) : null}
            {buyerSafePrimary ? (
              <div className="flex flex-col gap-2">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href={showcaseWalkthroughHref}>Public walkthrough</Link>
                </Button>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href={workspaceHref}>Technical workspace detail</Link>
                </Button>
              </div>
            ) : null}
            {!(buyerSafePrimary && showcaseStory && !buyerPolished) ? (
              <div>
                <p className="m-0 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  Quick links
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {!buyerSafePrimary ? (
                    <Button variant="outline" size="sm" className="h-8" asChild>
                      <Link href={manifestHref}>Manifest</Link>
                    </Button>
                  ) : null}
                  {hasFindingsLink ? (
                    <Button variant="outline" size="sm" className="h-8" asChild>
                      <Link href={findingsQuickHref}>{findingsQuickLabel}</Link>
                    </Button>
                  ) : null}
                  {hasArtifactsLink ? (
                    <Button variant="outline" size="sm" className="h-8" asChild>
                      <Link href={artifactsQuickHref}>Artifacts</Link>
                    </Button>
                  ) : null}
                  <Button variant="outline" size="sm" className="h-8" asChild>
                    <Link href={timelineQuickHref}>{timelineQuickLabel}</Link>
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </div>

      {!buyerPolished ? (
        <div>
          <button
            type="button"
            className="text-xs text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
            onClick={() => setMoreOpen((v) => !v)}
            aria-expanded={moreOpen ? "true" : "false"}
          >
            {moreOpen ? "▾ Less" : "▸ More actions"}
          </button>
          {moreOpen ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {showcaseStory ? (
                <>
                  <Button variant="outline" size="sm" className="h-8" asChild>
                    <Link href={findingHref}>Primary finding</Link>
                  </Button>
                  <Button variant="outline" size="sm" className="h-8" asChild>
                    <Link href={timelineQuickHref}>{timelineQuickLabel}</Link>
                  </Button>
                </>
              ) : null}
              {run.hasGraphSnapshot === true || showcaseStory ? (
                <Button variant="outline" size="sm" className="h-8" asChild>
                  <Link href={graphEvidenceHref}>Trail graph</Link>
                </Button>
              ) : null}
              <Button variant="outline" size="sm" className="h-8" asChild>
                <Link href={compareHref}>Compare</Link>
              </Button>
              <Button variant="outline" size="sm" className="h-8" asChild>
                <Link href={replayHref}>Replay</Link>
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
