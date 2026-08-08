import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const OPERATOR_BILLING_SETTINGS_CANONICAL_PATH = "/administration/billing" as const;

export const OPERATOR_BILLING_SETTINGS_CLAIM_DISCIPLINE =
  "This Billing & plans page shows workspace subscription, usage, and wallet controls - it is not a signed-review diligence Sources package, financial reporting. Open Pricing, Billing help, or Audit when you need public packaging, methodology, or governed trails.";

export const OPERATOR_BILLING_SETTINGS_SOURCES_INTRO =
  "Use these follow-ups when plan or usage questions turn into public packaging, ROI methodology, AI spend controls, or invoice-oriented help.";

export type OperatorBillingSettingsSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources - no self-href to `/administration/billing`. */
export const OPERATOR_BILLING_SETTINGS_SOURCES: readonly OperatorBillingSettingsSourceLink[] = [
  { label: "Billing and plans help", href: inAppHelpHref("billing-and-plans") },
  { label: "Pricing", href: "/pricing" },
  { label: "AI usage", href: "/administration/ai-usage" },
  { label: "Pilot ROI model", href: inAppHelpHref("pilot-roi-model") },
  { label: "Audit", href: "/governance/audit" },
] as const;
