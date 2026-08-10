import { inAppHelpHref } from "@/lib/product-documentation-registry";

export type EnterpriseOnboardingHubStepLink = {
  readonly label: string;
  readonly href: string;
};

export type EnterpriseOnboardingHubStep = {
  readonly title: string;
  readonly owner: string;
  readonly primaryLink: EnterpriseOnboardingHubStepLink;
  readonly secondaryLinks?: readonly EnterpriseOnboardingHubStepLink[];
};

export const ENTERPRISE_ONBOARDING_HUB_STEP_COUNT = 8;

export const ENTERPRISE_ONBOARDING_HUB_STEPS: readonly EnterpriseOnboardingHubStep[] = [
  {
    title: "Configure SSO",
    owner: "Customer IT + tenant admin",
    primaryLink: { label: "Configure SSO", href: "#workforce-sso" },
  },
  {
    title: "Map roles and groups",
    owner: "Joint (customer IT + ArchLucid)",
    primaryLink: { label: "Map roles and groups", href: "#saml-claim-mapping-reference" },
    secondaryLinks: [{ label: "Users and roles", href: inAppHelpHref("users-and-roles") }],
  },
  {
    title: "Assign policy packs",
    owner: "Tenant admin",
    primaryLink: { label: "Assign policy packs", href: "#default-policy-packs" },
  },
  {
    title: "Enable governance workflow",
    owner: "Tenant admin",
    primaryLink: { label: "Enable governance workflow", href: "#governance-enablement" },
  },
  {
    title: "Configure audit export",
    owner: "Tenant admin",
    primaryLink: { label: "Configure audit export", href: "#audit-export" },
  },
  {
    title: "Connect Azure securely",
    owner: "Customer cloud admin",
    primaryLink: { label: "Connect Azure securely", href: inAppHelpHref("cloud-connections-azure") },
  },
  {
    title: "Validate first architecture review",
    owner: "Architect",
    primaryLink: { label: "Validate first architecture review", href: inAppHelpHref("pilot-guide") },
  },
  {
    title: "Prepare procurement/trust review",
    owner: "Procurement + security reviewer",
    primaryLink: { label: "Prepare procurement/trust review", href: inAppHelpHref("procurement") },
    secondaryLinks: [{ label: "Security and trust", href: inAppHelpHref("security-trust") }],
  },
] as const;

if (ENTERPRISE_ONBOARDING_HUB_STEPS.length !== ENTERPRISE_ONBOARDING_HUB_STEP_COUNT) {
  throw new Error(
    `ENTERPRISE_ONBOARDING_HUB_STEP_COUNT (${ENTERPRISE_ONBOARDING_HUB_STEP_COUNT}) must match ENTERPRISE_ONBOARDING_HUB_STEPS.length (${ENTERPRISE_ONBOARDING_HUB_STEPS.length}).`,
  );
}
