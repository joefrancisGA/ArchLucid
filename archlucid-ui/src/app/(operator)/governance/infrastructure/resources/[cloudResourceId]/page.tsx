import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";

import { ResourceHubClient } from "@/app/(operator)/governance/infrastructure/resources/[cloudResourceId]/ResourceHubClient";
import { GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH } from "@/lib/governance/governance-infrastructure-route-paths";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { infrastructureResourceHubPathForProductLine } from "@/lib/product-line/securenow-infrastructure-resources-route";
import { resolveProductLineIdForServer } from "@/lib/product-line/resolve-product-line-id-server";
import { isInvalidDynamicRouteToken } from "@/lib/route-dynamic-param";

export const metadata: Metadata = {
  title: OPERATOR_NAV_LINK_LABELS.infrastructureResources,
};

type InfrastructureResourceHubPageProps = {
  params: Promise<{ cloudResourceId: string }>;
  readonly searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function InfrastructureResourceHubPage(props: InfrastructureResourceHubPageProps) {
  const { cloudResourceId } = await props.params;

  if (isInvalidDynamicRouteToken(cloudResourceId)) {
    notFound();
  }

  const trimmedCloudResourceId = cloudResourceId.trim();
  const canonicalPath = infrastructureResourceHubPathForProductLine(
    await resolveProductLineIdForServer(),
    trimmedCloudResourceId,
  );
  const governanceHubPath = `${GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH}/${trimmedCloudResourceId}`;

  if (canonicalPath !== governanceHubPath) {
    const searchParams = props.searchParams !== undefined ? await props.searchParams : {};
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(searchParams)) {
      if (value === undefined) continue;
      if (Array.isArray(value)) {
        for (const entry of value) params.append(key, entry);
      } else {
        params.set(key, value);
      }
    }

    const query = params.toString();
    redirect(query.length === 0 ? canonicalPath : `${canonicalPath}?${query}`);
  }

  return <ResourceHubClient cloudResourceId={trimmedCloudResourceId} />;
}
