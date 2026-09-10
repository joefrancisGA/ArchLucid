import { RunDetailPageRoute } from "@/app/(operator)/architecture/_shared/run-detail-page-route";

/** Server run-detail route: validates params, loads `RunDetailPageModel`, then renders view or error states. */
export default async function RunDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ reviewId: string }>;
  searchParams: Promise<{ fromGeneration?: string | string[]; intent?: string | string[] }>;
}): Promise<React.JSX.Element> {
  const { reviewId: runId } = await params;
  const resolvedSearchParams = await searchParams;
  const attemptedRoute = `/architecture/reviews/${encodeURIComponent(runId)}`;

  return RunDetailPageRoute({
    reviewId: runId,
    attemptedRoute,
    searchParams: resolvedSearchParams,
    pathnameForRedirect: attemptedRoute,
    searchForRedirect: null,
  });
}
