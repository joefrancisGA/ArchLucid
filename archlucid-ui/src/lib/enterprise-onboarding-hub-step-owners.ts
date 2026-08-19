/** Canonical owner vocabulary for the eight enterprise onboarding hub steps. */
export const ENTERPRISE_ONBOARDING_HUB_STEP_OWNERS = {
  customerItTenantAdmin: "Customer IT + tenant admin",
  joint: "Joint (customer IT + ArchLucid)",
  tenantAdmin: "Tenant admin",
  customerCloudAdmin: "Customer cloud admin",
  architect: "Architect",
  procurementSecurity: "Procurement + security reviewer",
} as const;

export type EnterpriseOnboardingHubStepOwner =
  (typeof ENTERPRISE_ONBOARDING_HUB_STEP_OWNERS)[keyof typeof ENTERPRISE_ONBOARDING_HUB_STEP_OWNERS];
