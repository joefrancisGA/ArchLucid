/** Cloud connections page copy — cloud-neutral, no platform advocacy. */

export const CLOUD_CONNECTIONS_PAGE_TITLE = "Cloud connections";

export const CLOUD_CONNECTIONS_PAGE_SUBTITLE =
  "Connect cloud providers for read-only evidence collection, or run evidence-only reviews from briefs, diagrams, documents, and IaC exports.";

export const CLOUD_CONNECTIONS_OPTIONAL_NOTE =
  "Cloud connectors are optional. You can complete a review using uploaded evidence and connect cloud providers later.";

export const CLOUD_CONNECTIONS_HUB_VOCABULARY_DISCLOSURE_TITLE =
  "How this differs from Connection status and Extract & Upload";

export const CLOUD_CONNECTIONS_PROVIDER_EVIDENCE_NONE = "None collected yet";

/** Compact empty-state line for unconfigured provider landing cards (TB-1143). */
export const CLOUD_CONNECTIONS_PROVIDER_NOT_CONNECTED = "Not connected";

export const CLOUD_CONNECTIONS_PROVIDER_AUTH_MODEL: Readonly<Record<"azure" | "aws" | "gcp", string>> = {
  azure: "Workload identity federation (read-only service principal)",
  aws: "OIDC federation to read-only IAM role",
  gcp: "Workload Identity Federation to read-only service account",
};

export const CLOUD_CONNECTIONS_SECURITY_PREFLIGHT_INTRO =
  "Review these items with your cloud or security team before enabling collection. This checklist is guidance only — ArchLucid does not save it as proof or add it to the audit log.";

export const CLOUD_CONNECTIONS_RECENT_ACTIVITY_TITLE = "Recent connection activity";

export const CLOUD_CONNECTIONS_RECENT_ACTIVITY_EMPTY_TITLE = "No connection activity yet";

export const CLOUD_CONNECTIONS_DETAIL_SECTIONS = [
  "Overview",
  "Security preflight",
  "Identity and access setup",
  "Connection details",
  "Validate connection",
  CLOUD_CONNECTIONS_RECENT_ACTIVITY_TITLE,
  "Technical details",
] as const;
