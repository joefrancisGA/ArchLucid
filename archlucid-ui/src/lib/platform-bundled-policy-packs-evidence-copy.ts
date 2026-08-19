import { GOVERNANCE_AUDIT_PATH, GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";
import {
  INTERNAL_DEPLOYMENT_STATUS_PATH,
  INTERNAL_PLATFORM_BUNDLED_POLICY_PACKS_PATH,
  INTERNAL_TENANTS_PATH,
} from "@/lib/internal-ops-route-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const PLATFORM_BUNDLED_POLICY_PACKS_CANONICAL_PATH = INTERNAL_PLATFORM_BUNDLED_POLICY_PACKS_PATH;

export const PLATFORM_BUNDLED_POLICY_PACKS_HELP_TOPIC_LABEL = "How platform bundled policy packs work" as const;

export const PLATFORM_BUNDLED_POLICY_PACKS_FOLLOW_UPS_TITLE = "Where to go next";

export const PLATFORM_BUNDLED_POLICY_PACKS_SOURCES_INTRO =
  "Use these follow-ups when global activation changes need tenant provisioning context, live pack assignments, audit trails, or deployment checks.";

/** Operator Sources — no self-href to `/internal/platform-bundled-policy-packs`. */
export const PLATFORM_BUNDLED_POLICY_PACKS_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Policy packs", href: GOVERNANCE_POLICY_PACKS_PATH },
  { label: "Tenants", href: INTERNAL_TENANTS_PATH },
  { label: "Audit trail", href: GOVERNANCE_AUDIT_PATH },
  { label: "Deployment status", href: INTERNAL_DEPLOYMENT_STATUS_PATH },
  { label: "Policy packs help", href: inAppHelpHref("policy-packs") },
] as const;
