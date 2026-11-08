import { resolveArchitectureReviewHref } from "@/lib/architecture/architecture-routes";
import { resolveGlobalSearchDeskArchitectureId } from "@/lib/global-search-desk-architecture-id";

export type WorkingReviewChildSuffix = "print" | "provenance";

export type ResolveWorkingReviewChildSuffixHrefInput = {
  readonly architectureId?: string | null;
  readonly pathname?: string | null;
  readonly search?: string | null;
};

function resolveChildSuffixArchitectureId(
  runId: string,
  options?: ResolveWorkingReviewChildSuffixHrefInput,
): string | null {
  const explicit = options?.architectureId?.trim() ?? "";

  if (explicit.length > 0) {
    return explicit;
  }

  return resolveGlobalSearchDeskArchitectureId({
    runId,
    pathname: options?.pathname,
    search: options?.search,
  });
}

/** Nested review job child routes (print / provenance) with desk continuity when architecture is known (AO-44). */
export function resolveWorkingReviewChildSuffixHref(
  runId: string,
  suffix: WorkingReviewChildSuffix,
  options?: ResolveWorkingReviewChildSuffixHrefInput,
): string {
  const trimmed = runId.trim();

  if (trimmed.length === 0) {
    return suffix === "print" ? "/architecture/reviews/print" : "/architecture/reviews/provenance";
  }

  const architectureId = resolveChildSuffixArchitectureId(trimmed, options);
  const base = resolveArchitectureReviewHref(trimmed, architectureId);

  return `${base}/${suffix}`;
}
