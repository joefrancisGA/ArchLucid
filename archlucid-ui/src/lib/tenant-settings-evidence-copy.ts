import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const TENANT_SETTINGS_CANONICAL_PATH = "/administration/tenant" as const;

export const TENANT_SETTINGS_CLAIM_DISCIPLINE =
  "This Tenant settings page configures workspace defaults and tenant-wide options - it is not a signed-review diligence Sources package, a CPA SOC 2 attestation, or a published third-party pen-test report. Open Projects recycle bin, Digests schedule, or Assurance status when you need restore, digest timing, or trust cites.";

export const TENANT_SETTINGS_SOURCES_INTRO =
  "Use these follow-ups when tenant defaults turn into recycle-bin restore, digest schedules, or assurance cites.";

export type TenantSettingsSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources - no self-href to tenant settings. */
export const TENANT_SETTINGS_SOURCES: readonly TenantSettingsSourceLink[] = [
  { label: "Projects recycle bin", href: "/administration/tenant/recycle-bin" },
  { label: "Workspace and scope help", href: inAppHelpHref("scope") },
  { label: "Digests schedule", href: "/architecture/digests?tab=schedule" },
  { label: "Users", href: "/administration/users" },
  { label: "Assurance status", href: "/security-trust" },
] as const;
