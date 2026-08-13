import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import {
  PREFERENCES_SETTINGS_CANONICAL_PATH,
  PREFERENCES_SETTINGS_CLAIM_DISCIPLINE,
  PREFERENCES_SETTINGS_SOURCES,
  PREFERENCES_SETTINGS_SOURCES_INTRO,
} from "@/lib/preferences-settings-evidence-copy";

export const PREFERENCES_HELP_CANONICAL_PATH = "/help/preferences" as const;

export const PREFERENCES_HELP_CLAIM_DISCIPLINE =
  "This guide explains personal preferences — it is not a signed-review diligence Sources package.";

export const PREFERENCES_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const PREFERENCES_HELP_SOURCES_INTRO = PREFERENCES_SETTINGS_SOURCES_INTRO;

export const PREFERENCES_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Preferences", href: PREFERENCES_SETTINGS_CANONICAL_PATH },
  { label: "Sign-in methods", href: "/administration/account-security" },
  { label: "Getting started help", href: "/help/getting-started" },
  { label: "Users and roles", href: "/administration/users" },
  { label: "Assurance status", href: "/security-trust" },
] as const;

export const PREFERENCES_HELP_OPERATOR_CLAIM = PREFERENCES_SETTINGS_CLAIM_DISCIPLINE;
