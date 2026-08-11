import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { SETTINGS_PREFERENCES_PATH } from "@/lib/settings-admin-route-paths";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const PREFERENCES_SETTINGS_CANONICAL_PATH = SETTINGS_PREFERENCES_PATH;

export const PREFERENCES_SETTINGS_CLAIM_DISCIPLINE =
  "This Preferences page saves personal appearance choices to your account - it is not a signed-review diligence Sources package. Open Getting started, Sign-in methods, or Assurance status when you need onboarding, sign-in controls, or trust cites.";

export const PREFERENCES_SETTINGS_SOURCES_INTRO =
  "Use these follow-ups when personal theme settings turn into onboarding, account security, or assurance cites.";


/** Operator Sources - no self-href to preferences. */
export const PREFERENCES_SETTINGS_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Getting started", href: inAppHelpHref("getting-started") },
  { label: "Sign-in methods", href: "/administration/account-security" },
  { label: "Users and roles", href: "/administration/users" },
  { label: "How ArchLucid works", href: inAppHelpHref("getting-started", "how-archlucid-works") },
  { label: "Assurance status", href: "/security-trust" },
] as const;
