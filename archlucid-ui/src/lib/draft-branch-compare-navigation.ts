import { DRAFT_BRANCH_AUTO_COMPARE_QUERY_KEY } from "@/lib/draft-branch-auto-compare";

/** Query key used when a run detail page should surface parent-vs-branch Compare (R12). */
export const DRAFT_BRANCH_PARENT_RUN_QUERY_KEY = "parentRunId";

/** Builds run-detail href with optional parent run id for what-if branch compare deep links. */
export function runDetailHrefWithParentRun(runId: string, parentRunId: string | null | undefined): string {
  const trimmedRunId = runId.trim();
  const trimmedParent = parentRunId?.trim() ?? "";

  if (trimmedParent.length === 0) {
    return `/architecture/reviews/${encodeURIComponent(trimmedRunId)}`;
  }

  const qs = new URLSearchParams();
  qs.set(DRAFT_BRANCH_PARENT_RUN_QUERY_KEY, trimmedParent);
  qs.set(DRAFT_BRANCH_AUTO_COMPARE_QUERY_KEY, "1");

  return `/architecture/reviews/${encodeURIComponent(trimmedRunId)}?${qs.toString()}`;
}
