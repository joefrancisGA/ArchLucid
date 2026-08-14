import { notFound } from "next/navigation";

import { OperatorBrandedNotFound } from "@/components/operator/OperatorBrandedNotFound";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { ReviewPackageLoadFailureView } from "@/components/ReviewPackageLoadFailureView";
import { isInvalidGuidOrSlugRouteToken } from "@/lib/route-dynamic-param";
import { CREATE_ARCHITECTURE_INTENT } from "@/lib/architecture/architecture-workflow-intent";
import {
  isFromGenerationSearchParam,
  REVIEW_PACKAGE_OPEN_FAILURE_HEADING,
} from "@/lib/review-generation-handoff";

import { loadRunDetailPageModel } from "./_sections/load-run-detail-page-model";
import { RunDetailPageFetchErrorView } from "./_sections/RunDetailPageFetchErrorView";
import { RunDetailPageMalformedResponseView } from "./_sections/RunDetailPageMalformedResponseView";
import { RunDetailPageView } from "./_sections/RunDetailPageView";

/** Server run-detail route: validates params, loads `RunDetailPageModel`, then renders view or error states. */
export default async function RunDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ reviewId: string }>;
  searchParams: Promise<{ fromGeneration?: string | string[]; intent?: string | string[] }>;
}) {
  const { reviewId: runId } = await params;
  const resolvedSearchParams = await searchParams;
  const fromGeneration = isFromGenerationSearchParam(resolvedSearchParams.fromGeneration);
  const intentParam = Array.isArray(resolvedSearchParams.intent)
    ? resolvedSearchParams.intent[0]
    : resolvedSearchParams.intent;
  const fromArchitectureCreation =
    fromGeneration && intentParam?.trim() === CREATE_ARCHITECTURE_INTENT;
  const attemptedRoute = `/architecture/reviews/${encodeURIComponent(runId)}`;

  if (isInvalidGuidOrSlugRouteToken(runId)) {
    notFound();
  }

  const result = await loadRunDetailPageModel(runId);

  if (result.kind === "not-found") {
    if (fromGeneration || result.reason === "workspace-mismatch") {
      return (
        <div className="w-full max-w-[1200px] px-1 py-2 sm:px-0" data-testid="run-detail-load-failure">
          <OperatorPageHeader title={REVIEW_PACKAGE_OPEN_FAILURE_HEADING} headingLevel="h1" />
          <ReviewPackageLoadFailureView
            runId={runId}
            fromGeneration={fromGeneration}
            notFoundReason={result.reason}
            attemptedRoute={attemptedRoute}
          />
        </div>
      );
    }

    return (
      <div className="w-full max-w-[1200px] px-1 py-2 sm:px-0">
        <OperatorBrandedNotFound
          showProcessingHint
          retryLabel="Retry loading review"
          showSampleReviewLink
          variant="review"
        />
      </div>
    );
  }

  if (result.kind === "fetch-error") {
    return (
      <RunDetailPageFetchErrorView
        runId={runId}
        fromGeneration={fromGeneration}
        attemptedRoute={attemptedRoute}
        loadFailure={result.loadFailure}
        fallbackMessage={result.fallbackMessage}
      />
    );
  }

  if (result.kind === "malformed-response") {
    return <RunDetailPageMalformedResponseView message={result.message} />;
  }

  return <RunDetailPageView model={result.model} fromArchitectureCreation={fromArchitectureCreation} />;
}
