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

export type PipelineJobLabel = {
  readonly heading: string;
  readonly progressAriaLabel: string;
  readonly stageSummaryNoun: string;
};

/** Operator-visible pipeline mode derived from package origin (create vs review). */
export function resolvePipelineJobLabel(
  run: RunSummary | null,
  buyerAssessmentCopy: boolean,
): PipelineJobLabel {
  const origin = run === null ? null : resolveRunSummaryPackageOrigin(run);

  if (origin === "created") {
    return {
      heading: buyerAssessmentCopy ? "Creation assessment progress" : "Architecture creation progress",
      progressAriaLabel: "Architecture creation stages completed",
      stageSummaryNoun: "architecture creation",
    };
  }

  if (buyerAssessmentCopy) {
    return {
      heading: "Assessment progress",
      progressAriaLabel: "Architecture assessment stages completed",
      stageSummaryNoun: "assessment",
    };
  }

  return {
    heading: "Assessment progress",
    progressAriaLabel: "Architecture assessment stages completed",
    stageSummaryNoun: "assessment",
  };
}
