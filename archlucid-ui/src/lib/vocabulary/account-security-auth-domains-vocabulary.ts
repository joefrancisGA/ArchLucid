/**
 * TB-2293 — Sign-in methods ≠ Auth domains vocabulary rail.
 *
 * Why two surfaces exist:
 * - Sign-in methods (`/administration/account-security`) manages linked identities for
 *   you (email link, passkeys, linked identities).
 * - Auth domains (`/administration/auth-domains`) verifies tenant email-domain
 *   ownership and single sign-on enforcement readiness.
 *
 * They stay separate because personal sign-in methods are not the same job as
 * tenant-wide email-domain allowlists and single sign-on enforcement.
 */

import { AUTH_DOMAINS_SETTINGS_CANONICAL_PATH } from "@/lib/auth-domains-settings-evidence-copy";
import { SETTINGS_ACCOUNT_SECURITY_PATH } from "@/lib/settings-admin-route-paths";

export type AccountSecurityAuthDomainsSurfaceId = "account-security" | "auth-domains";

export type AccountSecurityAuthDomainsLink = {
  readonly id: AccountSecurityAuthDomainsSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type AccountSecurityAuthDomainsVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly accountSecurityLink: AccountSecurityAuthDomainsLink;
  readonly authDomainsLink: AccountSecurityAuthDomainsLink;
};

export const ACCOUNT_SECURITY_AUTH_DOMAINS_HEADING =
  "Sign-in methods and Sign-in domains do different jobs" as const;

export const ACCOUNT_SECURITY_AUTH_DOMAINS_WHY_TWO =
  "Sign-in methods manages your linked identities and email one-time-code recovery. Sign-in domains verifies tenant email-domain ownership and single sign-on enforcement. Personal sign-in setup does not configure organization-wide domain allowlists." as const;

export const ACCOUNT_SECURITY_AUTH_DOMAINS_COMPACT_LINE =
  "Sign-in methods is your personal sign-in setup; Sign-in domains is tenant domain allowlist — open the other when you need that job." as const;

export const ACCOUNT_SECURITY_AUTH_DOMAINS_SECURITY_LINK: AccountSecurityAuthDomainsLink = {
  id: "account-security",
  label: "Sign-in methods",
  href: SETTINGS_ACCOUNT_SECURITY_PATH,
  whenToUse: "Manage sign-in methods and linked identities for your account.",
};

export const ACCOUNT_SECURITY_AUTH_DOMAINS_DOMAINS_LINK: AccountSecurityAuthDomainsLink = {
  id: "auth-domains",
  label: "Sign-in domains",
  href: AUTH_DOMAINS_SETTINGS_CANONICAL_PATH,
  whenToUse: "Verify email domain ownership and enable single sign-on enforcement.",
};

/** Full vocabulary model (heading, why-two copy, and deep links). */
export function buildAccountSecurityAuthDomainsVocabulary(): AccountSecurityAuthDomainsVocabularyModel {
  return {
    heading: ACCOUNT_SECURITY_AUTH_DOMAINS_HEADING,
    whyTwo: ACCOUNT_SECURITY_AUTH_DOMAINS_WHY_TWO,
    compactLine: ACCOUNT_SECURITY_AUTH_DOMAINS_COMPACT_LINE,
    accountSecurityLink: ACCOUNT_SECURITY_AUTH_DOMAINS_SECURITY_LINK,
    authDomainsLink: ACCOUNT_SECURITY_AUTH_DOMAINS_DOMAINS_LINK,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolveAccountSecurityAuthDomainsPeerLink(
  currentSurfaceId: AccountSecurityAuthDomainsSurfaceId,
): AccountSecurityAuthDomainsLink {
  if (currentSurfaceId === "account-security") {
    return ACCOUNT_SECURITY_AUTH_DOMAINS_DOMAINS_LINK;
  }

  return ACCOUNT_SECURITY_AUTH_DOMAINS_SECURITY_LINK;
}
