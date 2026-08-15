import { auditTrailNavHref } from "@/lib/audit-nav-paths";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { evidenceGraphHref } from "@/lib/evidence-graph-route";
import { signedRecordDetailPath } from "@/lib/signed-records-paths";

export type LiveDemoInspectDestination =
  | "sponsor"
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
    case "sponsor":
    case "full-review":
      return `/architecture/reviews/${enc(effectiveRunId)}`;
    case "signed-record":
      if (manifestId !== null && manifestId.trim().length > 0) {
        return signedRecordDetailPath(manifestId);
      }

      return showcaseHref;
    case "evidence-graph":
      return evidenceGraphHref({ runId: effectiveRunId });
    case "governance":
      return `/governance/approval-queue?runId=${enc(effectiveRunId)}`;
    case "audit-trail":
      return auditTrailNavHref(effectiveRunId);
    default: {
      const exhaustive: never = destination;
      return exhaustive;
    }
  }
}
