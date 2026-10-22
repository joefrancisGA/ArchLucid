import { redirect } from "next/navigation";

import { RemediationPatternsClient } from "@/app/(operator)/governance/remediation-patterns/RemediationPatternsClient";
import { SECURENOW_REMEDIATION_PATTERNS_PATH } from "@/lib/governance/governance-route-paths";
import { remediationPatternsPathForProductLine } from "@/lib/product-line/securenow-remediation-patterns-route";
import { resolveProductLineIdForServer } from "@/lib/product-line/resolve-product-line-id-server";

type SecureNowRemediationPatternsPageProps = {
  readonly searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SecureNowRemediationPatternsPage(props: SecureNowRemediationPatternsPageProps) {
  const canonicalPath = remediationPatternsPathForProductLine(await resolveProductLineIdForServer());

  if (canonicalPath !== SECURENOW_REMEDIATION_PATTERNS_PATH) {
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

  return <RemediationPatternsClient />;
}
