import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { REVIEW_DETAIL_TAB_PARAM } from "@/lib/review-detail-workspace-tabs";
import { getActiveSampleScenario } from "@/lib/samples/registry";

const ACTIVE_SAMPLE = getActiveSampleScenario();

/** Canonical Claims Intake Demo workspace spine — shared by home CTAs and finding detail routes. */
export const SHOWCASE_SAMPLE_REVIEW_REGISTRY = {
  runId: ACTIVE_SAMPLE.runId,
  primaryFindingId: ACTIVE_SAMPLE.primaryFindingId,
  primaryFindingTitle: ACTIVE_SAMPLE.primaryFindingTitle,
  workspaceLabel: ACTIVE_SAMPLE.workspaceLabel,
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

/** Specimen Finalized review record tab for pre-intake preview (TB-2151). */
export function showcaseSpecimenSealedReviewRecordHref(
  runId: string = SHOWCASE_SAMPLE_REVIEW_REGISTRY.runId,
): string {
  return showcaseSampleReviewTabHref("review-package", runId);
}

/** @deprecated Prefer {@link showcaseSpecimenSealedReviewRecordHref}. */
export function showcaseSpecimenSignedReviewRecordHref(
  runId: string = SHOWCASE_SAMPLE_REVIEW_REGISTRY.runId,
): string {
  return showcaseSpecimenSealedReviewRecordHref(runId);
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
