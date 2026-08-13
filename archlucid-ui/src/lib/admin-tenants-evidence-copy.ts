import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { INTERNAL_TENANTS_PATH } from "@/lib/internal-ops-route-paths";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";

export const ADMIN_TENANTS_CANONICAL_PATH = INTERNAL_TENANTS_PATH;

export const ADMIN_TENANTS_HELP_TOPIC_LABEL = "How tenant provisioning works" as const;

export const ADMIN_TENANTS_CLAIM_DISCIPLINE =
  "Tenant provisioning and shut-off controls manage tenant lifecycle for platform administrators — they are not a signed-review diligence Sources package. Open Tenant health or Audit when you need engagement scores or governed trails.";

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
