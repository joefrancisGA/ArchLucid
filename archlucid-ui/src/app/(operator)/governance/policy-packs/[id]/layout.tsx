import type { ReactNode } from "react";
import { notFound } from "next/navigation";

import { isInvalidDynamicRouteToken } from "@/lib/route-dynamic-param";

export {
  dynamic,
  fetchCache,
  revalidate,
} from "@/lib/next/operator-data-route-policy";

export default async function GovernancePolicyPackLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (isInvalidDynamicRouteToken(id)) {
    notFound();
  }

  return children;
}
