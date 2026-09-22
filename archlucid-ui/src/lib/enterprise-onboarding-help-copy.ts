import { GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";
import { GOVERNANCE_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH } from "@/lib/governance/governance-infrastructure-route-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { ProductLineId } from "@/lib/product-line/product-line-id";
import { isSecureNowProductLine } from "@/lib/product-line/securenow-cloud-platform-policy";

/** Customer-facing page title — registry, help center, and markdown H1 must stay aligned (TB-1341). */
export const ENTERPRISE_ONBOARDING_HELP_PAGE_TITLE = "Hosted SaaS enterprise onboarding checklist";

export const ENTERPRISE_ONBOARDING_HELP_PAGE_SUBTITLE =
  "Tenant Admin checklist for workforce sign-in, roles, cloud attachment, and the first architecture review before procurement trust reviews.";

export const ENTERPRISE_ONBOARDING_HELP_HERO_OVERVIEW =
  "Work through the eight steps below in order. Start with Configure SSO, then assign roles and validate the first architecture review before opening procurement trust materials.";

export const ENTERPRISE_ONBOARDING_HELP_PRIMARY_ACTION = {
  label: "Configure SSO",
  href: "/administration/identity/sso-wizard",
  testId: "help-enterprise-onboarding-configure-sso",
} as const;

export const ENTERPRISE_ONBOARDING_HELP_PRIMARY_ACTIONS = {
  configureSso: ENTERPRISE_ONBOARDING_HELP_PRIMARY_ACTION,
  openCorePilot: {
    label: "Your first architecture review",
    href: inAppHelpHref("core-pilot"),
    testId: "help-enterprise-onboarding-core-pilot",
  },
  openOnboardingHub: {
    label: "View full checklist",
    href: "#onboarding-hub",
    testId: "help-enterprise-onboarding-hub-anchor",
  },
} as const;

export const SECURENOW_ENTERPRISE_ONBOARDING_HELP_PAGE_SUBTITLE =
  "Tenant Admin checklist for workforce sign-in, roles, optional Azure connector evidence, and audit export before procurement trust reviews.";

export const SECURENOW_ENTERPRISE_ONBOARDING_HELP_HERO_OVERVIEW =
  "Work through the steps below in order. Start with Configure SSO, assign roles, then validate Azure or inventory ZIP intake and a findings spot-check before opening procurement trust materials.";

export const SECURENOW_ENTERPRISE_ONBOARDING_HELP_PRIMARY_ACTIONS = {
  configureSso: ENTERPRISE_ONBOARDING_HELP_PRIMARY_ACTION,
  openExtractUpload: {
    label: "Extract and upload inventory",
    href: GOVERNANCE_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH,
    testId: "help-enterprise-onboarding-extract-upload",
  },
  openPolicyPacks: {
    label: "Assign policy packs",
    href: GOVERNANCE_POLICY_PACKS_PATH,
    testId: "help-enterprise-onboarding-policy-packs",
  },
  openOnboardingHub: ENTERPRISE_ONBOARDING_HELP_PRIMARY_ACTIONS.openOnboardingHub,
} as const;

export function enterpriseOnboardingHelpPageSubtitle(productLineId: ProductLineId = "architecture"): string {
  return isSecureNowProductLine(productLineId)
    ? SECURENOW_ENTERPRISE_ONBOARDING_HELP_PAGE_SUBTITLE
    : ENTERPRISE_ONBOARDING_HELP_PAGE_SUBTITLE;
}

export function enterpriseOnboardingHelpHeroOverview(productLineId: ProductLineId = "architecture"): string {
  return isSecureNowProductLine(productLineId)
    ? SECURENOW_ENTERPRISE_ONBOARDING_HELP_HERO_OVERVIEW
    : ENTERPRISE_ONBOARDING_HELP_HERO_OVERVIEW;
}

export function enterpriseOnboardingHelpPrimaryActions(productLineId: ProductLineId = "architecture") {
  return isSecureNowProductLine(productLineId)
    ? SECURENOW_ENTERPRISE_ONBOARDING_HELP_PRIMARY_ACTIONS
    : ENTERPRISE_ONBOARDING_HELP_PRIMARY_ACTIONS;
}
