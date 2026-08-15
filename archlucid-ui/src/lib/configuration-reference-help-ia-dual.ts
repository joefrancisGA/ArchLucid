import { API_CONTRACTS_HELP_PAGE_TITLE } from "@/lib/api-contracts-help-guide-content";
import {
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

/** TB-2271 — explicit job split vs enterprise onboarding and API contracts. */
export const CONFIGURATION_REFERENCE_HELP_JOB_MATRIX_HEADING =
  "Enterprise onboarding, HTTP contracts, or Admin configuration keys?";

export const CONFIGURATION_REFERENCE_HELP_JOB_MATRIX_TEST_ID =
  "help-configuration-reference-job-matrix";

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
      label: CONFIGURATION_REFERENCE_HELP_PAGE_TITLE,
      when: "Admin SSO wizard, identity providers, hosting posture, and collapsed configuration key appendix",
      isCurrent: true,
    },
  ] as const;
