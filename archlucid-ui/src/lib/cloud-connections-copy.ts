/** Cloud connections page copy — cloud-neutral, no platform advocacy. */

export const CLOUD_CONNECTIONS_PAGE_TITLE = "Cloud connections";

export const CLOUD_CONNECTIONS_PAGE_SUBTITLE =
  "Connect cloud providers for read-only evidence collection, or run evidence-only reviews from briefs, diagrams, documents, and IaC exports.";

export const CLOUD_CONNECTIONS_OPTIONAL_NOTE =
  "Cloud connectors are optional. You can complete a review using uploaded evidence and connect cloud providers later.";

export const CLOUD_CONNECTIONS_PLATFORM_SCOPE_HEADING = "Cloud platforms shown";

export const CLOUD_CONNECTIONS_PLATFORM_SCOPE_LEAD =
  "Only show the platforms used by this workspace.";

export const CLOUD_CONNECTIONS_EVIDENCE_ONLY_TITLE = "Evidence-only upload";

export const CLOUD_CONNECTIONS_EVIDENCE_ONLY_SUMMARY =
  "Run architecture reviews from briefs, diagrams, documents, and exported inventory ZIPs without connecting a cloud provider.";

export const CLOUD_CONNECTIONS_PROVIDER_AUTH_MODEL: Readonly<Record<"azure" | "aws" | "gcp", string>> = {
  azure: "Workload identity federation (read-only service principal)",
  aws: "OIDC federation to read-only IAM role",
  gcp: "Workload Identity Federation to read-only service account",
};

export const CLOUD_CONNECTIONS_SECURITY_PREFLIGHT_INTRO =
  "Confirm these items with your cloud or security team before enabling collection.";

export const CLOUD_CONNECTIONS_SECURITY_PREFLIGHT_SKIP_WARNING =
  "Connection validation can proceed, but security review is recommended before production use.";

export const CLOUD_CONNECTIONS_DETAIL_SECTIONS = [
  "Overview",
  "Security preflight",
  "Identity and access setup",
  "Connection details",
  "Validate connection",
  "Recent collection activity",
  "Technical details",
] as const;
