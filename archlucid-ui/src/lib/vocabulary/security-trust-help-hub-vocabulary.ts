/**
 * TB-2315 — Security & trust help ≠ Security & trust hub vocabulary rail.
 *
 * Why two surfaces exist:
 * - Security & trust help (`/help/security-trust`) orients architects and buyers
 *   on the assurance ladder, data handling, and diligence materials.
 * - Security & trust hub (`/administration/security-trust`) is the in-product
 *   operator hub for workspace procurement-ready materials.
 *
 * They stay separate because reading a help topic is not the same job as using
 * the admin hub. Distinct from Trust Center ≠ Assurance status ≠ Security &
 * trust hub triad (TB-2302), which reconciles public Trust Center / Assurance
 * with the admin hub — this rail is help topic vs admin hub only.
 */

import { SECURITY_TRUST_HELP_CANONICAL_PATH } from "@/lib/security-trust-help-evidence-copy";
import { SETTINGS_SECURITY_TRUST_PATH } from "@/lib/settings-admin-route-paths";

export type SecurityTrustHelpHubSurfaceId = "security-trust-help" | "security-trust-hub";

export type SecurityTrustHelpHubLink = {
  readonly id: SecurityTrustHelpHubSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type SecurityTrustHelpHubVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly securityTrustHelpLink: SecurityTrustHelpHubLink;
  readonly securityTrustHubLink: SecurityTrustHelpHubLink;
};

export const SECURITY_TRUST_HELP_HUB_HEADING =
  "Security & trust help and Security & trust hub do different jobs" as const;

export const SECURITY_TRUST_HELP_HUB_WHY_TWO =
  "Security & trust help orients architects and buyers on the assurance ladder, data handling, and diligence materials. Security & trust hub is the in-product operator hub for workspace procurement-ready materials. Reading the help topic is not the same as using the admin hub." as const;

export const SECURITY_TRUST_HELP_HUB_COMPACT_LINE =
  "Security & trust help is orientation; Security & trust hub is the admin procurement hub — open the other when you need that job." as const;

export const SECURITY_TRUST_HELP_HUB_HELP_LINK: SecurityTrustHelpHubLink = {
  id: "security-trust-help",
  label: "Security & trust help",
  href: SECURITY_TRUST_HELP_CANONICAL_PATH,
  whenToUse: "Read assurance and diligence orientation for architects and buyers.",
};

export const SECURITY_TRUST_HELP_HUB_HUB_LINK: SecurityTrustHelpHubLink = {
  id: "security-trust-hub",
  label: "Security & trust",
  href: SETTINGS_SECURITY_TRUST_PATH,
  whenToUse: "Open the in-product operator hub for workspace procurement materials.",
};

/** Full vocabulary model (heading, why-two copy, and deep links). */
export function buildSecurityTrustHelpHubVocabulary(): SecurityTrustHelpHubVocabularyModel {
  return {
    heading: SECURITY_TRUST_HELP_HUB_HEADING,
    whyTwo: SECURITY_TRUST_HELP_HUB_WHY_TWO,
    compactLine: SECURITY_TRUST_HELP_HUB_COMPACT_LINE,
    securityTrustHelpLink: SECURITY_TRUST_HELP_HUB_HELP_LINK,
    securityTrustHubLink: SECURITY_TRUST_HELP_HUB_HUB_LINK,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolveSecurityTrustHelpHubPeerLink(
  currentSurfaceId: SecurityTrustHelpHubSurfaceId,
): SecurityTrustHelpHubLink {
  if (currentSurfaceId === "security-trust-help") {
    return SECURITY_TRUST_HELP_HUB_HUB_LINK;
  }

  return SECURITY_TRUST_HELP_HUB_HELP_LINK;
}
