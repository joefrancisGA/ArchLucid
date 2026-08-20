import { ACCOUNT_SECURITY_PAGE_TITLE } from "@/lib/account-security-page-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { ACCOUNT_PREFERENCES_PATH, ACCOUNT_SECURITY_PATH } from "@/lib/account-route-paths";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const ACCOUNT_SECURITY_SETTINGS_CANONICAL_PATH = ACCOUNT_SECURITY_PATH;

export const ACCOUNT_SECURITY_SETTINGS_HELP_TOPIC_LABEL = "How sign-in methods work" as const;

export const ACCOUNT_SECURITY_SETTINGS_CLAIM_DISCIPLINE_HEADING = "What this page does not cover";

export const ACCOUNT_SECURITY_SETTINGS_FOLLOW_UPS_TITLE = "Where to go next";

export const ACCOUNT_SECURITY_SETTINGS_CLAIM_HEADING_ID =
  "account-security-settings-claim-discipline-heading" as const;

export const ACCOUNT_SECURITY_SETTINGS_CLAIM_DISCIPLINE =
  `This ${ACCOUNT_SECURITY_PAGE_TITLE} page manages your personal sign-in methods — not a full audit export. Open Security and trust help, Preferences, or Assurance status for official materials or theme settings.`;

export const ACCOUNT_SECURITY_SETTINGS_SOURCES_INTRO =
  "Use these follow-ups when sign-in method changes turn into workspace identity setup, preferences, or official assurance materials.";


/** Operator Sources - no self-href to account-security. */
export const ACCOUNT_SECURITY_SETTINGS_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Security and trust help", href: inAppHelpHref("security-trust") },
  { label: "Preferences", href: ACCOUNT_PREFERENCES_PATH },
  { label: "SSO and identity", href: "/administration/identity-providers" },
  { label: "Users and roles", href: "/administration/users" },
  { label: "Assurance status", href: "/assurance-status" },
] as const;
