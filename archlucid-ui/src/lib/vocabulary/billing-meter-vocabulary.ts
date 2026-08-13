/**
 * Buyer-facing billing meter nouns — architecture packages are the billable unit (TB-743).
 * Internal pricing JSON keys (`includedReviewsPerMonth`, `overageReviewUsd`) stay unchanged.
 */
export const BILLING_INCLUDED_ARCHITECTURE_PACKAGES_LABEL = "Included architecture packages";

export const BILLING_ADDITIONAL_ARCHITECTURE_PACKAGES_LABEL = "Additional architecture packages";

export const BILLING_ARCHITECTURE_PACKAGE_OVERAGE_UNIT_LABEL = "architecture package";

/** Plan catalog — monthly AI credits bundled with the tier (`pricing.json` `monthlyAiCredits`). TB-1168 */
export const BILLING_INCLUDED_AI_CREDITS_LABEL = "Included AI credits";

/** Current-plan card — plan-tier monthly AI allowance when a paid plan is active. TB-1168 */
export const BILLING_MONTHLY_AI_BUDGET_ALLOWANCE_LABEL = "Monthly AI budget allowance";

/** Current-plan card — workspace LLM hard cap when no paid plan is active (not a sold entitlement). */
export const BILLING_WORKSPACE_AI_SPEND_CAP_LABEL = "Workspace AI spend cap";

export const BILLING_WORKSPACE_AI_SPEND_CAP_PROVENANCE =
  "Workspace AI spend cap — not a plan entitlement";

/** Enterprise / custom tier catalog value when credits are not listed numerically. TB-1168 */
export const BILLING_CUSTOM_AI_ALLOWANCE_VALUE = "Custom AI allowance";

export const BILLING_AI_USAGE_SECTION_INTRO =
  "Track your monthly AI budget allowance (USD), prepaid AI credit balance, and auto-replenish settings below.";

export const BILLING_MONTHLY_AI_USAGE_CARD_DESCRIPTION =
  "Monthly AI budget allowance is measured in USD and is separate from the AI credits bundled with each plan tier.";
