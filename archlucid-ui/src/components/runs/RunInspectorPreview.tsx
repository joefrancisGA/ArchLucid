"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";

import { CopyIdButton } from "@/components/CopyIdButton";
import { InlineMetadataLabel } from "@/components/InlineMetadataLabel";
import { InlineMetadataLine } from "@/components/InlineMetadataLine";
import { RunStatusBadge } from "@/components/runs/RunStatusBadge";
import { Button } from "@/components/ui/button";
import { auditTrailNavHref } from "@/lib/audit-nav-paths";
import { BUYER_RUN_INSPECTOR_FINALIZED_LABEL } from "@/lib/buyer/buyer-polish-copy";
import { BUYER_SURFACE_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";
import { SIGNED_MANIFEST_LABEL } from "@/lib/usability/canonical-product-terms";
import {
  isBuyerPolishedOperatorShellEnv,
  isBuyerSafeDemoMarketingChromeEnv,
  isNextPublicDemoMode,
} from "@/lib/demo-ui-env";
import { formatInstantForBuyerGovernance, formatInstantForLocale } from "@/lib/locale-datetime";
import { formatOperatorProjectIdDisplay } from "@/lib/operator/operator-project-display";
import {
  getBuyerSafeReviewsTableLink,
  getBuyerSafeReviewsTableLinkForRun,
  getBuyerSafeSignedManifestTableLink,
  getCanonicalReviewWorkspaceHref,
  getShowcaseSponsorHref,
  getShowcaseWalkthroughHref,
  isBuyerSafePrimaryReviewNavigationPreferred,
} from "@/lib/buyer/buyer-safe-review-navigation";
import { comparePageHrefAdaptive } from "@/lib/compare-url-query-params";
import {
  INLINE_METADATA_LABEL_CLASS,
  OPERATOR_DISCLOSURE_TRIGGER_CLASS,
  OPERATOR_LINK,
  OPERATOR_NAV_GROUP_LABEL,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { buyerDemoPackageCardMeta } from "@/lib/buyer/buyer-demo-package-card-meta";
import { buyerFacingReviewTitleFromSummary } from "@/lib/buyer/buyer-facing-review-title";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
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
      ? buyerPolished
        ? BUYER_RUN_INSPECTOR_FINALIZED_LABEL
        : "Sample finalized (illustrative)"
      : formatInstantForBuyerGovernance(run.createdUtc)
    : buyerPolished
      ? formatInstantForBuyerGovernance(run.createdUtc)
      : formatInstantForLocale(run.createdUtc);
  const compareHref = comparePageHrefAdaptive(run.runId);
  const graphEvidenceHref = `/insights/evidence-graph?runId=${encodeURIComponent(run.runId)}`;
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
          : "Artifacts are summarized alongside the finalized review record — open the signed record link below."
        : buyerPolished
          ? "Evidence bundle available from the signed review record."
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
    <div className={cn("space-y-4 text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)} data-testid="run-inspector-preview">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className={cn("m-0 break-words font-semibold leading-snug text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
            {headline}
          </p>
          {showcaseStory && demoChrome ? (
            <span className={cn("inline-flex shrink-0 rounded border border-neutral-300 bg-al-surface-raised px-2 py-0.5 font-semibold uppercase tracking-wide text-al-text-primary dark:border-neutral-600", OPERATOR_TYPOGRAPHY.badge)}>
              Sample
            </span>
          ) : null}
        </div>
        {buyerPolished ? null : (
        <button
          type="button"
          className={cn(OPERATOR_LINK.optional, "mt-1")}
          onClick={() => setTechnicalOpen((v) => !v)}
          aria-expanded={technicalOpen ? "true" : "false"}
        >
          {technicalOpen ? "Hide technical details" : "Technical details (IDs)"}
        </button>
        )}
        {!buyerPolished && technicalOpen ? (
          <dl className="m-0 mt-2 grid gap-2 sm:grid-cols-[minmax(5rem,auto)_1fr] sm:gap-x-3">
            <dt className={cn(OPERATOR_NAV_GROUP_LABEL, "font-medium text-neutral-500 dark:text-neutral-400")}>
              Review ID
            </dt>
            <dd className="m-0 flex min-w-0 items-center gap-1">
              <code className={cn("truncate font-mono text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.navHelper)}>{run.runId}</code>
              <CopyIdButton value={run.runId} aria-label="Copy review ID" />
            </dd>
            <dt className={cn(OPERATOR_NAV_GROUP_LABEL, "font-medium text-neutral-500 dark:text-neutral-400")}>
              {buyerPolished ? "Project" : "Workspace"}
            </dt>
            <dd className={cn("m-0 text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.helper)}>
              {formatOperatorProjectIdDisplay(run.projectId)}
            </dd>
            <dt className={cn(OPERATOR_NAV_GROUP_LABEL, "font-medium text-neutral-500 dark:text-neutral-400")}>Created</dt>
            <dd className="m-0">{createdLabel}</dd>
          </dl>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <RunStatusBadge run={run} />
      </div>

      {buyerPolished && showcaseStory ? (
        <section
          aria-label="Review outcome summary"
          className="rounded-md border border-neutral-200 bg-al-surface-raised dark:border-neutral-800 space-y-2 p-3"
          data-testid="run-inspector-showcase-proof-summary"
        >
          <p className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
            Decision: Package finalized
          </p>
          <InlineMetadataLine label="Governance approval" value="Approved with monitoring" />
          <InlineMetadataLine
            label="Remaining monitored risk"
            value={`${SHOWCASE_STATIC_DEMO_SPINE_COUNTS.warningCount} (tracked in finalized signed review record)`}
          />
          <InlineMetadataLine label="Evidence trail" value="Ready" />
          <InlineMetadataLine label="Audit trail" value="Complete" />
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
            aria-label="Review decision summary"
            className="space-y-1.5 rounded-lg border border-neutral-200 bg-neutral-50/60 p-3 dark:border-neutral-700 dark:bg-neutral-900/30"
          >
            <p className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>{meta.decisionSummary}</p>
            <dl className={cn("m-0 grid gap-y-1", OPERATOR_TYPOGRAPHY.helper)}>
              <div className="flex gap-x-2">
                <dt className={cn("shrink-0", INLINE_METADATA_LABEL_CLASS)}>
                  <InlineMetadataLabel label="Authority" withColon={false} />
                </dt>
                <dd className="m-0 text-neutral-800 dark:text-neutral-200">{meta.approvalAuthority}</dd>
              </div>
              <div className="flex gap-x-2">
                <dt className={cn("shrink-0", INLINE_METADATA_LABEL_CLASS)}>
                  <InlineMetadataLabel label="Risk owner" withColon={false} />
                </dt>
                <dd className="m-0 text-neutral-800 dark:text-neutral-200">{meta.riskOwner}</dd>
              </div>
              <div className="flex gap-x-2">
                <dt className={cn("shrink-0", INLINE_METADATA_LABEL_CLASS)}>
                  <InlineMetadataLabel label="Last event" withColon={false} />
                </dt>
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
        <p className={cn("m-0", OPERATOR_NAV_GROUP_LABEL, "text-neutral-500 dark:text-neutral-400")}>
          {buyerPolished ? "Evidence status" : "Pipeline output"}
        </p>
        <p className={cn("m-0 mt-1 text-neutral-700 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.helper)}>{artifactNote}</p>
        <ul className={cn("m-0 mt-2 list-none space-y-1 p-0", OPERATOR_TYPOGRAPHY.helper)}>
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
                graphTrailReady ? "Decision traceability graph ready for this review" : "Graph snapshot missing"
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
            <span>{buyerPolished ? "Package finalized" : "Review finalized"}</span>
            <span aria-label={run.hasGoldenManifest ? `${SIGNED_MANIFEST_LABEL} present` : `${SIGNED_MANIFEST_LABEL} missing`}>
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
              <summary className={cn("cursor-pointer select-none px-3 py-2", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
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
                  <Link href={`/governance/approval-queue?runId=${encodeURIComponent(run.runId)}`}>View governance approval</Link>
                </Button>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href={auditTrailNavHref(run.runId)}>View audit trail</Link>
                </Button>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href={`/insights/ask-review-questions?runId=${encodeURIComponent(run.runId)}`}>Ask about this review</Link>
                </Button>
              </div>
            </details>
            <details className="rounded-md border border-neutral-200 bg-neutral-50/40 dark:border-neutral-700 dark:bg-neutral-950/20">
              <summary className={cn("cursor-pointer select-none px-3 py-2", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
                Open specific artifact
              </summary>
              <div className="flex flex-col gap-2 border-t border-neutral-200 px-3 py-3 dark:border-neutral-700">
                {buyerSafePrimary ? (
                  <>
                    {showcaseStory ? (
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <Link href={getShowcaseSponsorHref()}>Sponsor report</Link>
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
                        <Link href={manifestHref}>{signedManifestExplore.label}</Link>
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
                <p className={cn("m-0", OPERATOR_NAV_GROUP_LABEL, "text-neutral-500 dark:text-neutral-400")}>
                  Quick links
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {!buyerSafePrimary ? (
                    <Button variant="outline" size="sm" className="h-8" asChild>
                      <Link href={manifestHref}>{SIGNED_MANIFEST_LABEL}</Link>
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
            className={cn(OPERATOR_LINK.optional, "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200")}
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
