import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const DEPLOYMENT_STATUS_CANONICAL_PATH = "/admin/deployment-status" as const;

export const DEPLOYMENT_STATUS_CLAIM_DISCIPLINE =
  "This Deployment status page is an internal employee view of release identity and BUILD_ID agreement - it is not a signed-review diligence Sources package, a CPA SOC 2 attestation, or a published third-party pen-test report. Open System health, Demo readiness, or Audit when you need tenant readiness, demo checks, or governed trails.";

export const DEPLOYMENT_STATUS_SOURCES_INTRO =
  "Use these follow-ups when BUILD_ID or health signals turn into workspace readiness, demo diagnostics, or audit activity.";

export type DeploymentStatusSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources - no self-href to `/admin/deployment-status`. */
export const DEPLOYMENT_STATUS_SOURCES: readonly DeploymentStatusSourceLink[] = [
  { label: "System health", href: "/administration/system-health" },
  { label: "Demo readiness", href: "/admin/demo-readiness" },
  { label: "Tenant health", href: "/admin/tenant-health" },
  { label: "Diagnostics dashboard", href: "/admin/health" },
  { label: "Troubleshooting help", href: inAppHelpHref("troubleshooting") },
] as const;
