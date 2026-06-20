import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { isInvalidGuidOrSlugRouteToken } from "@/lib/route-dynamic-param";

export {
  dynamic,
  fetchCache,
  revalidate,
} from "@/lib/next/operator-data-route-policy";

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
