import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { ResourceHubClient } from "@/app/(operator)/governance/infrastructure/resources/[cloudResourceId]/ResourceHubClient";
import { isInvalidDynamicRouteToken } from "@/lib/route-dynamic-param";
import { getRouteTitle } from "@/lib/route-titles";

export const metadata: Metadata = {
  title: getRouteTitle("/infrastructure/resources"),
};

type SecureNowInfrastructureResourceHubPageProps = {
  params: Promise<{ cloudResourceId: string }>;
};

/** SecureNow per-resource evidence hub with drift, diagram, findings, and audit lineage tabs. */
export default async function SecureNowInfrastructureResourceHubPage(
  props: SecureNowInfrastructureResourceHubPageProps,
) {
  const { cloudResourceId } = await props.params;

  if (isInvalidDynamicRouteToken(cloudResourceId)) {
    notFound();
  }

  return <ResourceHubClient cloudResourceId={cloudResourceId.trim()} />;
}
