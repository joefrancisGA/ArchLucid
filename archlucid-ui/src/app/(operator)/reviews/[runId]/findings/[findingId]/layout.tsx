import type { ReactNode } from "react";
import { notFound } from "next/navigation";

import { isInvalidDynamicRouteToken, isInvalidGuidOrSlugRouteToken } from "@/lib/route-dynamic-param";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store" as const;

export default async function RunFindingLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ runId: string; findingId: string }>;
}) {
  const { runId, findingId } = await params;

  if (isInvalidGuidOrSlugRouteToken(runId) || isInvalidDynamicRouteToken(findingId)) {
    notFound();
  }

  return children;
}
