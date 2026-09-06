import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { ResourceHubClient } from "@/app/(operator)/governance/infrastructure/resources/[cloudResourceId]/ResourceHubClient";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { isInvalidDynamicRouteToken } from "@/lib/route-dynamic-param";

export const metadata: Metadata = {
  title: OPERATOR_NAV_LINK_LABELS.infrastructureResources,
};

type InfrastructureResourceHubPageProps = {
  params: Promise<{ cloudResourceId: string }>;
};

/** IE-UX-04 per-resource evidence hub with drift, diagram, findings, and audit lineage tabs. */
export default async function InfrastructureResourceHubPage(props: InfrastructureResourceHubPageProps) {
  const { cloudResourceId } = await props.params;

  if (isInvalidDynamicRouteToken(cloudResourceId)) {
    notFound();
  }

  return <ResourceHubClient cloudResourceId={cloudResourceId.trim()} />;
}
