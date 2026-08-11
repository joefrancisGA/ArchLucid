/** Cloud connections page copy — cloud-neutral, no platform advocacy. */

export const CLOUD_CONNECTIONS_PAGE_TITLE = "Cloud connections";

export const CLOUD_CONNECTIONS_PAGE_SUBTITLE =
  "Connect cloud providers for read-only evidence collection, or run evidence-only reviews from briefs, diagrams, documents, and IaC exports.";

export const CLOUD_CONNECTIONS_OPTIONAL_NOTE =
  "Cloud connectors are optional. You can complete a review using uploaded evidence and connect cloud providers later.";

export const CLOUD_CONNECTIONS_PLATFORM_SCOPE_HEADING = "Cloud platforms shown";

export const CLOUD_CONNECTIONS_PLATFORM_SCOPE_LEAD =
  "Only show the platforms used by this workspace.";

/** Shown when effective scope has no workspace — panel is disabled (TB-1142). */
export const CLOUD_CONNECTIONS_PLATFORM_SCOPE_WORKSPACE_REQUIRED =
  "Choose a workspace and project before saving which platforms appear here. Platform filters are saved per workspace.";

export const CLOUD_CONNECTIONS_PLATFORM_SCOPE_WORKSPACE_ACTION_LABEL = "How to choose workspace";

export const CLOUD_CONNECTIONS_HUB_VOCABULARY_DISCLOSURE_TITLE =
  "How this differs from Connection status and Extract & Upload";

export const CLOUD_CONNECTIONS_SECURITY_ASSURANCE_TITLE = "Security assurance";

export const CLOUD_CONNECTIONS_SECURITY_ASSURANCE_BODY =
  "Cloud connections use read-only federated access. Review procurement materials and tenant isolation notes before enabling collection in production.";

export const CLOUD_CONNECTIONS_SECURITY_ASSURANCE_LINK_LABEL = "Security & trust";

export const CLOUD_CONNECTIONS_PROVIDER_EVIDENCE_NONE = "None collected yet";

/** Compact empty-state line for unconfigured provider landing cards (TB-1143). */
export const CLOUD_CONNECTIONS_PROVIDER_NOT_CONNECTED = "Not connected";

export const CLOUD_CONNECTIONS_EVIDENCE_ONLY_TITLE = "Evidence-only upload";

export const CLOUD_CONNECTIONS_EVIDENCE_ONLY_SUMMARY =
  "Run architecture reviews from briefs, diagrams, documents, and exported inventory ZIPs without connecting a cloud provider.";

export const CLOUD_CONNECTIONS_PROVIDER_AUTH_MODEL: Readonly<Record<"azure" | "aws" | "gcp", string>> = {
  azure: "Workload identity federation (read-only service principal)",
  aws: "OIDC federation to read-only IAM role",
  gcp: "Workload Identity Federation to read-only service account",
};

export const CLOUD_CONNECTIONS_SECURITY_PREFLIGHT_INTRO =
  "Review these items with your cloud or security team before enabling collection. This checklist is guidance only — ArchLucid does not record it as an attestation or add it to the audit trail.";

export const CLOUD_CONNECTIONS_DETAIL_SECTIONS = [
  "Overview",
  "Security preflight",
  "Identity and access setup",
  "Connection details",
  "Validate connection",
  "Recent collection activity",
  "Technical details",
] as const;
