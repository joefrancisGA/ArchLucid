import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { metadataForWorkingArchitectureNestedReviewRoute } from "@/lib/architecture/working-architecture-document-title";
import { isInvalidGuidOrSlugRouteToken } from "@/lib/route-dynamic-param";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ architectureId: string; reviewId: string }>;
}): Promise<Metadata> {
  const { architectureId } = await params;

  return metadataForWorkingArchitectureNestedReviewRoute(architectureId);
}

export default async function NestedArchitectureReviewLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ architectureId: string; reviewId: string }>;
}) {
  const { architectureId, reviewId } = await params;

  if (isInvalidGuidOrSlugRouteToken(architectureId) || isInvalidGuidOrSlugRouteToken(reviewId)) {
    notFound();
  }

  return children;
}
