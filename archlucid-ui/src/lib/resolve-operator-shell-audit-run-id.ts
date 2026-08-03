import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

export type ResolveOperatorShellAuditRunIdInput = {
  readonly pathname: string;
  readonly search: string;
  readonly workspaceActiveRunId: string | null;
};

/**
 * Resolves the review id used to scope audit nav deep links from the current shell context.
 * Prefers explicit `runId` query params, then `/architecture/reviews/{runId}` paths, then workspace memory.
 */
export function resolveOperatorShellAuditRunId(input: ResolveOperatorShellAuditRunIdInput): string | null {
  const query = input.search.startsWith("?") ? input.search.slice(1) : input.search;
  const params = new URLSearchParams(query);
  const fromQuery = params.get("runId")?.trim() ?? "";

  if (fromQuery.length > 0) {
    return fromQuery;
  }

  const path = (input.pathname.split("?")[0] ?? "").trim().replace(/\/$/, "") || "/";
  const reviewMatch = /^\/architecture\/reviews\/([^/]+)/.exec(path);

  if (reviewMatch !== null) {
    try {
      return decodeURIComponent(reviewMatch[1] ?? "").trim() || null;
    } catch {
      return reviewMatch[1]?.trim() || null;
    }
  }

  const workspaceId = input.workspaceActiveRunId?.trim() ?? "";

  if (workspaceId.length > 0) {
    return workspaceId;
  }

  if (isBuyerPolishedOperatorShellEnv()) {
    return SHOWCASE_STATIC_DEMO_RUN_ID;
  }

  return null;
}
