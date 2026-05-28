import { notFound } from "next/navigation";

import { OperatorBrandedNotFound } from "@/components/OperatorBrandedNotFound";
import { RunDetailMinimalChromeMount } from "@/components/RunDetailMinimalChromeMount";
import { isInvalidGuidOrSlugRouteToken } from "@/lib/route-dynamic-param";

import { loadRunDetailPageModel } from "./_sections/load-run-detail-page-model";
import { RunDetailPageFetchErrorView } from "./_sections/RunDetailPageFetchErrorView";
import { RunDetailPageMalformedResponseView } from "./_sections/RunDetailPageMalformedResponseView";
import { RunDetailPageView } from "./_sections/RunDetailPageView";

/** Server run-detail route: validates params, loads `RunDetailPageModel`, then renders view or error states. */
export default async function RunDetailPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = await params;

  if (isInvalidGuidOrSlugRouteToken(runId)) {
    notFound();
  }

  const result = await loadRunDetailPageModel(runId);

  if (result.kind === "not-found") {
    return (
      <RunDetailMinimalChromeMount>
        <div className="mx-auto max-w-4xl px-1 py-2 sm:px-0">
          <OperatorBrandedNotFound showProcessingHint retryLabel="Retry loading review" />
        </div>
      </RunDetailMinimalChromeMount>
    );
  }

  if (result.kind === "fetch-error") {
    return (
      <RunDetailPageFetchErrorView
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
