import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { ACCOUNT_PREFERENCES_PATH, ACCOUNT_SECURITY_PATH } from "@/lib/account-route-paths";
<<<<<<< HEAD
import type { EvidenceAdminSourceLink } from "@/lib/evidence-surface-copy";
=======
import { SETTINGS_NOTIFICATIONS_PATH } from "@/lib/settings-admin-route-paths";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
>>>>>>> 67a1262d7a (al-ui-rate ADR wave 2: wire Preferences save feedback, cloud guardrails, and IA trim.)

export const PREFERENCES_SETTINGS_CANONICAL_PATH = ACCOUNT_PREFERENCES_PATH;

export const PREFERENCES_HELP_TOPIC_LABEL = "How preferences work";

export const PREFERENCES_SETTINGS_FOLLOW_UPS_TITLE = "Where to go next";

export const PREFERENCES_SETTINGS_SOURCES_INTRO =
  "Open these pages for sign-in security, notification channels, or help when personal preferences are not enough.";

/** Operator Sources - no self-href to preferences. */
<<<<<<< HEAD
export const PREFERENCES_SETTINGS_SOURCES: readonly EvidenceAdminSourceLink[] = [
  { label: "Getting started", href: inAppHelpHref("getting-started") },
=======
export const PREFERENCES_SETTINGS_SOURCES: readonly EvidenceSourceLink[] = [
>>>>>>> 67a1262d7a (al-ui-rate ADR wave 2: wire Preferences save feedback, cloud guardrails, and IA trim.)
  { label: "Sign-in methods", href: ACCOUNT_SECURITY_PATH },
  { label: "Notifications", href: SETTINGS_NOTIFICATIONS_PATH },
  { label: "How preferences work", href: inAppHelpHref("preferences") },
] as const;
