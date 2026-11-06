import { reviewDetailPath } from "@/lib/architecture/architecture-routes";
import { resolveScopedInsightOpenReviewHrefWithDeskContinuity } from "@/lib/insights/scoped-insight-open-review-href";
import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture/architecture-draft-registry";
import { resolveWorkingRunReviewLocator } from "@/lib/architecture/resolve-working-run-review-locator";

export type ResolveAuditTrailReviewHrefInput = {
  readonly workingMode: boolean;
  readonly runId: string;
  readonly architectureId?: string | null;
  readonly draftRegistryEntries?: readonly ArchitectureDraftRegistryEntry[];
};

/** SY-28: Working audit and activity rows open nested review jobs when architecture identity is known. */
/* Intentionally not delegated to resolveGovernanceScopedReviewOpenHref: working-mode peer fallback must stay peer-only (no desk-cache continuity jump). */
export function resolveAuditTrailReviewHref(input: ResolveAuditTrailReviewHrefInput): string {
  const runId = input.runId.trim();

  if (runId.length === 0) {
    return reviewDetailPath("");
  }

  if (!input.workingMode) {
    return resolveScopedInsightOpenReviewHrefWithDeskContinuity(runId, {
      architectureId: input.architectureId,
    });
  }

  return resolveWorkingRunReviewLocator({
    runId,
    architectureId: input.architectureId,
    draftRegistryEntries: input.draftRegistryEntries,
  }).href;
}
