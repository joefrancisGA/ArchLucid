import { ACCOUNT_SECURITY_PAGE_TITLE } from "@/lib/account-security-page-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { SETTINGS_ACCOUNT_SECURITY_PATH } from "@/lib/settings-admin-route-paths";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const ACCOUNT_SECURITY_SETTINGS_CANONICAL_PATH = SETTINGS_ACCOUNT_SECURITY_PATH;

export const ACCOUNT_SECURITY_SETTINGS_HELP_TOPIC_LABEL = "How sign-in methods work" as const;

export const ACCOUNT_SECURITY_SETTINGS_CLAIM_DISCIPLINE =
  `This ${ACCOUNT_SECURITY_PAGE_TITLE} page manages your personal sign-in methods - it is not a sealed-review diligence Sources package. Open Security and trust help, Preferences, or Assurance status when you need trust cites, theme settings, or published diligence.`;

export const ACCOUNT_SECURITY_SETTINGS_SOURCES_INTRO =
  "Use these follow-ups when sign-in method changes turn into workspace identity setup, preferences, or assurance cites.";


/** Operator Sources - no self-href to account-security. */
export const ACCOUNT_SECURITY_SETTINGS_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Security and trust help", href: inAppHelpHref("security-trust") },
  { label: "Preferences", href: "/administration/preferences" },
  { label: "SSO and identity", href: "/administration/identity-providers" },
  { label: "Users and roles", href: "/administration/users" },
  { label: "Assurance status", href: "/security-trust" },
] as const;
