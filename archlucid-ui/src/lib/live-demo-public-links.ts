import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { evidenceGraphHref } from "@/lib/evidence-graph-route";

export type LiveDemoInspectDestination =
  | "executive"
  | "signed-record"
  | "evidence-graph"
  | "governance"
  | "audit-trail"
  | "full-review";

function enc(value: string): string {
  return encodeURIComponent(value.trim());
}

/**
 * Resolves read-only inspect destinations for `/live-demo`.
 * When operator deep links are unavailable, routes to the public showcase package (no auth trap).
 */
export function resolveLiveDemoInspectHref(
  destination: LiveDemoInspectDestination,
  runId: string,
  manifestId: string | null,
  operatorDeepLinksAvailable: boolean,
): string {
  const effectiveRunId = canonicalizeDemoRunId(runId);
  const showcaseHref = `/showcase/${enc(effectiveRunId)}`;

  if (!operatorDeepLinksAvailable) {
    return showcaseHref;
  }

  switch (destination) {
    case "executive":
    case "full-review":
      return `/reviews/${enc(effectiveRunId)}`;
    case "signed-record":
      if (manifestId !== null && manifestId.trim().length > 0) {
        return `/signed-records/${enc(manifestId)}`;
      }

      return showcaseHref;
    case "evidence-graph":
      return evidenceGraphHref({ runId: effectiveRunId });
    case "governance":
      return `/governance/approval-queue?runId=${enc(effectiveRunId)}`;
    case "audit-trail":
      return `/audit?runId=${enc(effectiveRunId)}`;
    default: {
      const exhaustive: never = destination;
      return exhaustive;
    }
  }
}
