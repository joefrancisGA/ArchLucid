import { notFound } from "next/navigation";

import {
  loadFindingInspectForRoute,
  shouldTreatFindingInspectFailureAsNotFound,
} from "@/lib/load-finding-inspect-for-route";
import { isInvalidDynamicRouteToken, isInvalidGuidOrSlugRouteToken } from "@/lib/route-dynamic-param";
import { tryLoadRunExecutionFootnote } from "@/lib/try-load-run-execution-footnote";

import { FindingInspectView } from "../FindingInspectView";

/**
 * First-class technical inspection: persisted payload, rule linkage, evidence citations, and audit correlation.
 * ReadAuthority only; no writes. `useOperateCapability` applies when future write affordances are added.
 */
export default async function FindingInspectPage({
  params,
}: {
  params: Promise<{ runId: string; findingId: string }>;
}) {
  const { runId, findingId } = await params;

  if (isInvalidGuidOrSlugRouteToken(runId)) {
    notFound();
  }

  if (isInvalidDynamicRouteToken(findingId)) {
    notFound();
  }

  const decodedFindingId = decodeURIComponent(findingId);

  const { payload, failure, invalidRouteAlignment } = await loadFindingInspectForRoute(runId, decodedFindingId);

  if (invalidRouteAlignment || shouldTreatFindingInspectFailureAsNotFound(failure)) {
    notFound();
  }

  const runExecutionFootnote = await tryLoadRunExecutionFootnote(runId);

  return (
    <FindingInspectView
      runId={runId}
      decodedFindingId={decodedFindingId}
      payload={payload}
      failure={failure}
      runExecutionFootnote={runExecutionFootnote}
    />
  );
}
