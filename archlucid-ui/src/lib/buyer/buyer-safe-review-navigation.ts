import { BUYER_VIEW_SIGNED_RECORD_CTA } from "@/lib/buyer/buyer-polish-copy";
import { evidenceGraphHref } from "@/lib/evidence-graph-route";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { isBuyerSafeDemoMarketingChromeEnv } from "@/lib/demo-ui-env";
import { SHOWCASE_PHI_FINDING_GRAPH_NODE_ID } from "@/lib/findings/finding-inspect-graph-evidence";
import { isDemoRunIdEligibleForStaticFallback } from "@/lib/operator/operator-static-demo";
import { comparePageHrefAdaptive } from "@/lib/compare-url-query-params";
import { reviewDetailPath } from "@/lib/architecture/architecture-routes";
import { signedRecordDetailPath } from "@/lib/signed-records-paths";
import {
  SHOWCASE_STATIC_DEMO_LATER_COMPARE_RUN_ID,
  SHOWCASE_STATIC_DEMO_MANIFEST_ID,
  SHOWCASE_STATIC_DEMO_PRIOR_COMPARE_RUN_ID,
  SHOWCASE_STATIC_DEMO_RUN_ID,
} from "@/lib/showcase-static-demo";

export type PrimaryReviewExploreLink = {
  readonly href: string;
  readonly label: string;
};

/** Curated buyer walkthrough — stable when authenticated review detail routes throw in client-only demos. */
export function getShowcaseWalkthroughHref(): string {
  return `/showcase/${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`;
}

/** Finalized signed record for the Claims Intake static spine (canonical manifest detail). */
export function getShowcaseManifestHref(): string {
  return signedRecordDetailPath(SHOWCASE_STATIC_DEMO_MANIFEST_ID);
}

/** Evidence trail graph for the Claims Intake static spine (pre-focused finding node when available). */
export function getShowcaseEvidenceTrailHref(): string {
  return evidenceGraphHref({
    runId: SHOWCASE_STATIC_DEMO_RUN_ID,
    graphNodeId: SHOWCASE_PHI_FINDING_GRAPH_NODE_ID,
  });
}

/** Sponsor view (concise risk summary and outcomes) for the Claims Intake static spine. */
export function getShowcaseSponsorHref(): string {
  return getCanonicalReviewWorkspaceHref(SHOWCASE_STATIC_DEMO_RUN_ID);
}

/** Baseline vs updated Claims Intake comparison for the static buyer spine. */
export function getShowcaseCompareHref(): string {
  return comparePageHrefAdaptive(SHOWCASE_STATIC_DEMO_PRIOR_COMPARE_RUN_ID, SHOWCASE_STATIC_DEMO_LATER_COMPARE_RUN_ID);
}

/**
 * Buyer-safe demo builds: curated spine IDs can use manifest/walkthrough shortcuts instead of workspace detail first.
 */
export function isBuyerSafePrimaryReviewNavigationPreferred(runId: string): boolean {
  if (!isBuyerSafeDemoMarketingChromeEnv()) {
    return false;
  }

  const id = canonicalizeDemoRunId(runId.trim());

  return isDemoRunIdEligibleForStaticFallback(id);
}

/**
 * Primary authenticated next step on the reviews table: open the review workspace on `/architecture/reviews/...`.
 */
export function getBuyerSafeReviewsTableLink(runId: string): PrimaryReviewExploreLink {
  const id = canonicalizeDemoRunId(runId.trim());

  return {
    href: getCanonicalReviewWorkspaceHref(id),
    label: "Open review",
  };
}

/**
 * State-aware label for the primary review CTA — differentiates finalized, in-progress, and attention states.
 */
export function getBuyerSafeReviewsTableLinkForRun(run: {
  runId: string;
  hasGoldenManifest?: boolean;
  hasGovernanceWarnings?: boolean;
  hasFindingsSnapshot?: boolean;
  hasGraphSnapshot?: boolean;
  hasContextSnapshot?: boolean;
  findingCount?: number | null;
  warningCount?: number | null;
  isArchived?: boolean | null;
}): PrimaryReviewExploreLink {
  const id = canonicalizeDemoRunId(run.runId.trim());
  const href = getCanonicalReviewWorkspaceHref(id);

  if (run.isArchived === true) {
    return { href, label: "View archived review" };
  }

  if (run.hasGoldenManifest === true) {
    return { href, label: "View finalized review" };
  }

  if (run.hasFindingsSnapshot === true) {
    return { href, label: "Review findings" };
  }

  if (run.hasGraphSnapshot === true || run.hasContextSnapshot === true) {
    return { href, label: "Complete evidence" };
  }

  const hasAttention =
    (typeof run.findingCount === "number" && run.findingCount > 0) ||
    (typeof run.warningCount === "number" && run.warningCount > 0) ||
    run.hasGovernanceWarnings === true;

  if (hasAttention) {
    return { href, label: "Continue review" };
  }

  return { href, label: "Continue review" };
}

/** Signed review record for the same review — secondary table action next to {@link getBuyerSafeReviewsTableLink}. */
export function getBuyerSafeSignedManifestTableLink(runId: string): PrimaryReviewExploreLink {
  const id = canonicalizeDemoRunId(runId.trim());

  if (isDemoRunIdEligibleForStaticFallback(id)) {
    return {
      href: getShowcaseManifestHref(),
      label: BUYER_VIEW_SIGNED_RECORD_CTA,
    };
  }

  return {
    href: reviewDetailPath(id),
    label: BUYER_VIEW_SIGNED_RECORD_CTA,
  };
}

export function getCanonicalReviewWorkspaceHref(runId: string): string {
  return `/architecture/reviews/${encodeURIComponent(canonicalizeDemoRunId(runId))}`;
}
