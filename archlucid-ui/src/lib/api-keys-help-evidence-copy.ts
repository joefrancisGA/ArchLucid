import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import {
  API_KEYS_OPERATOR_CANONICAL_PATH,
  API_KEYS_SETTINGS_CLAIM_DISCIPLINE,
  API_KEYS_SETTINGS_SOURCES_INTRO,
} from "@/lib/api-keys-settings-evidence-copy";

export const API_KEYS_HELP_CANONICAL_PATH = "/help/api-keys" as const;

export const API_KEYS_HELP_CLAIM_DISCIPLINE =
  "This guide explains workspace API key rotation and automation credentials — it is not a signed-review diligence Sources package.";

export const API_KEYS_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const API_KEYS_HELP_SOURCES_INTRO = API_KEYS_SETTINGS_SOURCES_INTRO;

export const API_KEYS_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "API keys", href: API_KEYS_OPERATOR_CANONICAL_PATH },
  { label: "Users and roles", href: "/administration/users" },
  { label: "Users and roles help", href: "/help/users-and-roles" },
  { label: "CLI usage help", href: "/help/cli-usage" },
  { label: "Audit", href: "/governance/audit" },
  { label: "Assurance status", href: "/security-trust" },
] as const;

export const API_KEYS_HELP_OPERATOR_CLAIM = API_KEYS_SETTINGS_CLAIM_DISCIPLINE;
