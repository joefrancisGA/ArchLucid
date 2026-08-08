import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const CLOUD_CONNECTIONS_HELP_PATH = "/help/cloud-connections" as const;

export const CLOUD_CONNECTIONS_HELP_PAGE_TITLE = "Cloud connections";

export const CLOUD_CONNECTIONS_HELP_PAGE_SUBTITLE =
  "Optional Azure, AWS, and GCP connectors for read-only evidence — or run evidence-only reviews without any cloud connector.";

export const CLOUD_CONNECTIONS_HELP_CLAIM_DISCIPLINE =
  "This guide explains how cloud connectors supply inventory evidence for reviews — it is not a signed-review diligence Sources package. Open Assurance status or the live Cloud connections hub before treating setup guidance as assurance evidence.";

export const CLOUD_CONNECTIONS_HELP_SOURCES_INTRO =
  "Use these follow-ups when connector setup needs the live hub, provider-specific secure-connect help, or assurance cites.";

export type CloudConnectionsHelpSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to `/help/cloud-connections`. */
export const CLOUD_CONNECTIONS_HELP_SOURCES: readonly CloudConnectionsHelpSourceLink[] = [
  { label: "Cloud connections hub", href: "/integrations/cloud-connections" },
  { label: "Connect Azure securely", href: inAppHelpHref("cloud-connections-azure") },
  { label: "Assurance status", href: "/security-trust" },
  { label: "Getting started", href: inAppHelpHref("getting-started") },
  { label: "How ArchLucid works", href: inAppHelpHref("getting-started") },
] as const;

export const CLOUD_CONNECTIONS_HELP_PRIMARY_ACTIONS = {
  openHub: { label: "Open cloud connections", href: "/integrations/cloud-connections" },
  connectAzure: { label: "Connect Azure securely", href: inAppHelpHref("cloud-connections-azure") },
} as const;
