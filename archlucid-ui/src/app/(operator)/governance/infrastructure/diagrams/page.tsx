import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { DiagramsWorkbenchClient } from "@/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient";
import { GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PATH } from "@/lib/governance/governance-infrastructure-route-paths";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { infrastructureDiagramsPathForProductLine } from "@/lib/product-line/securenow-infrastructure-diagrams-route";
import { resolveProductLineIdFromEnv } from "@/lib/product-line/resolve-product-line-id";

export const metadata: Metadata = {
  title: OPERATOR_NAV_LINK_LABELS.infrastructureDiagrams,
};

type InfrastructureDiagramsPageProps = {
  readonly searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

/** IE-UX-02 inventory diagrams workbench — partitioned Mermaid views and server PNG export. */
export default async function InfrastructureDiagramsPage(props: InfrastructureDiagramsPageProps) {
  const canonicalPath = infrastructureDiagramsPathForProductLine(resolveProductLineIdFromEnv());

  if (canonicalPath !== GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PATH) {
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

  return <DiagramsWorkbenchClient />;
}
