import { CLOUD_CONNECTIONS_PATH } from "@/lib/integrations-nav-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export type CloudProviderConnectionKey = "aws" | "azure" | "gcp";

export const CONNECT_AZURE_SECURELY_HELP_TOPIC_LABEL = "How Azure cloud connection works" as const;

export const CLOUD_PROVIDER_CONNECTION_PATHS: Record<CloudProviderConnectionKey, string> = {
  aws: "/integrations/cloud-connections/aws",
  azure: "/integrations/cloud-connections/azure",
  gcp: "/integrations/cloud-connections/gcp",
};

export const CLOUD_PROVIDER_CONNECTION_CLAIM_DISCIPLINE =
  "Cloud provider connection pages configure read-only federated inventory collection — not a full audit export. Open Cloud connections or Connection status for connector health.";

export const CLOUD_PROVIDER_CONNECTION_SOURCES_INTRO =
  "Use these follow-ups when federation setup, connection health, or provider help needs attention before treating inventory as authoritative.";


const PROVIDER_HELP_SLUG: Record<CloudProviderConnectionKey, string> = {
  aws: "cloud-connections-aws",
  azure: "cloud-connections-azure",
  gcp: "cloud-connections-gcp",
};

const PROVIDER_HELP_LABEL: Record<CloudProviderConnectionKey, string> = {
  aws: "Connect AWS securely",
  azure: "Connect Azure securely",
  gcp: "Connect GCP securely",
};

/** Operator Sources for a provider detail page — excludes that provider's self-path. */
export function cloudProviderConnectionSources(
  provider: CloudProviderConnectionKey,
): readonly EvidenceSourceLink[] {
  const selfPath = CLOUD_PROVIDER_CONNECTION_PATHS[provider];

  const links: EvidenceSourceLink[] = [
    { label: "Cloud connections", href: CLOUD_CONNECTIONS_PATH },
    { label: "Connection status", href: "/administration/connection-status" },
    { label: PROVIDER_HELP_LABEL[provider], href: inAppHelpHref(PROVIDER_HELP_SLUG[provider]) },
    { label: "Cloud connections help", href: inAppHelpHref("cloud-connections") },
    { label: "How ArchLucid works", href: inAppHelpHref("getting-started", "how-archlucid-works") },
  ];

  return links.filter((link) => link.href !== selfPath);
}
