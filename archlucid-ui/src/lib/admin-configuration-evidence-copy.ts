import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";
import { INTERNAL_CONFIGURATION_PATH } from "@/lib/internal-ops-route-paths";

export const ADMIN_CONFIGURATION_CANONICAL_PATH = INTERNAL_CONFIGURATION_PATH;

export const ADMIN_CONFIGURATION_HELP_TOPIC_LABEL = "How configuration summary works" as const;

export const ADMIN_CONFIGURATION_FOLLOW_UPS_TITLE = "Where to go next";

export const ADMIN_CONFIGURATION_SOURCES_INTRO =
  "Use these follow-ups when a config key needs readiness checks, troubleshooting, or activity trails.";


/** Operator Sources — no self-href to /internal/configuration. */
export const ADMIN_CONFIGURATION_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Diagnostics dashboard", href: "/internal/health" },
  { label: "System health", href: "/administration/system-health" },
  { label: "Audit trail", href: GOVERNANCE_AUDIT_PATH },
  { label: "Configuration help", href: inAppHelpHref("configuration-reference") },
  { label: "Troubleshooting", href: inAppHelpHref("troubleshooting") },
] as const;
