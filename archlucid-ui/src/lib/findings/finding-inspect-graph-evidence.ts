import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { graphTrailHrefWithOptionalNode } from "@/lib/graph-finding-deep-links";
import {
  SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID,
  SHOWCASE_STATIC_DEMO_RUN_ID,
} from "@/lib/showcase-static-demo";
import type { FindingInspectPayload } from "@/types/finding-inspect";

/** Static demo PHI finding node id in the curated provenance graph (`operator-static-demo`). */
export const SHOWCASE_PHI_FINDING_GRAPH_NODE_ID = "n-phi";

export function findingInspectListsEvidenceProvenance(payload: FindingInspectPayload): boolean {
  const rows = payload.evidence ?? [];

  return rows.some(
    (e) =>
      (e.artifactId !== null && String(e.artifactId).trim().length > 0) ||
      (e.excerpt !== null && String(e.excerpt).trim().length > 0),
  );
}

export function preferredGraphNodeIdForFindingDeepLink(runId: string, findingId: string): string | null {
  const rid = canonicalizeDemoRunId(runId.trim());
  const fid = findingId.trim().toLowerCase();
  const demoRun = canonicalizeDemoRunId(SHOWCASE_STATIC_DEMO_RUN_ID);
  const demoFinding = SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID.toLowerCase();

  if (rid === demoRun && (fid === demoFinding || fid.startsWith(`${demoFinding}-`))) {
    return SHOWCASE_PHI_FINDING_GRAPH_NODE_ID;
  }

  return null;
}

/** Graph URL when inspect lists evidence excerpts or artifact pointers — optional focus node for the Claims Intake demo. */
export function graphEvidenceHrefFromInspect(
  runId: string,
  findingId: string,
  payload: FindingInspectPayload,
): string | null {
  if (!findingInspectListsEvidenceProvenance(payload)) {
    return null;
  }

  const nodeId = preferredGraphNodeIdForFindingDeepLink(runId, findingId);

  return graphTrailHrefWithOptionalNode(runId.trim(), nodeId);
}
