import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { isBuyerSafeDemoMarketingChromeEnv } from "@/lib/demo-ui-env";
import { isDemoRunIdEligibleForStaticFallback } from "@/lib/operator-static-demo";
import {
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

/** Finalized manifest for the Claims Intake static spine (human-friendly path rewrites to manifest detail). */
export function getShowcaseManifestHref(): string {
  return `/reviews/${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}/manifest`;
}

/** Executive view (concise risk summary and outcomes) for the Claims Intake static spine. */
export function getShowcaseExecutiveHref(): string {
  return `/executive/reviews/${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`;
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
 * Primary authenticated next step on the reviews table: open the full review package on `/reviews/...`.
 * Pair with {@link getBuyerSafeSignedManifestTableLink} for sealed manifest access without losing the package context.
 */
export function getBuyerSafeReviewsTableLink(runId: string): PrimaryReviewExploreLink {
  const id = canonicalizeDemoRunId(runId.trim());

  return {
    href: getCanonicalReviewWorkspaceHref(id),
    label: "View review package",
  };
}

/** Signed manifest for the same review — secondary table action next to {@link getBuyerSafeReviewsTableLink}. */
export function getBuyerSafeSignedManifestTableLink(runId: string): PrimaryReviewExploreLink {
  const id = canonicalizeDemoRunId(runId.trim());

  if (isDemoRunIdEligibleForStaticFallback(id)) {
    return {
      href: getShowcaseManifestHref(),
      label: "View signed manifest",
    };
  }

  return {
    href: `/reviews/${encodeURIComponent(id)}/manifest`,
    label: "View signed manifest",
  };
}
export function getCanonicalReviewWorkspaceHref(runId: string): string {
  return `/reviews/${encodeURIComponent(canonicalizeDemoRunId(runId))}`;
}
