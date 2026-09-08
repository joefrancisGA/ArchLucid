import { CAIQ_SIG_RESPONSE_HELP_CENTER_SUMMARY, CAIQ_SIG_RESPONSE_HELP_PAGE_TITLE } from "@/lib/caiq-sig-response-help-guide-content";
import { ENTERPRISE_ONBOARDING_HELP_PAGE_TITLE } from "@/lib/enterprise-onboarding-help-copy";

import type { HelpCenterDisplay } from "@/lib/help/help-center-catalog";
import { secureNowCloudConnectionsSummary } from "@/lib/product-line/securenow-cloud-platform-policy";

/**
 * SecureNow help hub landing grid — security, cloud, assurance, and admin topics.
 * Architecture review walkthroughs stay registered but are not featured in the Security shell.
 */
export const HELP_CENTER_SECURITY_FEATURED_SLUGS: readonly string[] = [
  "getting-started",
  "cloud-connections",
  "security-trust",
  "data-handling",
  "authentication-sign-in",
  "integration-readiness",
  "users-and-roles",
  "billing-and-plans",
  "troubleshooting",
  "subprocessors",
  "procurement",
  "report-a-problem",
  "contact-support",
  "enterprise-onboarding",
] as const;

const HELP_CENTER_SECURITY_DISPLAY_OVERRIDES: Readonly<Partial<Record<string, HelpCenterDisplay>>> = {
  "getting-started": {
    title: "Getting started",
    summary:
      "Learn how SecureNow connects cloud evidence, routes alerts, and supports security operations workflows.",
  },
  "cloud-connections": {
    title: "Cloud connections",
    summary: secureNowCloudConnectionsSummary(),
  },
  "security-trust": {
    title: "Security and trust",
    summary:
      "Assurance posture, diligence materials, and links to data-handling and subprocessors for SecureNow buyers.",
  },
  "data-handling": {
    title: "Data handling and tenant isolation",
    summary:
      "How SecureNow handles review evidence, tenant scope, audit trail, and AI provider processing.",
  },
  "authentication-sign-in": {
    title: "Authentication and sign-in",
    summary:
      "Passwordless sign-in, SSO, invitations, and account recovery for SecureNow workspaces.",
  },
  "integration-readiness": {
    title: "Integration readiness",
    summary:
      "See which notification, ticketing, and webhook integrations are ready for your SecureNow workspace.",
  },
  "users-and-roles": {
    title: "Users and roles",
    summary: "Assign Admin, Architect, Reader, and Auditor roles; map IdP groups to SecureNow authority.",
  },
  "billing-and-plans": {
    title: "Billing and plans",
    summary: "Manage your SecureNow subscription, payment method, invoices, seats, and usage.",
  },
  troubleshooting: {
    title: "Troubleshooting",
    summary: "Fix sign-in, connector, loading, and export problems in SecureNow.",
  },
  subprocessors: {
    title: "Subprocessors",
    summary: "Hosted ArchLucid subprocessors register for SecureNow — use with the DPA template and Trust Center pack.",
  },
  procurement: {
    title: "Procurement and security review",
    summary:
      "Buyer security packet, FAQ answers, and diligence paths when evaluating SecureNow for a pilot or purchase.",
  },
  "report-a-problem": {
    title: "Report a problem",
    summary: "What to include so SecureNow support can reproduce and trace the issue.",
  },
  "contact-support": {
    title: "Contact support",
    summary: "Troubleshooting guides, support email, and a downloadable diagnostic bundle for SecureNow.",
  },
  "enterprise-onboarding": {
    title: ENTERPRISE_ONBOARDING_HELP_PAGE_TITLE,
    summary:
      "Configure an enterprise SecureNow tenant — SSO, roles, audit export, and optional cloud connector evidence.",
  },
  "caiq-sig-response": {
    title: CAIQ_SIG_RESPONSE_HELP_PAGE_TITLE,
    summary: CAIQ_SIG_RESPONSE_HELP_CENTER_SUMMARY,
  },
  "soc2-self-assessment": {
    title: "SOC 2 self-assessment",
    summary:
      "Owner TSC readiness mapping for SecureNow diligence — not a CPA attestation; open Trust Center for the pack.",
  },
  "dpa-template": {
    title: "Data Processing Agreement (template)",
    summary:
      "Negotiation template for counsel — request the diligence pack from Trust Center; not your countersigned DPA.",
  },
};

export function getHelpCenterSecurityDisplayOverride(slug: string): HelpCenterDisplay | undefined {
  return HELP_CENTER_SECURITY_DISPLAY_OVERRIDES[slug];
}

export function isHelpCenterSecurityFeaturedSlug(slug: string): boolean {
  return HELP_CENTER_SECURITY_FEATURED_SLUGS.includes(slug);
}
