import { redirect } from "next/navigation";

import { RemediationFactoryClient } from "./RemediationFactoryClient";
import { GOVERNANCE_REMEDIATION_FACTORY_PATH } from "@/lib/governance/governance-route-paths";
import { remediationFactoryPathForProductLine } from "@/lib/product-line/securenow-remediation-factory-route";
import { resolveProductLineIdForServer } from "@/lib/product-line/resolve-product-line-id-server";

type RemediationFactoryPageProps = {
  readonly searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RemediationFactoryPage(props: RemediationFactoryPageProps) {
  const canonicalPath = remediationFactoryPathForProductLine(await resolveProductLineIdForServer());

  if (canonicalPath !== GOVERNANCE_REMEDIATION_FACTORY_PATH) {
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

  return <RemediationFactoryClient />;
}
