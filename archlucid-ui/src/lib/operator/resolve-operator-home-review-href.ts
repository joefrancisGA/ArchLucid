import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture/architecture-draft-registry";
import { resolveGovernanceScopedReviewOpenHref } from "@/lib/governance-scoped-review-open-href";
import type { RunSummary } from "@/types/authority";

/** Operator home / runs dashboard: open review using governance scoping + draft-registry resolution. */
export function resolveOperatorHomeReviewHref(
  run: Pick<RunSummary, "runId" | "requestId">,
  draftRegistryEntries?: readonly ArchitectureDraftRegistryEntry[],
): string {
  const runId = run.runId ?? "";

  return resolveGovernanceScopedReviewOpenHref({
    runId,
    requestId: run.requestId ?? null,
    draftRegistryEntries,
  });
}
