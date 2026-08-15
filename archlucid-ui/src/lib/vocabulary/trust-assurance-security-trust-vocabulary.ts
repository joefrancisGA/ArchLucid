/**
 * TB-2302 — Trust Center ≠ Assurance status ≠ Security & Trust hub vocabulary triad.
 *
 * Why three surfaces exist:
 * - Trust Center (`/trust`) is the public procurement trust pack and downloads.
 * - Assurance status (`/assurance-status`) is the public assurance ladder / engagement
 *   status for diligence reviewers.
 * - Security & Trust (`/administration/security-trust`) is the operator workspace
 *   hub for procurement-ready materials inside the product.
 *
 * They stay separate because a public trust pack, a public assurance ladder, and
 * an in-product admin hub serve three different purposes that buyers often conflate.
 */

import {
  ASSURANCE_STATUS_PUBLIC_LABEL,
  ASSURANCE_STATUS_PUBLIC_PATH,
  TRUST_CENTER_PUBLIC_LABEL,
  TRUST_CENTER_PUBLIC_PATH,
} from "@/lib/marketing-assurance-public-labels";
import { SETTINGS_SECURITY_TRUST_PATH } from "@/lib/settings-admin-route-paths";

export type TrustAssuranceSecurityTrustSurfaceId =
  | "trust-center"
  | "assurance-status"
  | "security-trust-hub";

export type TrustAssuranceSecurityTrustLink = {
  readonly id: TrustAssuranceSecurityTrustSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type TrustAssuranceSecurityTrustVocabularyModel = {
  readonly heading: string;
  readonly whyThree: string;
  readonly compactLine: string;
  readonly trustCenterLink: TrustAssuranceSecurityTrustLink;
  readonly assuranceStatusLink: TrustAssuranceSecurityTrustLink;
  readonly securityTrustHubLink: TrustAssuranceSecurityTrustLink;
};

export const TRUST_ASSURANCE_SECURITY_TRUST_HEADING =
  "Trust Center, Assurance status, and Security & Trust serve different purposes" as const;

export const TRUST_ASSURANCE_SECURITY_TRUST_WHY_THREE =
  "Trust Center is the public procurement trust pack and downloads. Assurance status is the public assurance ladder for diligence reviewers. Security & Trust is the in-product operator hub for workspace procurement materials. Opening one does not replace the other two." as const;

export const TRUST_ASSURANCE_SECURITY_TRUST_COMPACT_LINE =
  "Trust Center is the public pack; Assurance status is the public ladder; Security & Trust is the in-product hub." as const;

export const TRUST_ASSURANCE_SECURITY_TRUST_CENTER_LINK: TrustAssuranceSecurityTrustLink = {
  id: "trust-center",
  label: TRUST_CENTER_PUBLIC_LABEL,
  href: TRUST_CENTER_PUBLIC_PATH,
  whenToUse: "Review the public trust pack, downloads, and procurement summaries.",
};

export const TRUST_ASSURANCE_SECURITY_TRUST_ASSURANCE_LINK: TrustAssuranceSecurityTrustLink = {
  id: "assurance-status",
  label: ASSURANCE_STATUS_PUBLIC_LABEL,
  href: ASSURANCE_STATUS_PUBLIC_PATH,
  whenToUse: "Review the public assurance ladder and diligence engagement status.",
};

export const TRUST_ASSURANCE_SECURITY_TRUST_HUB_LINK: TrustAssuranceSecurityTrustLink = {
  id: "security-trust-hub",
  label: "Security & Trust",
  href: SETTINGS_SECURITY_TRUST_PATH,
  whenToUse: "Open the in-product operator hub for workspace procurement materials.",
};

const ALL_LINKS: readonly TrustAssuranceSecurityTrustLink[] = [
  TRUST_ASSURANCE_SECURITY_TRUST_CENTER_LINK,
  TRUST_ASSURANCE_SECURITY_TRUST_ASSURANCE_LINK,
  TRUST_ASSURANCE_SECURITY_TRUST_HUB_LINK,
];

/** Full vocabulary model. */
export function buildTrustAssuranceSecurityTrustVocabulary(): TrustAssuranceSecurityTrustVocabularyModel {
  return {
    heading: TRUST_ASSURANCE_SECURITY_TRUST_HEADING,
    whyThree: TRUST_ASSURANCE_SECURITY_TRUST_WHY_THREE,
    compactLine: TRUST_ASSURANCE_SECURITY_TRUST_COMPACT_LINE,
    trustCenterLink: TRUST_ASSURANCE_SECURITY_TRUST_CENTER_LINK,
    assuranceStatusLink: TRUST_ASSURANCE_SECURITY_TRUST_ASSURANCE_LINK,
    securityTrustHubLink: TRUST_ASSURANCE_SECURITY_TRUST_HUB_LINK,
  };
}

/** Resolve the link for the current surface. */
export function resolveTrustAssuranceSecurityTrustLink(
  surfaceId: TrustAssuranceSecurityTrustSurfaceId,
): TrustAssuranceSecurityTrustLink | null {
  const match = ALL_LINKS.find((link) => link.id === surfaceId);

  if (match === undefined) {
    return null;
  }

  return match;
}

/** Peer links for the surfaces you are not on. */
export function resolveTrustAssuranceSecurityTrustPeerLinks(
  currentSurfaceId: TrustAssuranceSecurityTrustSurfaceId,
): readonly TrustAssuranceSecurityTrustLink[] {
  return ALL_LINKS.filter((link) => link.id !== currentSurfaceId);
}
