import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { metadataForFindingEvidenceTraceRoute } from "@/lib/findings/finding-route-metadata";
import { shouldTreatFindingInspectFailureAsNotFound } from "@/lib/load-finding-inspect-for-route";
import { loadFindingInspectForRouteCached } from "@/lib/load-finding-inspect-for-route-cached";
import { isInvalidDynamicRouteToken, isInvalidGuidOrSlugRouteToken } from "@/lib/route-dynamic-param";
import { tryLoadRunExecutionFootnote } from "@/lib/try-load-run-execution-footnote";
import { tryLoadApprovedDecisionTitlesForRun } from "@/lib/try-load-approved-decision-titles-for-run";
import { tryLoadStatedConstraintContextForRun } from "@/lib/try-load-stated-constraint-context";
import { fetchRunDetailCriticalPageBundle } from "@/lib/fetch-run-detail-page-bundle-client";

import { FindingInspectView } from "../FindingInspectView";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ reviewId: string; findingId: string }>;
}): Promise<Metadata> {
  const { reviewId: runId, findingId } = await params;

  return metadataForFindingEvidenceTraceRoute(runId, findingId);
}

/**
 * Canonical evidence trace: persisted payload, rule linkage, evidence citations, and audit correlation.
 * ReadAuthority only; approval mutations live in the governance action region below the trace.
 */
export default async function FindingEvidenceTracePage({
  params,
  searchParams,
}: {
  params: Promise<{ reviewId: string; findingId: string }>;
  searchParams: Promise<{ runId?: string }>;
}) {
  const { reviewId: runId, findingId } = await params;
  const { runId: findingsQueueRunId } = await searchParams;

  if (isInvalidGuidOrSlugRouteToken(runId)) {
    notFound();
  }

  if (isInvalidDynamicRouteToken(findingId)) {
    notFound();
  }

  let decodedFindingId: string;

  try {
    decodedFindingId = decodeURIComponent(findingId);
  } catch {
    notFound();
  }

  const { payload, failure, invalidRouteAlignment } = await loadFindingInspectForRouteCached(
    runId,
    decodedFindingId,
    false,
  );

  if (invalidRouteAlignment || shouldTreatFindingInspectFailureAsNotFound(failure)) {
    notFound();
  }

  const [runExecutionFootnote, statedConstraintContext, approvedDecisionTitles, criticalBundle] =
    await Promise.all([
    tryLoadRunExecutionFootnote(runId),
    tryLoadStatedConstraintContextForRun(runId),
    tryLoadApprovedDecisionTitlesForRun(runId),
    fetchRunDetailCriticalPageBundle(runId).catch(() => null),
  ]);
  const parentArchitectureId =
    criticalBundle?.data.buyerSummary?.run?.architectureId?.trim() ?? "";

  return (
    <FindingInspectView
      runId={runId}
      decodedFindingId={decodedFindingId}
      payload={payload}
      failure={failure}
      runExecutionFootnote={runExecutionFootnote}
      statedConstraintContext={statedConstraintContext}
      approvedDecisionTitles={approvedDecisionTitles}
      findingsQueueRunId={findingsQueueRunId ?? null}
      parentArchitectureId={parentArchitectureId.length > 0 ? parentArchitectureId : null}
    />
  );
}
