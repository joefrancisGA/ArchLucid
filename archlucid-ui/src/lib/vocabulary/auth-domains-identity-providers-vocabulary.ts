/**
 * TB-2299 — Sign-in domains ≠ Identity providers vocabulary rail.
 *
 * Why two surfaces exist:
 * - Sign-in domains (`/administration/auth-domains`) verifies tenant email-domain
 *   ownership and SSO enforcement readiness.
 * - Identity providers (`/administration/identity-providers`) configures SAML/OIDC
 *   federation for sign-in, role mapping, and diagnostics.
 *
 * They stay separate because verifying who may sign in by email domain is not the
 * same job as configuring the federation protocol. Distinct from Account security
 * ≠ Sign-in domains (TB-2293), IdP ≠ SSO wizard (TB-2277), and SCIM ≠ IdP (TB-2294).
 */

import { AUTH_DOMAINS_SETTINGS_CANONICAL_PATH } from "@/lib/auth-domains-settings-evidence-copy";
import { SCIM_IDENTITY_PROVIDERS_HREF } from "@/lib/scim-provisioning-page-copy";

export type AuthDomainsIdentityProvidersSurfaceId = "auth-domains" | "identity-providers";

export type AuthDomainsIdentityProvidersLink = {
  readonly id: AuthDomainsIdentityProvidersSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type AuthDomainsIdentityProvidersVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly authDomainsLink: AuthDomainsIdentityProvidersLink;
  readonly identityProvidersLink: AuthDomainsIdentityProvidersLink;
};

export const AUTH_DOMAINS_IDENTITY_PROVIDERS_HEADING =
  "Sign-in domains and Identity providers serve different purposes" as const;

export const AUTH_DOMAINS_IDENTITY_PROVIDERS_WHY_TWO =
  "Sign-in domains verifies tenant email-domain ownership and SSO enforcement. Identity providers configures SAML and OIDC federation for sign-in, role mapping, and diagnostics. Enabling domain enforcement does not configure the federation protocol." as const;

export const AUTH_DOMAINS_IDENTITY_PROVIDERS_COMPACT_LINE =
  "Sign-in domains is email-domain allowlist and enforcement; Identity providers is SAML/OIDC federation — open the other when you need that capability." as const;

export const AUTH_DOMAINS_IDENTITY_PROVIDERS_DOMAINS_LINK: AuthDomainsIdentityProvidersLink = {
  id: "auth-domains",
  label: "Sign-in domains",
  href: AUTH_DOMAINS_SETTINGS_CANONICAL_PATH,
  whenToUse: "Verify email domain ownership and enable SSO enforcement.",
};

export const AUTH_DOMAINS_IDENTITY_PROVIDERS_IDP_LINK: AuthDomainsIdentityProvidersLink = {
  id: "identity-providers",
  label: "Identity providers",
  href: SCIM_IDENTITY_PROVIDERS_HREF,
  whenToUse: "Configure SAML/OIDC federation, role mapping, and sign-in diagnostics.",
};

/** Full vocabulary model (heading, why-two copy, and deep links). */
export function buildAuthDomainsIdentityProvidersVocabulary(): AuthDomainsIdentityProvidersVocabularyModel {
  return {
    heading: AUTH_DOMAINS_IDENTITY_PROVIDERS_HEADING,
    whyTwo: AUTH_DOMAINS_IDENTITY_PROVIDERS_WHY_TWO,
    compactLine: AUTH_DOMAINS_IDENTITY_PROVIDERS_COMPACT_LINE,
    authDomainsLink: AUTH_DOMAINS_IDENTITY_PROVIDERS_DOMAINS_LINK,
    identityProvidersLink: AUTH_DOMAINS_IDENTITY_PROVIDERS_IDP_LINK,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolveAuthDomainsIdentityProvidersPeerLink(
  currentSurfaceId: AuthDomainsIdentityProvidersSurfaceId,
): AuthDomainsIdentityProvidersLink {
  if (currentSurfaceId === "auth-domains") {
    return AUTH_DOMAINS_IDENTITY_PROVIDERS_IDP_LINK;
  }

  return AUTH_DOMAINS_IDENTITY_PROVIDERS_DOMAINS_LINK;
}
