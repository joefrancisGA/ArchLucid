import { API_CONTRACTS_HELP_PAGE_TITLE } from "@/lib/api-contracts-help-guide-content";
import { CONFIGURATION_REFERENCE_HELP_TOPIC_LABEL } from "@/lib/configuration-reference-help-guide-content";
import { GOVERNANCE_APPROVAL_HELP_TOPIC_LABEL } from "@/lib/governance/governance-approval-help-evidence-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export type ApiContractsHelpJobMatrixRow = {
  readonly label: string;
  readonly when: string;
  readonly href?: string;
  readonly isCurrent?: boolean;
};

/** TB-2268 — explicit job split vs governance approval and configuration reference. */
export const API_CONTRACTS_HELP_JOB_MATRIX_HEADING =
  "Governance approval, configuration keys, or HTTP contract reference?";

export const API_CONTRACTS_HELP_JOB_MATRIX_TEST_ID = "help-api-contracts-job-matrix";

export const API_CONTRACTS_HELP_JOB_MATRIX: readonly ApiContractsHelpJobMatrixRow[] = [
  {
    label: GOVERNANCE_APPROVAL_HELP_TOPIC_LABEL,
    href: inAppHelpHref("governance-approval"),
    when: "Buyer approval workflows and finalize gates — not OpenAPI endpoint text",
  },
  {
    label: CONFIGURATION_REFERENCE_HELP_TOPIC_LABEL,
    href: inAppHelpHref("configuration-reference"),
    when: "Admin configuration tasks, SSO posture, and collapsed key catalog — not versioned HTTP contracts",
  },
  {
    label: API_CONTRACTS_HELP_PAGE_TITLE,
    when: "OpenAPI v1, auth schemes, pagination, and integrator-facing endpoint behavior",
    isCurrent: true,
  },
] as const;
