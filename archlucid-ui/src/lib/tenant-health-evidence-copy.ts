import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const TENANT_HEALTH_CANONICAL_PATH = "/internal/tenant-health" as const;

export const TENANT_HEALTH_CLAIM_DISCIPLINE =
  "Tenant health scores summarize engagement, governance activity, and pilot funnel stage for customer-success teams — they are not a signed-review diligence Sources package. Open System health or Audit when you need operational or governed trails.";

export const TENANT_HEALTH_SOURCES_INTRO =
  "Use these follow-ups when a low engagement score needs operational checks, isolation guidance, or product orientation.";

export type TenantHealthSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to tenant-health. */
export const TENANT_HEALTH_SOURCES: readonly TenantHealthSourceLink[] = [
  { label: "System health", href: "/administration/system-health" },
  { label: "Audit", href: "/governance/audit" },
  { label: "Data handling & isolation", href: inAppHelpHref("data-handling") },
  { label: "Troubleshooting", href: inAppHelpHref("troubleshooting") },
  { label: "How ArchLucid works", href: inAppHelpHref("getting-started", "how-archlucid-works") },
] as const;
