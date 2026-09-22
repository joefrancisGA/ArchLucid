import { redirect } from "next/navigation";

import { RemediationPatternsClient } from "./RemediationPatternsClient";
import { GOVERNANCE_REMEDIATION_PATTERNS_PATH } from "@/lib/governance/governance-route-paths";
import { remediationPatternsPathForProductLine } from "@/lib/product-line/securenow-remediation-patterns-route";
import { resolveProductLineIdFromEnv } from "@/lib/product-line/resolve-product-line-id";

type RemediationPatternsPageProps = {
  readonly searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

/** IE-14 remediation pattern registry — list, version history, YAML import, SoD-gated approve. */
export default async function RemediationPatternsPage(props: RemediationPatternsPageProps) {
  const canonicalPath = remediationPatternsPathForProductLine(resolveProductLineIdFromEnv());

  if (canonicalPath !== GOVERNANCE_REMEDIATION_PATTERNS_PATH) {
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

  return <RemediationPatternsClient />;
}
