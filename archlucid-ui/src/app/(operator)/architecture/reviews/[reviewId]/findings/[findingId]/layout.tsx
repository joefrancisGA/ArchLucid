import type { ReactNode } from "react";
import { notFound } from "next/navigation";

import { isInvalidDynamicRouteToken, isInvalidGuidOrSlugRouteToken } from "@/lib/route-dynamic-param";

export default async function RunFindingLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ reviewId: string; findingId: string }>;
}) {
  const { reviewId: runId, findingId } = await params;

  if (isInvalidGuidOrSlugRouteToken(runId) || isInvalidDynamicRouteToken(findingId)) {
    notFound();
  }

  return children;
}
