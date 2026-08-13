import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";

import { buildGraphRedirectPath } from "@/lib/legacy-architecture-graph-redirect";
import { LEGACY_ARCHITECTURE_GRAPH_ROUTE_METADATA } from "@/lib/legacy-architecture-graph-route-metadata";

type LegacyOperateArchitectureGraphRedirectPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = LEGACY_ARCHITECTURE_GRAPH_ROUTE_METADATA;

/**
 * Legacy Operate bookmark shim — forwards to the canonical evidence graph with query preserved (TB-1808).
 */
export default async function LegacyOperateArchitectureGraphRedirectPage({
  searchParams,
}: LegacyOperateArchitectureGraphRedirectPageProps): Promise<never> {
  const resolvedSearchParams = await searchParams;

  permanentRedirect(buildGraphRedirectPath(resolvedSearchParams));
}
