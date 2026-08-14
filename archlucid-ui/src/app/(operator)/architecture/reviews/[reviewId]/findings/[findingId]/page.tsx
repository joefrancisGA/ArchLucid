import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { metadataForFindingDetailRoute } from "@/lib/findings/finding-route-metadata";
import { isInvalidDynamicRouteToken, isInvalidGuidOrSlugRouteToken } from "@/lib/route-dynamic-param";

import { FindingDetailPageView } from "./_sections/FindingDetailPageView";
import { loadFindingDetailPageModel } from "./_sections/load-finding-detail-page-model";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ reviewId: string; findingId: string }>;
}): Promise<Metadata> {
  const { reviewId: runId, findingId } = await params;

  return metadataForFindingDetailRoute(runId, findingId);
}

/**
 * Finding detail: severity and narrative first; technical identifiers and export tools collapsed.
 */
export default async function RunFindingExplainPage({
  params,
  searchParams,
}: {
  params: Promise<{ reviewId: string; findingId: string }>;
  searchParams: Promise<{ priorRunId?: string; laterRunId?: string }>;
}) {
  const { reviewId: runId, findingId } = await params;
  const { priorRunId, laterRunId } = await searchParams;

  if (isInvalidGuidOrSlugRouteToken(runId)) {
    notFound();
  }

  if (isInvalidDynamicRouteToken(findingId)) {
    notFound();
  }

  const decodedFindingId = decodeURIComponent(findingId);

  const result = await loadFindingDetailPageModel(runId, decodedFindingId, findingId);

  if (result.kind === "not-found") {
    notFound();
  }

  return (
    <FindingDetailPageView
      model={result.model}
      crossReviewPriorRunId={priorRunId ?? null}
      crossReviewLaterRunId={laterRunId ?? null}
    />
  );
}
