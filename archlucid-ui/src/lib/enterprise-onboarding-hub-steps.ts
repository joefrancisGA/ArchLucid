import { ENTERPRISE_ONBOARDING_HUB_STEP_OWNERS } from "@/lib/enterprise-onboarding-hub-step-owners";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export type EnterpriseOnboardingHubStepLink = {
  readonly label: string;
  readonly href: string;
};

export type EnterpriseOnboardingHubStep = {
  readonly title: string;
  readonly owner: (typeof ENTERPRISE_ONBOARDING_HUB_STEP_OWNERS)[keyof typeof ENTERPRISE_ONBOARDING_HUB_STEP_OWNERS];
  readonly primaryLink: EnterpriseOnboardingHubStepLink;
  readonly secondaryLinks?: readonly EnterpriseOnboardingHubStepLink[];
};

export const ENTERPRISE_ONBOARDING_HUB_STEP_COUNT = 8;

export function isEnterpriseOnboardingInPageAnchorHref(href: string): boolean {
  return href.startsWith("#");
}

export const ENTERPRISE_ONBOARDING_HUB_STEPS: readonly EnterpriseOnboardingHubStep[] = [
  {
    title: "Configure SSO",
    owner: ENTERPRISE_ONBOARDING_HUB_STEP_OWNERS.customerItTenantAdmin,
    primaryLink: { label: "Configure SSO", href: "#workforce-sso" },
  },
  {
    title: "Map roles and groups",
    owner: ENTERPRISE_ONBOARDING_HUB_STEP_OWNERS.joint,
    primaryLink: { label: "Map roles and groups", href: "#saml-claim-mapping-reference" },
    secondaryLinks: [{ label: "Users and roles", href: inAppHelpHref("users-and-roles") }],
  },
  {
    title: "Assign policy packs",
    owner: ENTERPRISE_ONBOARDING_HUB_STEP_OWNERS.tenantAdmin,
    primaryLink: { label: "Assign policy packs", href: "#default-policy-packs" },
  },
  {
    title: "Enable approval workflow",
    owner: ENTERPRISE_ONBOARDING_HUB_STEP_OWNERS.tenantAdmin,
    primaryLink: { label: "Enable approval workflow", href: "#governance-enablement" },
  },
  {
    title: "Configure audit export",
    owner: ENTERPRISE_ONBOARDING_HUB_STEP_OWNERS.tenantAdmin,
    primaryLink: { label: "Configure audit export", href: "#audit-export" },
  },
  {
    title: "Connect Azure securely",
    owner: ENTERPRISE_ONBOARDING_HUB_STEP_OWNERS.customerCloudAdmin,
    primaryLink: { label: "Connect Azure securely", href: inAppHelpHref("cloud-connections-azure") },
  },
  {
    title: "Validate first architecture review",
    owner: ENTERPRISE_ONBOARDING_HUB_STEP_OWNERS.architect,
    primaryLink: {
      label: "Your first architecture review",
      href: inAppHelpHref("first-architecture-review"),
    },
  },
  {
    title: "Prepare procurement/trust review",
    owner: ENTERPRISE_ONBOARDING_HUB_STEP_OWNERS.procurementSecurity,
    primaryLink: { label: "Prepare procurement/trust review", href: inAppHelpHref("procurement") },
    secondaryLinks: [{ label: "Security and trust", href: inAppHelpHref("security-trust") }],
  },
] as const;

if (ENTERPRISE_ONBOARDING_HUB_STEPS.length !== ENTERPRISE_ONBOARDING_HUB_STEP_COUNT) {
  throw new Error(
    `ENTERPRISE_ONBOARDING_HUB_STEP_COUNT (${ENTERPRISE_ONBOARDING_HUB_STEP_COUNT}) must match ENTERPRISE_ONBOARDING_HUB_STEPS.length (${ENTERPRISE_ONBOARDING_HUB_STEPS.length}).`,
  );
}
