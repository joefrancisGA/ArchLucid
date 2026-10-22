import { notFound } from "next/navigation";

import { PolicyPackDetailClient } from "@/app/(operator)/governance/policy-packs/[id]/PolicyPackDetailClient";
import { isInvalidDynamicRouteToken } from "@/lib/route-dynamic-param";

/** SecureNow policy pack detail. */
export default async function SecureNowPolicyPackDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (isInvalidDynamicRouteToken(id)) {
    notFound();
  }

  return <PolicyPackDetailClient policyPackId={id.trim()} />;
}
