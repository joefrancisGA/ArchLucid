import { notFound } from "next/navigation";

import { OperatorBrandedNotFound } from "@/components/OperatorBrandedNotFound";
import { ReviewPackageLoadFailureView } from "@/components/ReviewPackageLoadFailureView";
import { isInvalidGuidOrSlugRouteToken } from "@/lib/route-dynamic-param";
import { isFromGenerationSearchParam } from "@/lib/review-generation-handoff";

import { loadRunDetailPageModel } from "./_sections/load-run-detail-page-model";
import { RunDetailPageFetchErrorView } from "./_sections/RunDetailPageFetchErrorView";
import { RunDetailPageMalformedResponseView } from "./_sections/RunDetailPageMalformedResponseView";
import { RunDetailPageView } from "./_sections/RunDetailPageView";

/** Server run-detail route: validates params, loads `RunDetailPageModel`, then renders view or error states. */
export default async function RunDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ runId: string }>;
  searchParams: Promise<{ fromGeneration?: string | string[] }>;
}) {
  const { runId } = await params;
  const resolvedSearchParams = await searchParams;
  const fromGeneration = isFromGenerationSearchParam(resolvedSearchParams.fromGeneration);
  const attemptedRoute = `/reviews/${encodeURIComponent(runId)}`;

  if (isInvalidGuidOrSlugRouteToken(runId)) {
    notFound();
  }

  const result = await loadRunDetailPageModel(runId);

  if (result.kind === "not-found") {
    if (fromGeneration || result.reason === "workspace-mismatch") {
      return (
        <div className="w-full max-w-[1200px] px-1 py-2 sm:px-0" data-testid="run-detail-load-failure">
          <h1 className="mb-4 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
            Review generation — Could not open generated package
          </h1>
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
        <OperatorBrandedNotFound showProcessingHint retryLabel="Retry loading review" showSampleReviewLink />
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

  return <RunDetailPageView model={result.model} />;
}
