import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { REVIEW_DETAIL_TAB_PARAM } from "@/lib/review-detail-workspace-tabs";
import {
  SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID,
  SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_TITLE,
  SHOWCASE_STATIC_DEMO_RUN_ID,
} from "@/lib/showcase-static-demo";

/** Canonical Claims Intake Demo workspace spine — shared by home CTAs and finding detail routes. */
export const SHOWCASE_SAMPLE_REVIEW_REGISTRY = {
  runId: SHOWCASE_STATIC_DEMO_RUN_ID,
  primaryFindingId: SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID,
  primaryFindingTitle: SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_TITLE,
  workspaceLabel: "Claims Intake Demo",
} as const;

export function isShowcaseCanonicalPrimaryFindingRoute(runId: string, findingId: string): boolean {
  const effectiveRunId = canonicalizeDemoRunId(runId.trim());
  const normalizedFindingId = findingId.trim().toLowerCase();

  if (effectiveRunId !== SHOWCASE_SAMPLE_REVIEW_REGISTRY.runId) {
    return false;
  }

  return (
    normalizedFindingId === SHOWCASE_SAMPLE_REVIEW_REGISTRY.primaryFindingId ||
    normalizedFindingId.startsWith(`${SHOWCASE_SAMPLE_REVIEW_REGISTRY.primaryFindingId}-`)
  );
}

export function showcaseSampleReviewPackageHref(
  runId: string = SHOWCASE_SAMPLE_REVIEW_REGISTRY.runId,
): string {
  return `/architecture/reviews/${encodeURIComponent(canonicalizeDemoRunId(runId))}`;
}

function showcaseSampleReviewTabHref(
  tabId: "review-package" | "findings",
  runId: string = SHOWCASE_SAMPLE_REVIEW_REGISTRY.runId,
): string {
  const baseHref = showcaseSampleReviewPackageHref(runId);
  const params = new URLSearchParams({ [REVIEW_DETAIL_TAB_PARAM]: tabId });

  return `${baseHref}?${params.toString()}`;
}

/** Specimen signed review record tab for pre-intake preview (TB-2151). */
export function showcaseSpecimenSignedReviewRecordHref(
  runId: string = SHOWCASE_SAMPLE_REVIEW_REGISTRY.runId,
): string {
  return showcaseSampleReviewTabHref("review-package", runId);
}

/** Specimen findings tab for pre-intake preview (TB-2151). */
export function showcaseSpecimenFindingsHref(
  runId: string = SHOWCASE_SAMPLE_REVIEW_REGISTRY.runId,
): string {
  return showcaseSampleReviewTabHref("findings", runId);
}

export function showcasePrimaryFindingDetailHref(
  runId: string = SHOWCASE_SAMPLE_REVIEW_REGISTRY.runId,
  findingId: string = SHOWCASE_SAMPLE_REVIEW_REGISTRY.primaryFindingId,
): string {
  const effectiveRunId = canonicalizeDemoRunId(runId);
  const effectiveFindingId = findingId.trim();

  return `/architecture/reviews/${encodeURIComponent(effectiveRunId)}/findings/${encodeURIComponent(effectiveFindingId)}`;
}
