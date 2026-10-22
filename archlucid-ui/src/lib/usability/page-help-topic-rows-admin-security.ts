/** Security, identity, users, and assurance contextual help rows (administration routes). */

import { ACCOUNT_SECURITY_SETTINGS_HELP_TOPIC_LABEL } from "@/lib/account-security-settings-evidence-copy";
import { API_KEYS_HELP_TOPIC_LABEL } from "@/lib/api-keys-settings-evidence-copy";
import { AUTH_DOMAINS_SETTINGS_HELP_TOPIC_LABEL } from "@/lib/auth-domains-settings-evidence-copy";
import { BILLING_AND_PLANS_HELP_TOPIC_LABEL } from "@/lib/billing-and-plans-help-evidence-copy";
import { DATA_HANDLING_TENANT_ISOLATION_HELP_TOPIC_LABEL } from "@/lib/data-handling-tenant-isolation-help-evidence-copy";
import { DPA_TEMPLATE_HELP_TOPIC_LABEL } from "@/lib/dpa-template-help-guide-content";
import { ENTERPRISE_ONBOARDING_HELP_TOPIC_LABEL } from "@/lib/enterprise-onboarding-help-evidence-copy";
import { IDENTITY_PROVIDERS_DIAGNOSTICS_HELP_TOPIC_LABEL } from "@/lib/identity-providers-diagnostics-evidence-copy";
import { IDENTITY_PROVIDERS_OIDC_HELP_TOPIC_LABEL } from "@/lib/identity-providers-oidc-evidence-copy";
import { IDENTITY_PROVIDERS_SAML_HELP_TOPIC_LABEL } from "@/lib/identity-providers-saml-evidence-copy";
import { IDENTITY_PROVIDERS_SETTINGS_HELP_TOPIC_LABEL } from "@/lib/identity-providers-settings-evidence-copy";
import { INVITE_REVIEWER_HELP_TOPIC_LABEL } from "@/lib/invite-reviewer-evidence-copy";
import { PREFERENCES_HELP_TOPIC_LABEL } from "@/lib/preferences-settings-evidence-copy";
import { PROCUREMENT_HELP_TOPIC_LABEL } from "@/lib/procurement-help-evidence-copy";
import { ROLE_MAPPING_SETTINGS_HELP_TOPIC_LABEL } from "@/lib/role-mapping-settings-evidence-copy";
import { SCOPE_HELP_TOPIC_LABEL } from "@/lib/scope-help-evidence-copy";
import { SCIM_PROVISIONING_HELP_TOPIC_LABEL } from "@/lib/scim-provisioning-evidence-copy";
import { SECURITY_TRUST_HELP_TOPIC_LABEL } from "@/lib/security-trust-help-evidence-copy";
import { SETTINGS_SECURITY_TRUST_HELP_TOPIC_LABEL } from "@/lib/settings-security-trust-evidence-copy";
import { SETTINGS_USERS_HELP_TOPIC_LABEL } from "@/lib/settings-users-evidence-copy";
import { SOC2_SELF_ASSESSMENT_HELP_TOPIC_LABEL } from "@/lib/soc2-self-assessment-help-guide-content";
import { SSO_WIZARD_HELP_TOPIC_LABEL } from "@/lib/sso-wizard-evidence-copy";
import { WORKSPACE_SETTINGS_HELP_TOPIC_LABEL } from "@/lib/tenant-settings-evidence-copy";
import {
  NOTIFICATION_PREFERENCE_CENTER_PAGE_TITLE,
} from "@/lib/notification-preference-center";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

import type { PageHelpTopic } from "./page-help-topic-rows-operator";

export const PAGE_HELP_TOPIC_ROWS_ADMIN_SECURITY: readonly { prefix: string; topic: PageHelpTopic }[] = [
  { prefix: "/help/billing-and-plans", topic: { slug: "billing-and-plans", label: BILLING_AND_PLANS_HELP_TOPIC_LABEL } },
  {
    prefix: "/help/security-trust",
    topic: { slug: "security-trust", label: SECURITY_TRUST_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/procurement",
    topic: { slug: "procurement", label: PROCUREMENT_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/scope",
    topic: { slug: "scope", label: SCOPE_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/data-handling",
    topic: { slug: "data-handling", label: DATA_HANDLING_TENANT_ISOLATION_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/dpa-template",
    topic: { slug: "dpa-template", label: DPA_TEMPLATE_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/soc2-self-assessment",
    topic: { slug: "soc2-self-assessment", label: SOC2_SELF_ASSESSMENT_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/enterprise-onboarding",
    topic: { slug: "enterprise-onboarding", label: ENTERPRISE_ONBOARDING_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/administration/identity-providers/role-mapping",
    topic: { slug: "users-and-roles", label: ROLE_MAPPING_SETTINGS_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/administration/identity-providers/oidc",
    topic: { slug: "enterprise-onboarding", label: IDENTITY_PROVIDERS_OIDC_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/administration/identity-providers/saml",
    topic: { slug: "enterprise-onboarding", label: IDENTITY_PROVIDERS_SAML_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/administration/identity/sso-wizard",
    topic: { slug: "enterprise-onboarding", label: SSO_WIZARD_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/administration/scim-provisioning",
    topic: { slug: "enterprise-onboarding", label: SCIM_PROVISIONING_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/administration/workspace-settings/recycle-bin",
    topic: { slug: "workspace-settings", label: WORKSPACE_SETTINGS_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/administration/identity-providers/diagnostics",
    topic: { slug: "enterprise-onboarding", label: IDENTITY_PROVIDERS_DIAGNOSTICS_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/administration/identity-providers",
    topic: { slug: "enterprise-onboarding", label: IDENTITY_PROVIDERS_SETTINGS_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/administration/api-keys",
    topic: { slug: "api-keys", label: API_KEYS_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/account/preferences",
    topic: { slug: "preferences", label: PREFERENCES_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/administration/notifications",
    topic: { slug: "notifications", label: NOTIFICATION_PREFERENCE_CENTER_PAGE_TITLE },
  },
  {
    prefix: "/account/security",
    topic: { slug: "security-trust", label: ACCOUNT_SECURITY_SETTINGS_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/administration/auth-domains",
    topic: { slug: "enterprise-onboarding", label: AUTH_DOMAINS_SETTINGS_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/administration/users/invite-reviewer",
    topic: { slug: "users-and-roles", label: INVITE_REVIEWER_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/administration/users",
    topic: { slug: "users-and-roles", label: SETTINGS_USERS_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/administration/settings/users",
    topic: { slug: "users-and-roles", label: SETTINGS_USERS_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/settings/roles",
    topic: { slug: "users-and-roles", label: SETTINGS_USERS_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/administration/security-trust",
    topic: { slug: "security-trust", label: SETTINGS_SECURITY_TRUST_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/administration/settings/security-trust",
    topic: { slug: "security-trust", label: SETTINGS_SECURITY_TRUST_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/administration/workspace-settings",
    topic: { slug: "workspace-settings", label: OPERATOR_NAV_LINK_LABELS.workspaceSettings },
  },
];
