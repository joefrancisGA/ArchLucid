import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const CONNECTION_STATUS_CANONICAL_PATH = "/administration/connection-status" as const;

export const CONNECTION_STATUS_CLAIM_DISCIPLINE =
  "This Connection status page shows which workspace integrations are configured or recommended - it is not a signed-review diligence Sources package. Open System health, a connector page, or Audit when you need live dependency checks or governed trails.";

export const CONNECTION_STATUS_SOURCES_INTRO =
  "Use these follow-ups when readiness tiles turn into connector setup, system health checks, or integration methodology.";

export type ConnectionStatusSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources - no self-href to `/administration/connection-status`. */
export const CONNECTION_STATUS_SOURCES: readonly ConnectionStatusSourceLink[] = [
  { label: "System health", href: "/administration/system-health" },
  { label: "Integration readiness help", href: inAppHelpHref("integration-readiness") },
  { label: "Cloud connections", href: "/integrations/cloud-connections" },
  { label: "Webhooks", href: "/integrations/webhooks" },
  { label: "Audit", href: "/governance/audit" },
] as const;
