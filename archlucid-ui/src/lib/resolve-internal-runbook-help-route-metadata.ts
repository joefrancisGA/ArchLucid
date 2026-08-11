import type { Metadata } from "next";
import { headers } from "next/headers";

import { CLI_USAGE_HELP_ROUTE_METADATA } from "@/lib/cli-usage-help-route-metadata";
import { CONFIGURATION_REFERENCE_HELP_ROUTE_METADATA } from "@/lib/configuration-reference-help-route-metadata";
import { DEVELOPER_TROUBLESHOOTING_HELP_ROUTE_METADATA } from "@/lib/developer-troubleshooting-help-route-metadata";
import { FIRST_REVIEW_HELP_ROUTE_METADATA } from "@/lib/first-review-help-route-metadata";
import { FIRST_VALUE_20_HELP_ROUTE_METADATA } from "@/lib/first-value-20-help-route-metadata";
import { API_CONTRACTS_HELP_ROUTE_METADATA } from "@/lib/api-contracts-help-route-metadata";
import { POLICY_PACK_DELTA_DEMO_HELP_ROUTE_METADATA } from "@/lib/policy-pack-delta-demo-help-route-metadata";
import { principalCanAccessHelpTopic } from "@/lib/product-documentation-access";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { getInboundAuthenticatedServerPrincipal } from "@/lib/server-current-principal";

/** Non-leaking title — never claim "not found" for a route that still renders the authority gate. */
const UNAUTHORIZED_INTERNAL_RUNBOOK_METADATA: Metadata = {
  title: "ArchLucid",
  robots: { index: false, follow: false },
};

const AUTHORIZED_INTERNAL_RUNBOOK_METADATA_BY_SLUG: Readonly<Record<string, Metadata>> = {
  "developer-troubleshooting": DEVELOPER_TROUBLESHOOTING_HELP_ROUTE_METADATA,
  "first-review": FIRST_REVIEW_HELP_ROUTE_METADATA,
  "first-value-20-minutes": FIRST_VALUE_20_HELP_ROUTE_METADATA,
  "policy-pack-delta-demo": POLICY_PACK_DELTA_DEMO_HELP_ROUTE_METADATA,
  "cli-usage": CLI_USAGE_HELP_ROUTE_METADATA,
  "api-contracts": API_CONTRACTS_HELP_ROUTE_METADATA,
  "configuration-reference": CONFIGURATION_REFERENCE_HELP_ROUTE_METADATA,
};

function authorizedInternalRunbookMetadata(entry: ProductDocumentationEntry): Metadata {
  const known = AUTHORIZED_INTERNAL_RUNBOOK_METADATA_BY_SLUG[entry.slug];

  if (known !== undefined) {
    return known;
  }

  return {
    title: entry.title,
    description: entry.summary,
    robots: { index: false, follow: false },
  };
}

/** Authorized Admin sees the real title; everyone else gets a neutral not-found title. */
export async function resolveInternalRunbookHelpRouteMetadata(
  entry: ProductDocumentationEntry,
): Promise<Metadata> {
  const inboundAuthorization = (await headers()).get("authorization")?.trim() ?? "";

  if (inboundAuthorization.length === 0) {
    return UNAUTHORIZED_INTERNAL_RUNBOOK_METADATA;
  }

  const principal = await getInboundAuthenticatedServerPrincipal();

  if (!principalCanAccessHelpTopic(entry, principal)) {
    return UNAUTHORIZED_INTERNAL_RUNBOOK_METADATA;
  }

  return authorizedInternalRunbookMetadata(entry);
}
