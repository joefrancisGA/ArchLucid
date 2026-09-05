"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, type SetStateAction } from "react";

import { CopyIdButton } from "@/components/CopyIdButton";
import { InlineMetadataLabel } from "@/components/InlineMetadataLabel";
import { InlineMetadataLine } from "@/components/InlineMetadataLine";
import { RunStatusBadge } from "@/components/runs/RunStatusBadge";
import { RunInspectorSnapshotStatus } from "@/components/runs/RunInspectorSnapshotStatus";
import { RunInspectorExploreActions } from "@/components/runs/RunInspectorExploreActions";
import { Button } from "@/components/ui/button";
import { BUYER_RUN_INSPECTOR_FINALIZED_LABEL } from "@/lib/buyer/buyer-polish-copy";
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
  getShowcaseWalkthroughHref,
  isBuyerSafePrimaryReviewNavigationPreferred,
} from "@/lib/buyer/buyer-safe-review-navigation";
import { comparePageHrefAdaptive } from "@/lib/compare-url-query-params";
import { INTERNAL_REPLAY_PATH } from "@/lib/internal-ops-route-paths";
import {
  INLINE_METADATA_LABEL_CLASS,
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
import {
  parseRunInspectorMoreOpenFromSearch,
  parseRunInspectorTechOpenFromSearch,
  runInspectorPreviewPanelsHrefFromSearch,
} from "@/lib/runs/run-inspector-preview-panels-url";
import type { RunSummary } from "@/types/authority";

export type RunInspectorPreviewProps = {
  run: RunSummary;
};

/**
 * Read-only run preview for list inspectors — uses only {@link RunSummary} fields from the list payload.
 */
export function RunInspectorPreview({ run }: RunInspectorPreviewProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const runInspectorMoreOpenParam = searchParams.get("runInspectorMoreOpen");
  const runInspectorTechOpenParam = searchParams.get("runInspectorTechOpen");
  const [moreOpen, setMoreOpenState] = useState(() => parseRunInspectorMoreOpenFromSearch(runInspectorMoreOpenParam));
  const [technicalOpen, setTechnicalOpenState] = useState(() =>
    parseRunInspectorTechOpenFromSearch(runInspectorTechOpenParam),
  );

  const syncInspectorPanelsToUrl = useCallback(
    (state: { moreOpen: boolean; technicalOpen: boolean }) => {
      router.replace(runInspectorPreviewPanelsHrefFromSearch(searchParams.toString(), state, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setMoreOpen = useCallback(
    (value: SetStateAction<boolean>) => {
      setMoreOpenState((current) => {
        const next = typeof value === "function" ? value(current) : value;
        syncInspectorPanelsToUrl({ moreOpen: next, technicalOpen });

        return next;
      });
    },
    [syncInspectorPanelsToUrl, technicalOpen],
  );

  const setTechnicalOpen = useCallback(
    (value: SetStateAction<boolean>) => {
      setTechnicalOpenState((current) => {
        const next = typeof value === "function" ? value(current) : value;
        syncInspectorPanelsToUrl({ moreOpen, technicalOpen: next });

        return next;
      });
    },
    [moreOpen, syncInspectorPanelsToUrl],
  );
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
  const replayHref = `${INTERNAL_REPLAY_PATH}?runId=${encodeURIComponent(run.runId)}`;
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
          ? "Browse export-ready deliverables and exports from the full review. Open review detail when you need the complete workspace view."
          : "Artifacts are summarized alongside the finalized review record — open the finalized review record link below."
        : buyerPolished
          ? "Evidence bundle available from the finalized review record."
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
            value={`${SHOWCASE_STATIC_DEMO_SPINE_COUNTS.warningCount} (tracked in finalized review record)`}
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

      <RunInspectorSnapshotStatus
        run={run}
        buyerPolished={buyerPolished}
        graphTrailReady={graphTrailReady}
        artifactNote={artifactNote}
      />

      <RunInspectorExploreActions
        run={run}
        buyerPolished={buyerPolished}
        buyerSafePrimary={buyerSafePrimary}
        showcaseStory={showcaseStory}
        showcaseUseWorkspaceQuickLinks={showcaseUseWorkspaceQuickLinks}
        primaryExplore={primaryExplore}
        signedManifestExplore={signedManifestExplore}
        workspaceHref={workspaceHref}
        showcaseWalkthroughHref={showcaseWalkthroughHref}
        graphEvidenceHref={graphEvidenceHref}
        compareHref={compareHref}
        replayHref={replayHref}
        manifestHref={manifestHref}
        findingHref={findingHref}
        hasFindingsLink={hasFindingsLink}
        hasArtifactsLink={hasArtifactsLink}
        showEvidenceGraphCta={showEvidenceGraphCta}
        findingsQuickHref={findingsQuickHref}
        artifactsQuickHref={artifactsQuickHref}
        timelineQuickHref={timelineQuickHref}
        findingsQuickLabel={findingsQuickLabel}
        timelineQuickLabel={timelineQuickLabel}
        moreOpen={moreOpen}
        onToggleMoreOpen={() => setMoreOpen((v) => !v)}
      />
    </div>
  );
}
