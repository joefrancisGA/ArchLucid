import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { isInvalidGuidOrSlugRouteToken } from "@/lib/route-dynamic-param";

export const metadata: Metadata = {
  title: "Architecture Review Detail",
};

export default async function NestedArchitectureReviewLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ architectureId: string; reviewId: string }>;
}): Promise<React.JSX.Element> {
  const { architectureId, reviewId } = await params;

  if (isInvalidGuidOrSlugRouteToken(architectureId) || isInvalidGuidOrSlugRouteToken(reviewId)) {
    notFound();
  }

  return <>{children}</>;
}
