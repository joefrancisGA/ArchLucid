import type { ReactNode } from "react";
import { notFound } from "next/navigation";

import { isInvalidGuidOrSlugRouteToken } from "@/lib/route-dynamic-param";

export {
  dynamic,
  fetchCache,
  revalidate,
} from "@/lib/next/operator-data-route-policy";

export default async function GovernanceApprovalRequestLayout({
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
