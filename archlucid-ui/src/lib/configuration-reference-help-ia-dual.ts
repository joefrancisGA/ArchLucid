import { API_CONTRACTS_HELP_PAGE_TITLE } from "@/lib/api-contracts-help-guide-content";
import { AUTHENTICATION_SIGN_IN_HELP_TOPIC_LABEL } from "@/lib/authentication-sign-in-help-evidence-copy";
import {
  CONFIGURATION_REFERENCE_HELP_JOB_MATRIX_HEADING,
  CONFIGURATION_REFERENCE_HELP_JOB_MATRIX_HEADING_ID,
  CONFIGURATION_REFERENCE_HELP_PAGE_TITLE,
} from "@/lib/configuration-reference-help-guide-content";
import { ENTERPRISE_ONBOARDING_HELP_TOPIC_LABEL } from "@/lib/enterprise-onboarding-help-evidence-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export type ConfigurationReferenceHelpJobMatrixRow = {
  readonly label: string;
  readonly when: string;
  readonly href?: string;
  readonly isCurrent?: boolean;
};

export const CONFIGURATION_REFERENCE_HELP_JOB_MATRIX_TEST_ID =
  "help-configuration-reference-job-matrix";

/** Merged wayfinding list — each destination appears exactly once (TB-2271). */
export const CONFIGURATION_REFERENCE_HELP_JOB_MATRIX: readonly ConfigurationReferenceHelpJobMatrixRow[] =
  [
    {
      label: ENTERPRISE_ONBOARDING_HELP_TOPIC_LABEL,
      href: inAppHelpHref("enterprise-onboarding"),
      when: "Buyer-hosted enterprise checklist — workforce SSO and tenant setup, not a raw key catalog",
    },
    {
      label: API_CONTRACTS_HELP_PAGE_TITLE,
      href: inAppHelpHref("api-contracts"),
      when: "OpenAPI v1, auth schemes, and integrator HTTP behavior — not deployment configuration keys",
    },
    {
      label: AUTHENTICATION_SIGN_IN_HELP_TOPIC_LABEL,
      href: inAppHelpHref("authentication-sign-in"),
      when: "Workforce sign-in flows and session behavior — not a configuration key catalog",
    },
    {
      label: CONFIGURATION_REFERENCE_HELP_PAGE_TITLE,
      when: "Admin SSO wizard, identity providers, hosting posture, and collapsed configuration key appendix",
      isCurrent: true,
    },
  ] as const;

export { CONFIGURATION_REFERENCE_HELP_JOB_MATRIX_HEADING, CONFIGURATION_REFERENCE_HELP_JOB_MATRIX_HEADING_ID };
