import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
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

export function showcasePrimaryFindingDetailHref(
  runId: string = SHOWCASE_SAMPLE_REVIEW_REGISTRY.runId,
  findingId: string = SHOWCASE_SAMPLE_REVIEW_REGISTRY.primaryFindingId,
): string {
  const effectiveRunId = canonicalizeDemoRunId(runId);
  const effectiveFindingId = findingId.trim();

  return `/architecture/reviews/${encodeURIComponent(effectiveRunId)}/findings/${encodeURIComponent(effectiveFindingId)}`;
}
