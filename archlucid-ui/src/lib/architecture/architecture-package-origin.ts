import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { SHOWCASE_SAMPLE_CREATED_REGISTRY } from "@/lib/showcase-sample-created-registry";
import { SHOWCASE_SAMPLE_REVIEW_REGISTRY } from "@/lib/showcase-sample-review-registry";
import type { RunSummary } from "@/types/authority";

/** Normalized package-origin token for UI badges (buyer-safe lowercase wire). */
export type ArchitecturePackageOriginToken = "created" | "reviewed";

export function resolveRunSummaryPackageOrigin(run: RunSummary): ArchitecturePackageOriginToken | null {
  const wire = run.packageOrigin?.trim();

  if (wire === "Created") {
    return "created";
  }

  if (wire === "Reviewed") {
    return "reviewed";
  }

  const runId = canonicalizeDemoRunId(run.runId?.trim() ?? "");

  if (runId === SHOWCASE_SAMPLE_CREATED_REGISTRY.runId) {
    return SHOWCASE_SAMPLE_CREATED_REGISTRY.packageOrigin;
  }

  if (runId === SHOWCASE_SAMPLE_REVIEW_REGISTRY.runId) {
    return "reviewed";
  }

  return null;
}
