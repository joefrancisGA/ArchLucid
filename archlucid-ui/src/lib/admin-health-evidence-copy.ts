import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const ADMIN_HEALTH_CLAIM_DISCIPLINE =
  "Diagnostics dashboard shows workspace health, readiness, and configuration advisories for operators — it is not a signed-review diligence Sources package. Open System health, Audit, or Assurance status when you need governed or evaluation trails.";

export const ADMIN_HEALTH_SOURCES_INTRO =
  "Use these follow-ups when diagnostics need customer-facing readiness, activity trails, or troubleshooting guides.";

export type AdminHealthSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to /internal/health. */
export const ADMIN_HEALTH_SOURCES: readonly AdminHealthSourceLink[] = [
  { label: "System health", href: "/administration/system-health" },
  { label: "Configuration summary", href: "/internal/configuration" },
  { label: "Audit trail", href: "/governance/audit" },
  { label: "Troubleshooting", href: inAppHelpHref("troubleshooting") },
  { label: "Assurance status", href: "/security-trust" },
] as const;
