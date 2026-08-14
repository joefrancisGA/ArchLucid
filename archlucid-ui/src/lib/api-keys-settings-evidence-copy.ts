import { CLI_USAGE_HELP_PATH } from "@/lib/cli-usage-help-route";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";

/** Retired in-product route — redirects to Users when the surface flag is off. */
export const API_KEYS_SETTINGS_RETIRED_ROUTE_PATH = "/administration/api-keys" as const;

export const API_KEYS_OPERATOR_CANONICAL_PATH = "/administration/api-keys" as const;

export const API_KEYS_HELP_TOPIC_LABEL = "How API keys work";

/** Host automation credential guidance (CLI usage help — not the retired settings page). */
export const API_KEYS_SETTINGS_CANONICAL_PATH = CLI_USAGE_HELP_PATH;

export const API_KEYS_SETTINGS_CLAIM_DISCIPLINE =
  "This API keys page manages automation credentials for approved enterprise configurations - it is not a sealed-review diligence Sources package. Open Users and roles help, Audit, or Assurance status when you need membership, governed trails, or trust cites.";

export const API_KEYS_SETTINGS_SOURCES_INTRO =
  "Use these follow-ups when key rotation turns into membership setup, audit trails, CLI usage, or assurance cites.";


/** Operator Sources — no self-href to the retired `/administration/api-keys` route. */
export const API_KEYS_SETTINGS_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Users and roles help", href: inAppHelpHref("users-and-roles") },
  { label: "Users and roles", href: "/administration/users" },
  { label: "CLI usage help", href: inAppHelpHref("cli-usage") },
  { label: "Audit", href: GOVERNANCE_AUDIT_PATH },
  { label: "Assurance status", href: "/security-trust" },
] as const;
