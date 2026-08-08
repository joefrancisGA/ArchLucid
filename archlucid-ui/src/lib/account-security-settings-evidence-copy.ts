import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { SETTINGS_ACCOUNT_SECURITY_PATH } from "@/lib/settings-admin-route-paths";

export const ACCOUNT_SECURITY_SETTINGS_CANONICAL_PATH = SETTINGS_ACCOUNT_SECURITY_PATH;

export const ACCOUNT_SECURITY_SETTINGS_CLAIM_DISCIPLINE =
  "This Account security page manages your personal sign-in methods - it is not a signed-review diligence Sources package. Open Security and trust help, Preferences, or Assurance status when you need trust cites, theme settings, or published diligence.";

export const ACCOUNT_SECURITY_SETTINGS_SOURCES_INTRO =
  "Use these follow-ups when sign-in method changes turn into SSO setup, preferences, or assurance cites.";

export type AccountSecuritySettingsSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources - no self-href to account-security. */
export const ACCOUNT_SECURITY_SETTINGS_SOURCES: readonly AccountSecuritySettingsSourceLink[] = [
  { label: "Security and trust help", href: inAppHelpHref("security-trust") },
  { label: "Preferences", href: "/administration/preferences" },
  { label: "SSO and identity", href: "/administration/identity-providers" },
  { label: "Users and roles", href: "/administration/users" },
  { label: "Assurance status", href: "/security-trust" },
] as const;
