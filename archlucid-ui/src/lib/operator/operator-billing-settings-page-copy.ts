import { OPERATOR_BILLING_PAGE_LEAD } from "@/lib/marketing/marketing-public-pricing";

export const OPERATOR_BILLING_SETTINGS_PRIMARY_CONTENT_ID = "operator-billing-settings-primary-content" as const;

export const OPERATOR_BILLING_SETTINGS_FIRST_VIEWPORT_ID = "operator-billing-settings-first-viewport" as const;

export const OPERATOR_BILLING_SETTINGS_SKIP_TARGET_ID = OPERATOR_BILLING_SETTINGS_FIRST_VIEWPORT_ID;

export const OPERATOR_BILLING_SETTINGS_SKIP_LINK_LABEL = "Skip to billing workspace" as const;

export const OPERATOR_BILLING_SETTINGS_HEADER_CLAIM_DISCIPLINE_TEST_ID =
  "operator-billing-settings-claim-discipline" as const;

export const OPERATOR_BILLING_SETTINGS_PAGE_SUBTITLE_BUYER =
  "Review your workspace plan, AI usage credits, payment method, and billing settings." as const;

export function operatorBillingSettingsPageSubtitle(buyerPolishedShell: boolean): string {
  return buyerPolishedShell ? OPERATOR_BILLING_SETTINGS_PAGE_SUBTITLE_BUYER : OPERATOR_BILLING_PAGE_LEAD;
}
