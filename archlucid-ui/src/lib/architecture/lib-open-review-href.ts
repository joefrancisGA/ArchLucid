import {
  buildReviewWorkspaceRouteHref,
  type BuildReviewWorkspaceRouteHrefInput,
} from "@/lib/architecture/review-workspace-route";
import { resolveArchitectureReviewTabHref } from "@/lib/architecture/working-architecture-review-routes";
import { resolveWorkingReviewChildSuffixHref } from "@/lib/architecture/working-review-child-suffix-href";
import { readCachedLastOpenArchitectureId } from "@/lib/desk-continuity-preference";
import { resolveScopedInsightOpenReviewHrefWithDeskContinuity } from "@/lib/insights/scoped-insight-open-review-href";
import type { ReviewDetailTabId } from "@/lib/review-detail-workspace-tabs";

export type LibOpenReviewHrefOptions = {
  readonly architectureId?: string | null;
  readonly tab?: ReviewDetailTabId;
  readonly hash?: string | null;
};

/** Lib-only review opens: prefer nested desk when continuity cache or explicit architecture id is known. */
export function resolveLibOpenReviewHref(
  runId: string,
  options?: LibOpenReviewHrefOptions,
): string {
  const trimmedRunId = runId.trim();

  if (trimmedRunId.length === 0) {
    return "/architecture/reviews";
  }

  const architectureId = options?.architectureId ?? readCachedLastOpenArchitectureId();
  const tab = options?.tab;
  const hash = options?.hash?.trim() ?? "";

  let href: string;

  if (tab !== undefined) {
    href = resolveArchitectureReviewTabHref(trimmedRunId, tab, architectureId);
  }
  else {
    href = resolveScopedInsightOpenReviewHrefWithDeskContinuity(trimmedRunId, { architectureId });
  }

  if (hash.length === 0) {
    return href;
  }

  const withoutHash = href.split("#")[0] ?? href;

  return `${withoutHash}#${hash}`;
}

function resolveLibArchitectureId(architectureId?: string | null): string | null {
  const explicit = architectureId?.trim() ?? "";

  if (explicit.length > 0) {
    return explicit;
  }

  return readCachedLastOpenArchitectureId();
}

/** Tab, finding, hash, and query-aware review workspace hrefs for lib copy modules. */
export function resolveLibReviewWorkspaceHref(
  input: Omit<BuildReviewWorkspaceRouteHrefInput, "architectureId"> & {
    readonly architectureId?: string | null;
  },
): string {
  return buildReviewWorkspaceRouteHref({
    ...input,
    architectureId: resolveLibArchitectureId(input.architectureId),
  });
}

export function resolveLibFindingDetailHref(
  runId: string,
  findingId: string,
  architectureId?: string | null,
): string {
  return resolveLibReviewWorkspaceHref({
    runId,
    findingId,
    findingIdOnPath: true,
    architectureId,
  });
}

export function resolveLibReviewProvenanceHref(runId: string, architectureId?: string | null): string {
  return resolveWorkingReviewChildSuffixHref(runId, "provenance", {
    architectureId: resolveLibArchitectureId(architectureId),
  });
}
