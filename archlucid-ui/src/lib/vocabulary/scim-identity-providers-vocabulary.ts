/**
 * TB-2294 — SCIM provisioning ≠ Identity providers vocabulary rail.
 *
 * Why two surfaces exist:
 * - SCIM provisioning (`/administration/scim-provisioning`) issues directory-sync
 *   tokens so an IdP can push users and groups into the workspace.
 * - Identity providers (`/administration/identity-providers`) configures SAML/OIDC
 *   federation for sign-in, role mapping, and diagnostics.
 *
 * They stay separate because creating a SCIM token does not configure federation,
 * and configuring SSO does not provision directory sync. Distinct from SCIM≠Users
 * (TB-2259) and IdP≠SSO wizard (TB-2277).
 */

import { SCIM_IDENTITY_PROVIDERS_HREF } from "@/lib/scim-provisioning-page-copy";
import { SCIM_PROVISIONING_CANONICAL_PATH } from "@/lib/scim-provisioning-evidence-copy";
import type { PairwiseVocabularyRailModel } from "@/lib/vocabulary/create-pairwise-vocabulary-rail";

export type ScimIdentityProvidersSurfaceId = "scim-provisioning" | "identity-providers";

export type ScimIdentityProvidersLink = {
  readonly id: ScimIdentityProvidersSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type ScimIdentityProvidersVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly scimLink: ScimIdentityProvidersLink;
  readonly identityProvidersLink: ScimIdentityProvidersLink;
};

export const SCIM_IDENTITY_PROVIDERS_HEADING =
  "SCIM provisioning and Identity providers serve different purposes" as const;

export const SCIM_IDENTITY_PROVIDERS_WHY_TWO =
  "SCIM provisioning issues directory-sync tokens so an identity provider can push users and groups. Identity providers configures SAML and OIDC federation for sign-in, role mapping, and diagnostics. Creating a SCIM token does not set up SSO — and configuring SSO does not provision directory sync." as const;

export const SCIM_IDENTITY_PROVIDERS_COMPACT_LINE =
  "SCIM is directory sync tokens; Identity providers is SAML/OIDC federation." as const;

export const SCIM_IDENTITY_PROVIDERS_SCIM_LINK: ScimIdentityProvidersLink = {
  id: "scim-provisioning",
  label: "SCIM provisioning",
  href: SCIM_PROVISIONING_CANONICAL_PATH,
  whenToUse: "Create and verify SCIM tokens for directory sync.",
};

export const SCIM_IDENTITY_PROVIDERS_IDP_LINK: ScimIdentityProvidersLink = {
  id: "identity-providers",
  label: "Identity providers",
  href: SCIM_IDENTITY_PROVIDERS_HREF,
  whenToUse: "Configure SAML/OIDC federation, role mapping, and sign-in diagnostics.",
};

/** Pairwise model for SCIM provisioning ↔ Identity providers (fixed routes). */
export function buildScimIdentityProvidersPairwiseRail(): PairwiseVocabularyRailModel<ScimIdentityProvidersSurfaceId> {
  return {
    heading: SCIM_IDENTITY_PROVIDERS_HEADING,
    whyTwo: SCIM_IDENTITY_PROVIDERS_WHY_TWO,
    compactLine: SCIM_IDENTITY_PROVIDERS_COMPACT_LINE,
    currentLink: SCIM_IDENTITY_PROVIDERS_SCIM_LINK,
    peerLink: SCIM_IDENTITY_PROVIDERS_IDP_LINK,
  };
}

/** Full vocabulary model (heading, why-two copy, and deep links). */
export function buildScimIdentityProvidersVocabulary(): ScimIdentityProvidersVocabularyModel {
  const rail = buildScimIdentityProvidersPairwiseRail();

  return {
    heading: rail.heading,
    whyTwo: rail.whyTwo,
    compactLine: rail.compactLine,
    scimLink: rail.currentLink,
    identityProvidersLink: rail.peerLink,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolveScimIdentityProvidersPeerLink(
  currentSurfaceId: ScimIdentityProvidersSurfaceId,
): ScimIdentityProvidersLink {
  if (currentSurfaceId === "scim-provisioning") {
    return SCIM_IDENTITY_PROVIDERS_IDP_LINK;
  }

  return SCIM_IDENTITY_PROVIDERS_SCIM_LINK;
}
