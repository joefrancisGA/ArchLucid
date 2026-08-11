/**
 * TB-2277 — Identity providers hub ≠ SSO wizard vocabulary rail.
 *
 * Why two surfaces exist:
 * - Identity providers (`/administration/identity-providers`) is the *hub* for
 *   sign-in overview, SAML/OIDC configuration areas, role mapping, and diagnostics.
 * - SSO wizard (`/administration/identity/sso-wizard`) is the *guided setup*
 *   that discovers, tests, and activates a single SSO connection.
 *
 * They stay separate because browsing provider health and config areas is not
 * the same job as walking the activate-ready wizard.
 */

import { SSO_WIZARD_IDENTITY_PROVIDERS_HREF } from "@/lib/sso-wizard-copy";
import { SSO_WIZARD_CANONICAL_PATH } from "@/lib/sso-wizard-evidence-copy";

export type IdentityProvidersSsoWizardSurfaceId = "identity-providers" | "sso-wizard";

export type IdentityProvidersSsoWizardLink = {
  readonly id: IdentityProvidersSsoWizardSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type IdentityProvidersSsoWizardVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly identityProvidersLink: IdentityProvidersSsoWizardLink;
  readonly ssoWizardLink: IdentityProvidersSsoWizardLink;
};

export const IDENTITY_PROVIDERS_SSO_WIZARD_HEADING =
  "Identity providers and the SSO wizard do different jobs" as const;

export const IDENTITY_PROVIDERS_SSO_WIZARD_WHY_TWO =
  "Identity providers is the hub for sign-in overview, SAML and OIDC configuration areas, role mapping, and diagnostics. The SSO wizard is guided setup that discovers, tests, and activates a single SSO connection. Browsing provider health is not the same as walking the activate-ready wizard." as const;

export const IDENTITY_PROVIDERS_SSO_WIZARD_COMPACT_LINE =
  "Identity providers is the hub; SSO wizard is guided activate setup — open the other when you need both." as const;

export const IDENTITY_PROVIDERS_SSO_WIZARD_HUB_LINK: IdentityProvidersSsoWizardLink = {
  id: "identity-providers",
  label: "Identity providers",
  href: SSO_WIZARD_IDENTITY_PROVIDERS_HREF,
  whenToUse: "Review sign-in overview, provider areas, role mapping, and diagnostics.",
};

export const IDENTITY_PROVIDERS_SSO_WIZARD_WIZARD_LINK: IdentityProvidersSsoWizardLink = {
  id: "sso-wizard",
  label: "SSO wizard",
  href: SSO_WIZARD_CANONICAL_PATH,
  whenToUse: "Walk guided discovery, test login, and activate SSO.",
};

/** Full vocabulary model (heading, why-two copy, and deep links). */
export function buildIdentityProvidersSsoWizardVocabulary(): IdentityProvidersSsoWizardVocabularyModel {
  return {
    heading: IDENTITY_PROVIDERS_SSO_WIZARD_HEADING,
    whyTwo: IDENTITY_PROVIDERS_SSO_WIZARD_WHY_TWO,
    compactLine: IDENTITY_PROVIDERS_SSO_WIZARD_COMPACT_LINE,
    identityProvidersLink: IDENTITY_PROVIDERS_SSO_WIZARD_HUB_LINK,
    ssoWizardLink: IDENTITY_PROVIDERS_SSO_WIZARD_WIZARD_LINK,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolveIdentityProvidersSsoWizardPeerLink(
  currentSurfaceId: IdentityProvidersSsoWizardSurfaceId,
): IdentityProvidersSsoWizardLink {
  if (currentSurfaceId === "identity-providers") {
    return IDENTITY_PROVIDERS_SSO_WIZARD_WIZARD_LINK;
  }

  return IDENTITY_PROVIDERS_SSO_WIZARD_HUB_LINK;
}
