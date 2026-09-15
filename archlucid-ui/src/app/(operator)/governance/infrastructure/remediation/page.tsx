import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { RemediationWorkbenchClient } from "@/app/(operator)/governance/infrastructure/remediation/RemediationWorkbenchClient";
import { GOVERNANCE_INFRASTRUCTURE_REMEDIATION_PATH } from "@/lib/governance/governance-infrastructure-route-paths";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { resolveProductLineIdFromEnv } from "@/lib/product-line/resolve-product-line-id";
import { remediationInstancesPathForProductLine } from "@/lib/product-line/securenow-remediation-instances-route";

export const metadata: Metadata = {
  title: OPERATOR_NAV_LINK_LABELS.infrastructureRemediation,
};

type InfrastructureRemediationPageProps = {
  readonly searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

/** IE-UX-05 remediation factory workbench — instance lifecycle with advisory-only execute honesty. */
export default async function InfrastructureRemediationPage(props: InfrastructureRemediationPageProps) {
  const canonicalPath = remediationInstancesPathForProductLine(resolveProductLineIdFromEnv());

  if (canonicalPath !== GOVERNANCE_INFRASTRUCTURE_REMEDIATION_PATH) {
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

  return <RemediationWorkbenchClient />;
}
