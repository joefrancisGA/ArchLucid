import { notFound, redirect } from "next/navigation";

import {
  canonicalizeDemoRunId,
  demoRunUrlRequiresCanonicalRedirect,
} from "@/lib/demo-run-canonical";
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

  if (demoRunUrlRequiresCanonicalRedirect(runId)) {
    redirect(`/reviews/${encodeURIComponent(canonicalizeDemoRunId(runId))}`);
  }

  const result = await loadRunDetailPageModel(runId);

  if (result.kind === "not-found") {
    notFound();
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
