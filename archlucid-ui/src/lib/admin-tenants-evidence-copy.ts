import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { INTERNAL_TENANTS_PATH } from "@/lib/internal-ops-route-paths";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";

export const ADMIN_TENANTS_CANONICAL_PATH = INTERNAL_TENANTS_PATH;

export const ADMIN_TENANTS_HELP_TOPIC_LABEL = "How tenant provisioning works" as const;

export const ADMIN_TENANTS_FOLLOW_UPS_TITLE = "Where to go next";

export const ADMIN_TENANTS_CLAIM_DISCIPLINE =
  "Tenant provisioning and shut-off controls manage tenant lifecycle for platform administrators — not a full audit export. Open Tenant health or Audit for engagement scores or activity records.";

export const ADMIN_TENANTS_SOURCES_INTRO =
  "Use these follow-ups when a provisioned tenant needs engagement checks, isolation guidance, or onboarding help.";


/** Operator Sources — no self-href to `/internal/tenants`. */
export const ADMIN_TENANTS_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Tenant health", href: "/internal/tenant-health" },
  { label: "Audit", href: GOVERNANCE_AUDIT_PATH },
  { label: "Enterprise onboarding", href: inAppHelpHref("enterprise-onboarding") },
  { label: "Data handling & isolation", href: inAppHelpHref("data-handling") },
  { label: "System health", href: "/administration/system-health" },
] as const;
