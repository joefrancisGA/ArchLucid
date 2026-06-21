import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { isInvalidGuidOrSlugRouteToken } from "@/lib/route-dynamic-param";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store" as const;

export default async function ExecutiveReviewRunLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ runId: string }>;
}) {
  const { runId } = await params;

  if (isInvalidGuidOrSlugRouteToken(runId)) {
    notFound();
  }

  return children;
}
