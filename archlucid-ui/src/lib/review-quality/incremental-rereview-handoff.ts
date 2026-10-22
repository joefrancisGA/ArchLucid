/** TB-2307: after apply + impact preview, hand off to subgraph re-review instead of only a full second review. */
export function incrementalRereviewAfterApplyHref(runId: string, findingId: string): string {
  const params = new URLSearchParams({
    path: "quick-review",
    priorRunId: runId.trim(),
    incrementalRereview: "1",
    rereviewFindingId: findingId.trim(),
  });

  return `/architecture/reviews/new?${params.toString()}`;
}

export function readIncrementalRereviewFromSearch(searchParams: URLSearchParams): {
  readonly priorRunId: string | null;
  readonly findingId: string | null;
} {
  const priorRunId = searchParams.get("priorRunId")?.trim() ?? "";
  const findingId = searchParams.get("rereviewFindingId")?.trim() ?? "";
  const incremental = searchParams.get("incrementalRereview")?.trim() === "1";

  if (!incremental) {
    return { priorRunId: null, findingId: null };
  }

  return {
    priorRunId: priorRunId.length > 0 ? priorRunId : null,
    findingId: findingId.length > 0 ? findingId : null,
  };
}
