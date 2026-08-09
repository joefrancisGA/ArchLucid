import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const CLOUD_CONNECTIONS_HELP_PATH = "/help/cloud-connections" as const;

export const CLOUD_CONNECTIONS_HELP_PAGE_TITLE = "Cloud connections";

export const CLOUD_CONNECTIONS_HELP_PAGE_SUBTITLE =
  "Optional Azure, AWS, and GCP connectors for read-only evidence — or run evidence-only reviews without any cloud connector.";

export const CLOUD_CONNECTIONS_HELP_CLAIM_DISCIPLINE =
  "This guide explains how cloud connectors supply inventory evidence for reviews — it is not a signed-review diligence Sources package. Open Assurance status or the live Cloud connections hub before treating setup guidance as assurance evidence.";

export const CLOUD_CONNECTIONS_HELP_CLAIM_DISCIPLINE_STATUS_LABEL = "Orientation" as const;

export const CLOUD_CONNECTIONS_HELP_ACTION_PANEL_TITLE = "Where to go next" as const;

export const CLOUD_CONNECTIONS_HELP_ACTION_PANEL_INTRO =
  "Use these follow-ups when connector setup needs the live hub, provider-specific secure-connect help, or assurance cites.";

export const CLOUD_CONNECTIONS_HELP_CHOOSE_PLATFORM_TITLE = "Choose your cloud platform" as const;

export const CLOUD_CONNECTIONS_HELP_TIER_1_DEFINITION =
  "Tier 1 (default): run Get-ArchLucidAzurePackage.ps1, Get-ArchLucidAwsPackage.ps1, or Get-ArchLucidGcpPackage.ps1 from your ArchLucid clone, then upload the inventory ZIP from the New architecture review wizard. ArchLucid never receives long-lived credentials in your cloud account.";

export const CLOUD_CONNECTIONS_HELP_TIER_2_DEFINITION =
  "Tier 2 (optional): cloud-connected hosted pull through federated read-only roles in Azure, AWS, or GCP. Use this when you want ArchLucid to poll inventory on a schedule without storing access keys in tenant configuration.";

export type CloudConnectionsProviderScopeRow = {
  readonly platform: string;
  readonly identityModel: string;
  readonly roleOrScope: string;
  readonly scopeUnit: string;
  readonly guideHref: string;
  readonly guideLabel: string;
};

export const CLOUD_CONNECTIONS_HELP_PROVIDER_SCOPE_ROWS: readonly CloudConnectionsProviderScopeRow[] = [
  {
    platform: "Azure",
    identityModel: "Workload identity federation",
    roleOrScope: "Reader + Cost Management Reader",
    scopeUnit: "Subscription",
    guideHref: inAppHelpHref("cloud-connections-azure"),
    guideLabel: "Connect Azure securely",
  },
  {
    platform: "AWS",
    identityModel: "OIDC web identity federation",
    roleOrScope: "Read-only IAM role (Resource Explorer)",
    scopeUnit: "AWS account",
    guideHref: inAppHelpHref("cloud-connections-aws"),
    guideLabel: "Connect AWS securely",
  },
  {
    platform: "GCP",
    identityModel: "Workload Identity Federation",
    roleOrScope: "Cloud Asset Viewer",
    scopeUnit: "GCP project",
    guideHref: inAppHelpHref("cloud-connections-gcp"),
    guideLabel: "Connect GCP securely",
  },
] as const;

export type CloudConnectionsHelpFollowUpLink = {
  readonly label: string;
  readonly href: string;
  readonly kind: "product" | "help";
};

export const CLOUD_CONNECTIONS_HELP_FOLLOW_UP_LINKS: readonly CloudConnectionsHelpFollowUpLink[] = [
  {
    label: "Read the Azure connection guide",
    href: inAppHelpHref("cloud-connections-azure"),
    kind: "help",
  },
  { label: "Assurance status", href: "/security-trust", kind: "product" },
  { label: "Getting started", href: inAppHelpHref("getting-started"), kind: "help" },
  { label: "How ArchLucid works", href: inAppHelpHref("getting-started"), kind: "help" },
] as const;

/** Operator Sources — no self-href to `/help/cloud-connections`. */
export const CLOUD_CONNECTIONS_HELP_SOURCES: readonly CloudConnectionsHelpFollowUpLink[] = [
  { label: "Cloud connections hub", href: "/integrations/cloud-connections", kind: "product" },
  {
    label: "Read the Azure connection guide",
    href: inAppHelpHref("cloud-connections-azure"),
    kind: "help",
  },
  { label: "Assurance status", href: "/security-trust", kind: "product" },
  { label: "Getting started", href: inAppHelpHref("getting-started"), kind: "help" },
  { label: "How ArchLucid works", href: inAppHelpHref("getting-started"), kind: "help" },
] as const;

export const CLOUD_CONNECTIONS_HELP_SOURCES_INTRO = CLOUD_CONNECTIONS_HELP_ACTION_PANEL_INTRO;

export const CLOUD_CONNECTIONS_HELP_PRIMARY_ACTIONS = {
  openHub: { label: "Open cloud connections", href: "/integrations/cloud-connections" },
} as const;
