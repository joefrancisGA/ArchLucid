import { reviewDetailPath } from "@/lib/architecture/architecture-routes";
import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture/architecture-draft-registry";
import { resolveWorkingRunReviewLocator } from "@/lib/architecture/resolve-working-run-review-locator";

export type ResolveAuditTrailReviewHrefInput = {
  readonly workingMode: boolean;
  readonly runId: string;
  readonly architectureId?: string | null;
  readonly draftRegistryEntries?: readonly ArchitectureDraftRegistryEntry[];
};

/** SY-28: Working audit and activity rows open nested review jobs when architecture identity is known. */
export function resolveAuditTrailReviewHref(input: ResolveAuditTrailReviewHrefInput): string {
  const runId = input.runId.trim();

  if (runId.length === 0) {
    return reviewDetailPath("");
  }

  if (!input.workingMode) {
    return reviewDetailPath(runId);
  }

  return resolveWorkingRunReviewLocator({
    runId,
    architectureId: input.architectureId,
    draftRegistryEntries: input.draftRegistryEntries,
  }).href;
}
