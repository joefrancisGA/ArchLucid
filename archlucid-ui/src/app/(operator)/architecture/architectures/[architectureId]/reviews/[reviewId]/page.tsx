import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { RunDetailPageRoute } from "@/app/(operator)/architecture/_shared/run-detail-page-route";
import { isInvalidGuidOrSlugRouteToken } from "@/lib/route-dynamic-param";

export const metadata: Metadata = {
  title: "Architecture Review Detail",
};

export default async function NestedArchitectureReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ architectureId: string; reviewId: string }>;
  searchParams: Promise<{ fromGeneration?: string | string[]; intent?: string | string[] }>;
}): Promise<React.JSX.Element> {
  const { architectureId, reviewId } = await params;
  const resolvedSearchParams = await searchParams;

  if (isInvalidGuidOrSlugRouteToken(architectureId) || isInvalidGuidOrSlugRouteToken(reviewId)) {
    notFound();
  }

  const attemptedRoute = `/architecture/architectures/${encodeURIComponent(architectureId)}/reviews/${encodeURIComponent(reviewId)}`;

  return RunDetailPageRoute({
    reviewId,
    expectedArchitectureId: architectureId,
    attemptedRoute,
    searchParams: resolvedSearchParams,
    pathnameForRedirect: attemptedRoute,
    searchForRedirect: null,
  });
}
