import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const DEPLOYMENT_STATUS_CANONICAL_PATH = "/internal/deployment-status" as const;

/** Primary page lead — teaches release identity without BUILD_ID jargon in the first viewport (TB-1426). */
export const ADMIN_DEPLOYMENT_STATUS_PAGE_LEAD =
  "Internal view of release identity, health, and whether production components agree on the same build." as const;

/** Demo-unavailable panel — same job framing without BUILD_ID in primary chrome (TB-1426). */
export const ADMIN_DEPLOYMENT_STATUS_DEMO_UNAVAILABLE_DESCRIPTION =
  "In a connected tenant, ArchLucid personnel compare frontend, API, and worker release builds here." as const;

/** Screen-reader suffix for related links that open off-app (TB-1426). */
export const ADMIN_DEPLOYMENT_STATUS_EXTERNAL_LINK_NEW_TAB_SUFFIX = "(opens in new tab)" as const;

export const DEPLOYMENT_STATUS_CLAIM_DISCIPLINE =
  "This Deployment status page is an internal employee view of release identity and BUILD_ID agreement - it is not a signed-review diligence Sources package. Open System health, Demo readiness, or Audit when you need tenant readiness, demo checks, or governed trails.";

export const DEPLOYMENT_STATUS_SOURCES_INTRO =
  "Use these follow-ups when BUILD_ID or health signals turn into workspace readiness, demo diagnostics, or audit activity.";


/** Operator Sources - no self-href to `/internal/deployment-status`. */
export const DEPLOYMENT_STATUS_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "System health", href: "/administration/system-health" },
  { label: "Demo readiness", href: "/internal/demo-readiness" },
  { label: "Tenant health", href: "/internal/tenant-health" },
  { label: "Diagnostics dashboard", href: "/internal/health" },
  { label: "Troubleshooting help", href: inAppHelpHref("troubleshooting") },
] as const;
