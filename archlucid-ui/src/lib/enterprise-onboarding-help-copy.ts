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
  openIdentityProviders: {
    label: "Identity providers",
    href: "/administration/identity-providers",
  },
  openUsersAndRoles: {
    label: "Users and roles",
    href: "/help/users-and-roles",
  },
  openCloudConnections: {
    label: "Cloud connections",
    href: "/integrations/cloud-connections",
  },
} as const;
