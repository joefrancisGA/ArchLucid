import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const CLOUD_CONNECTIONS_HELP_PATH = "/help/cloud-connections" as const;

export const CLOUD_CONNECTIONS_HELP_PAGE_TITLE = "Cloud connections";

export const CLOUD_CONNECTIONS_HELP_PAGE_SUBTITLE =
  "Optional Azure, AWS, and GCP connectors for read-only evidence — or run evidence-only reviews without any cloud connector.";

export const CLOUD_CONNECTIONS_HELP_PAGE_INTRO =
  "Cloud connectors are optional and read-only. Pick a tier below when you need provider inventory in a review — or skip connectors entirely and attach other evidence.";

export const CLOUD_CONNECTIONS_HELP_CLAIM_DISCIPLINE_LEAD =
  "This guide explains how cloud connectors supply inventory evidence for reviews — it is not a signed-review diligence Sources package.";

export const CLOUD_CONNECTIONS_HELP_CLAIM_DISCIPLINE_TRAIL =
  "before treating setup guidance as assurance evidence.";

export const CLOUD_CONNECTIONS_HELP_CLAIM_DISCIPLINE_STATUS_LABEL = "Orientation" as const;

export const CLOUD_CONNECTIONS_HELP_ORIENTATION_TITLE = "About this guide" as const;

export const CLOUD_CONNECTIONS_HELP_ACTION_PANEL_TITLE = "Where to go next" as const;

export const CLOUD_CONNECTIONS_HELP_ACTION_PANEL_INTRO =
  "Use these follow-ups when connector setup needs the live hub, provider-specific secure-connect help, or assurance cites.";

export const CLOUD_CONNECTIONS_HELP_CHOOSE_PLATFORM_TITLE = "Choose your cloud platform" as const;

export const CLOUD_CONNECTIONS_HELP_TIER_1 = {
  title: "Tier 1 · Upload inventory",
  statusLabel: "Default",
  useWhen:
    "Run packaging scripts from your ArchLucid distribution, then upload the inventory ZIP from the New architecture review wizard. ArchLucid never receives long-lived credentials in your cloud account.",
} as const;

export const CLOUD_CONNECTIONS_HELP_TIER_2 = {
  title: "Tier 2 · Cloud-connected pull",
  statusLabel: "Optional",
  useWhen:
    "Federated read-only roles in Azure, AWS, or GCP when you want ArchLucid to poll inventory on a schedule without storing access keys in tenant configuration.",
} as const;

export const CLOUD_CONNECTIONS_HELP_PACKAGING_SCRIPTS = [
  "Get-ArchLucidAzurePackage.ps1",
  "Get-ArchLucidAwsPackage.ps1",
  "Get-ArchLucidGcpPackage.ps1",
] as const;

/** Wizard shows download/run commands for packaging scripts — not `/help/cli-usage` (product .NET CLI). */
export const CLOUD_CONNECTIONS_HELP_PACKAGING_SCRIPTS_HINT =
  "These scripts ship with your ArchLucid distribution. Download and run commands for each platform live in";

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
  { label: "Assurance status", href: "/security-trust", kind: "product" },
  { label: "Getting started", href: inAppHelpHref("getting-started"), kind: "help" },
  {
    label: "How ArchLucid works",
    href: inAppHelpHref("getting-started", "how-archlucid-works"),
    kind: "help",
  },
] as const;

/** Operator Sources — no self-href to `/help/cloud-connections`. */
export const CLOUD_CONNECTIONS_HELP_SOURCES: readonly CloudConnectionsHelpFollowUpLink[] = [
  { label: "Cloud connections hub", href: "/integrations/cloud-connections", kind: "product" },
  { label: "Assurance status", href: "/security-trust", kind: "product" },
  { label: "Getting started", href: inAppHelpHref("getting-started"), kind: "help" },
  {
    label: "How ArchLucid works",
    href: inAppHelpHref("getting-started", "how-archlucid-works"),
    kind: "help",
  },
] as const;

export const CLOUD_CONNECTIONS_HELP_SOURCES_INTRO = CLOUD_CONNECTIONS_HELP_ACTION_PANEL_INTRO;

export const CLOUD_CONNECTIONS_HELP_PRIMARY_ACTIONS = {
  startEvidenceOnlyReview: {
    label: "New architecture review",
    href: "/architecture/reviews/new",
  },
  openHub: { label: "Open cloud connections", href: "/integrations/cloud-connections" },
} as const;
