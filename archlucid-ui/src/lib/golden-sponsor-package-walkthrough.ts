import { SHOWCASE_SAMPLE_REVIEW_REGISTRY } from "@/lib/showcase-sample-review-registry";

export const GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_QUERY = "walkthrough" as const;

export const GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_VALUE = "sponsor-package" as const;

export const GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_HASH = "sponsor-handoff" as const;

export type GoldenSponsorPackageWalkthroughStepId =
  | "open-package"
  | "review-findings"
  | "signed-record"
  | "sponsor-export";

export type GoldenSponsorPackageWalkthroughStep = {
  readonly id: GoldenSponsorPackageWalkthroughStepId;
  readonly label: string;
  readonly description: string;
};

export const GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_TITLE = "Show me an export-ready package";

export const GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_LEAD =
  "Follow a labeled sample review from finalized review record through export-ready outputs — no facilitator required.";

export const GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_SAMPLE_DISCLOSURE =
  "Illustrative sample data only. Exports on this path are preview-only and never merge into your live workspace.";

export const GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_PRIMARY_CTA = GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_TITLE;

export const GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_DESTINATION_CALLOUT =
  "You are on the final step — use the sponsor export actions below. Sample exports stay separate from live workspace data.";

export const GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_STEPS: readonly GoldenSponsorPackageWalkthroughStep[] = [
  {
    id: "open-package",
    label: "Open the sample finalized review record",
    description: "See how a finalized review is organized in one workspace.",
  },
  {
    id: "review-findings",
    label: "Browse findings and evidence trail",
    description: "Confirm how findings tie back to evidence before you share outward.",
  },
  {
    id: "signed-record",
    label: "Review the finalized review record",
    description: "Inspect the committed package that backs export-ready language.",
  },
  {
    id: "sponsor-export",
    label: "Open export-ready outputs",
    description: "Download the sponsor report or architecture report when you are ready to share.",
  },
] as const;

export function buildGoldenSponsorPackageWalkthroughHref(
  runId: string = SHOWCASE_SAMPLE_REVIEW_REGISTRY.runId,
): string {
  const params = new URLSearchParams();

  params.set(GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_QUERY, GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_VALUE);

  return `/architecture/reviews/${encodeURIComponent(runId)}?${params.toString()}#${GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_HASH}`;
}

/** Adds walkthrough query + sponsor-handoff hash when `reviewHref` is a run detail path. */
export function buildGoldenSponsorPackageWalkthroughHrefFromReviewPath(
  reviewHref: string,
): string | null {
  const trimmed = reviewHref.trim();
  const match = trimmed.match(/^\/architecture\/reviews\/([^/?#]+)/);

  if (match === null) {
    return null;
  }

  return buildGoldenSponsorPackageWalkthroughHref(decodeURIComponent(match[1]!));
}

export function isGoldenSponsorPackageWalkthroughIntent(
  walkthroughParam: string | null | undefined,
): boolean {
  return walkthroughParam?.trim() === GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_VALUE;
}
