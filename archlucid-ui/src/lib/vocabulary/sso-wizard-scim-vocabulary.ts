/**
 * TB-2326 — SSO wizard ≠ SCIM provisioning vocabulary rail.
 *
 * Why two surfaces exist:
 * - SSO wizard (`/administration/identity/sso-wizard`) is guided setup that
 *   records and verifies SSO configuration for the workspace.
 * - SCIM provisioning (`/administration/scim-provisioning`) issues directory-sync
 *   tokens so an identity provider can push users and groups.
 *
 * They stay separate because configuring SSO sign-in is not SCIM directory sync.
 * Distinct from Identity providers ≠ SSO wizard (TB-2277) and SCIM ≠ Identity
 * providers (TB-2294).
 */

import { SCIM_PROVISIONING_CANONICAL_PATH } from "@/lib/scim-provisioning-evidence-copy";
import { SSO_WIZARD_CANONICAL_PATH } from "@/lib/sso-wizard-evidence-copy";

export type SsoWizardScimSurfaceId = "sso-wizard" | "scim";

export type SsoWizardScimLink = {
  readonly id: SsoWizardScimSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type SsoWizardScimVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly ssoWizardLink: SsoWizardScimLink;
  readonly scimLink: SsoWizardScimLink;
};

export const SSO_WIZARD_SCIM_HEADING =
  "SSO wizard and SCIM provisioning serve different purposes" as const;

export const SSO_WIZARD_SCIM_WHY_TWO =
  "The SSO wizard is guided setup that records and verifies single sign-on configuration for the workspace. SCIM provisioning issues directory-sync tokens so an identity provider can push users and groups. Configuring SSO sign-in is not SCIM directory sync — and issuing a SCIM token does not save SSO configuration." as const;

export const SSO_WIZARD_SCIM_COMPACT_LINE =
  "SSO wizard records and verifies the sign-in connection; SCIM syncs directory people — open the other when you need both." as const;

export const SSO_WIZARD_SCIM_SSO_WIZARD_LINK: SsoWizardScimLink = {
  id: "sso-wizard",
  label: "SSO wizard",
  href: SSO_WIZARD_CANONICAL_PATH,
  whenToUse: "Walk guided discovery, sandbox claim mapping test, and save configuration.",
};

export const SSO_WIZARD_SCIM_SCIM_LINK: SsoWizardScimLink = {
  id: "scim",
  label: "SCIM provisioning",
  href: SCIM_PROVISIONING_CANONICAL_PATH,
  whenToUse: "Create and verify SCIM tokens for directory sync.",
};

/** Full vocabulary model (heading, why-two copy, and deep links). */
export function buildSsoWizardScimVocabulary(): SsoWizardScimVocabularyModel {
  return {
    heading: SSO_WIZARD_SCIM_HEADING,
    whyTwo: SSO_WIZARD_SCIM_WHY_TWO,
    compactLine: SSO_WIZARD_SCIM_COMPACT_LINE,
    ssoWizardLink: SSO_WIZARD_SCIM_SSO_WIZARD_LINK,
    scimLink: SSO_WIZARD_SCIM_SCIM_LINK,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolveSsoWizardScimPeerLink(
  currentSurfaceId: SsoWizardScimSurfaceId,
): SsoWizardScimLink {
  if (currentSurfaceId === "sso-wizard") {
    return SSO_WIZARD_SCIM_SCIM_LINK;
  }

  return SSO_WIZARD_SCIM_SSO_WIZARD_LINK;
}
