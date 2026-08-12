import { cn } from "@/lib/utils";
import { notFound } from "next/navigation";

import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { ProvenancePageWorkspace, type ProvenanceReviewContext } from "@/components/provenance/ProvenancePageWorkspace";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { isApiNotFoundFailure, toApiLoadFailure } from "@/lib/api-load-failure";
import { isInvalidGuidOrSlugRouteToken } from "@/lib/route-dynamic-param";
import { tryStaticDemoProvenanceGraph } from "@/lib/operator/operator-static-demo";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { type ApiResponseWithTrace, getArchitectureRunProvenance, getRunSummary } from "@/lib/api";
import { provenanceReviewContextFromSummary } from "@/lib/provenance-review-context";
import type { ArchitectureRunProvenanceGraph } from "@/types/architecture-provenance";
import Link from "next/link";

/** Server-rendered coordinator provenance: linkage graph + trace timeline (GET /v1/architecture/reviews/…/provenance). */
export default async function RunProvenancePage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = await params;

  if (isInvalidGuidOrSlugRouteToken(runId)) {
    notFound();
  }

  let loadFailure: ApiLoadFailureState | null = null;
  let provenanceResponse: ApiResponseWithTrace<ArchitectureRunProvenanceGraph> | null = null;
  let reviewContext: ProvenanceReviewContext | null = null;
  let dataOrigin: "live" | "sample" = "live";

  const reviewSummaryPromise = getRunSummary(runId).catch(() => null);

  try {
    provenanceResponse = await getArchitectureRunProvenance(runId);
  } catch (e) {
    loadFailure = toApiLoadFailure(e);
  }

  const reviewSummary = await reviewSummaryPromise;

  if (reviewSummary !== null) {
    reviewContext = provenanceReviewContextFromSummary(reviewSummary);
  }

  if (loadFailure !== null || provenanceResponse === null) {
    const demoGraph = tryStaticDemoProvenanceGraph(runId);

    if (demoGraph !== null) {
      provenanceResponse = { data: demoGraph, traceId: null };
      loadFailure = null;
      dataOrigin = "sample";
    }
  }

  if (provenanceResponse !== null) {
    const nodes = provenanceResponse.data.nodes ?? [];

    if (nodes.length === 0) {
      const demoGraph = tryStaticDemoProvenanceGraph(runId);

      if (demoGraph !== null && demoGraph.nodes.length > 0) {
        provenanceResponse = { data: demoGraph, traceId: provenanceResponse.traceId };
        loadFailure = null;
        dataOrigin = "sample";
      }
    }
  }

  if (loadFailure || !provenanceResponse) {
    if (loadFailure !== null && isApiNotFoundFailure(loadFailure)) {
      notFound();
    }

    const fallback =
      loadFailure?.message ??
      "Provenance could not be loaded (review missing, broken review record reference, or transport error).";

    return (
      <div className="w-full max-w-3xl p-4">
        <h2 className={OPERATOR_TYPOGRAPHY.pageTitle}>Provenance</h2>
        <OperatorApiProblem
          problem={loadFailure?.problem ?? null}
          fallbackMessage={fallback}
          correlationId={loadFailure?.correlationId ?? null}
        />
        <p className={cn("mt-3", OPERATOR_TYPOGRAPHY.helper)}>
          Open the <Link href="/insights/evidence-graph">Evidence graph</Link> for this review for an interactive trail, or use the
          public sample walkthrough when this coordinator view is unavailable.
        </p>
      </div>
    );
  }

  return (
    <ProvenancePageWorkspace
      runId={runId}
      graph={provenanceResponse.data}
      provenanceTraceId={provenanceResponse.traceId}
      reviewContext={reviewContext}
      dataOrigin={dataOrigin}
    />
  );
}
