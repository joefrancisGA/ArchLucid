import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ResourcesExplorerClient } from "@/app/(operator)/governance/infrastructure/resources/ResourcesExplorerClient";
import { GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH } from "@/lib/governance/governance-infrastructure-route-paths";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { infrastructureResourcesPathForProductLine } from "@/lib/product-line/securenow-infrastructure-resources-route";
import { resolveProductLineIdFromEnv } from "@/lib/product-line/resolve-product-line-id";

export const metadata: Metadata = {
  title: OPERATOR_NAV_LINK_LABELS.infrastructureResources,
};

type InfrastructureResourcesPageProps = {
  readonly searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

/** IE-UX-04 resource explorer — search cloud resources and open the evidence hub. */
export default async function InfrastructureResourcesPage(props: InfrastructureResourcesPageProps) {
  const canonicalPath = infrastructureResourcesPathForProductLine(resolveProductLineIdFromEnv());

  if (canonicalPath !== GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH) {
    const searchParams = props.searchParams !== undefined ? await props.searchParams : {};
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(searchParams)) {
      if (value === undefined) {
        continue;
      }

      if (Array.isArray(value)) {
        for (const entry of value) {
          params.append(key, entry);
        }
      } else {
        params.set(key, value);
      }
    }

    const query = params.toString();

    redirect(query.length === 0 ? canonicalPath : `${canonicalPath}?${query}`);
  }

  return <ResourcesExplorerClient />;
}
