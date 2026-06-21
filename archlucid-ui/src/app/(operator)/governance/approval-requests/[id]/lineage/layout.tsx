import type { ReactNode } from "react";
import { notFound } from "next/navigation";

import { isInvalidGuidOrSlugRouteToken } from "@/lib/route-dynamic-param";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function GovernanceApprovalLineageLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (isInvalidGuidOrSlugRouteToken(id)) {
    notFound();
  }

  return children;
}
