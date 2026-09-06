import { SETTINGS_ROOT_PATH, SETTINGS_SECURITY_TRUST_PATH } from "@/lib/settings-admin-route-paths";

export const OPERATOR_SECURITY_TRUST_PRIMARY_CONTENT_ID = "operator-security-trust-primary-content" as const;

export const OPERATOR_SECURITY_TRUST_FIRST_VIEWPORT_TEST_ID = "operator-security-trust-first-viewport" as const;

export const OPERATOR_SECURITY_TRUST_SKIP_TARGET_ID = OPERATOR_SECURITY_TRUST_FIRST_VIEWPORT_TEST_ID;

export const OPERATOR_SECURITY_TRUST_SKIP_LINK_LABEL = "Skip to security and trust materials" as const;

export const OPERATOR_SECURITY_TRUST_HEADER_CLAIM_DISCIPLINE_TEST_ID =
  "operator-security-trust-header-claim-discipline" as const;

/** Single hero description — folds LayerHeader + section helper intros (TB-1224). */
export const OPERATOR_SECURITY_TRUST_PAGE_HERO_DESCRIPTION =
  "Security materials for procurement, vendor review, and enterprise trust. Share procurement-ready policies, self-assessments, and trust-center links for this workspace.";

export const OPERATOR_SECURITY_TRUST_PAGE_SUBTITLE_BUYER =
  "Scan procurement-ready security materials and trust-center follow-ups for this workspace.";

export const OPERATOR_SECURITY_TRUST_PAGE_LEAD =
  "Procurement-facing security posture, trust-center links, and diligence materials for vendor review — not a signed audit export." as const;

export const OPERATOR_SECURITY_TRUST_START_HERE_CARD_TITLE = "Start here" as const;

export const OPERATOR_SECURITY_TRUST_BUYER_START_HERE_HELPER =
  "Review public materials and tenant isolation below. NDA requests and PDF downloads are hidden in buyer-polished shells — open the full admin workspace for diligence actions." as const;

export function operatorSecurityTrustPageSubtitle(buyerPolishedShell: boolean): string {
  return buyerPolishedShell
    ? OPERATOR_SECURITY_TRUST_PAGE_SUBTITLE_BUYER
    : OPERATOR_SECURITY_TRUST_PAGE_HERO_DESCRIPTION;
}

export const OPERATOR_SECURITY_TRUST_BREADCRUMB_ADMINISTRATION_LABEL = "Administration";

export const OPERATOR_SECURITY_TRUST_BREADCRUMB_ADMINISTRATION_HREF = SETTINGS_ROOT_PATH;

export const OPERATOR_SECURITY_TRUST_PAGE_NAV_HREF = SETTINGS_SECURITY_TRUST_PATH;

export const OPERATOR_SECURITY_TRUST_PRIMARY_TRUST_CENTER_LABEL = "Open Trust Center";

export const OPERATOR_SECURITY_TRUST_SECONDARY_MATERIALS_HEADING = "More materials";
