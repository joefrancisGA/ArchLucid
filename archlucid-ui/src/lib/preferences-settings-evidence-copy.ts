import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { ACCOUNT_PREFERENCES_PATH, ACCOUNT_SECURITY_PATH } from "@/lib/account-route-paths";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const PREFERENCES_SETTINGS_CANONICAL_PATH = ACCOUNT_PREFERENCES_PATH;

export const PREFERENCES_HELP_TOPIC_LABEL = "How preferences work";

export const PREFERENCES_SETTINGS_CLAIM_DISCIPLINE_HEADING = "What this page does not cover";

export const PREFERENCES_SETTINGS_FOLLOW_UPS_TITLE = "Where to go next";

export const PREFERENCES_SETTINGS_CLAIM_HEADING_ID = "preferences-settings-claim-discipline-heading" as const;

export const PREFERENCES_SETTINGS_CLAIM_DISCIPLINE =
  "This Preferences page saves personal appearance choices to your account — not a full audit export. Open Getting started, Sign-in methods, or Assurance status when you need onboarding or official materials.";

export const PREFERENCES_SETTINGS_SOURCES_INTRO =
  "Open these pages when you need onboarding, sign-in security, user administration, or assurance status.";


/** Operator Sources - no self-href to preferences. */
export const PREFERENCES_SETTINGS_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Getting started", href: inAppHelpHref("getting-started") },
  { label: "Sign-in methods", href: ACCOUNT_SECURITY_PATH },
  { label: "Users and roles", href: "/administration/users" },
  { label: "How ArchLucid works", href: inAppHelpHref("getting-started", "how-archlucid-works") },
  { label: "Assurance status", href: "/assurance-status" },
] as const;
