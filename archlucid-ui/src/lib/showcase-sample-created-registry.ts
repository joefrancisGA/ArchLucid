import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import {
  SHOWCASE_CREATED_STATIC_DEMO_PRIMARY_FINDING_ID,
  SHOWCASE_CREATED_STATIC_DEMO_PRIMARY_FINDING_TITLE,
  SHOWCASE_CREATED_STATIC_DEMO_RUN_ID,
} from "@/lib/showcase-created-static-demo";

/** Canonical created-package showcase spine — shared by home CTAs and finding detail routes. */
export const SHOWCASE_SAMPLE_CREATED_REGISTRY = {
  runId: SHOWCASE_CREATED_STATIC_DEMO_RUN_ID,
  primaryFindingId: SHOWCASE_CREATED_STATIC_DEMO_PRIMARY_FINDING_ID,
  primaryFindingTitle: SHOWCASE_CREATED_STATIC_DEMO_PRIMARY_FINDING_TITLE,
  workspaceLabel: "Northwind Copilot Showcase",
  packageOrigin: "created" as const,
} as const;

export function isShowcaseCreatedPrimaryFindingRoute(runId: string, findingId: string): boolean {
  const effectiveRunId = canonicalizeDemoRunId(runId.trim());
  const normalizedFindingId = findingId.trim().toLowerCase();

  if (effectiveRunId !== SHOWCASE_SAMPLE_CREATED_REGISTRY.runId) {
    return false;
  }

  return (
    normalizedFindingId === SHOWCASE_SAMPLE_CREATED_REGISTRY.primaryFindingId ||
    normalizedFindingId.startsWith(`${SHOWCASE_SAMPLE_CREATED_REGISTRY.primaryFindingId}-`)
  );
}

export function showcaseSampleCreatedPackageHref(
  runId: string = SHOWCASE_SAMPLE_CREATED_REGISTRY.runId,
): string {
  return `/reviews/${encodeURIComponent(canonicalizeDemoRunId(runId))}`;
}

export function showcaseCreatedPrimaryFindingDetailHref(
  runId: string = SHOWCASE_SAMPLE_CREATED_REGISTRY.runId,
  findingId: string = SHOWCASE_SAMPLE_CREATED_REGISTRY.primaryFindingId,
): string {
  const effectiveRunId = canonicalizeDemoRunId(runId);
  const effectiveFindingId = findingId.trim();

  return `/reviews/${encodeURIComponent(effectiveRunId)}/findings/${encodeURIComponent(effectiveFindingId)}`;
}
