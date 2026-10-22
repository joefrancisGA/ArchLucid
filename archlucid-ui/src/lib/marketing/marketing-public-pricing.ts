/** Public marketing tier display — CTAs and grid order (not locked list prices). */

export const MARKETING_PRICING_TIER_ORDER = ["architect", "team", "professional", "enterprise"] as const;

export type MarketingPricingTierId = (typeof MARKETING_PRICING_TIER_ORDER)[number];

export function isMarketingPricingTierId(id: string): id is MarketingPricingTierId {
  return (MARKETING_PRICING_TIER_ORDER as readonly string[]).includes(id);
}

export type MarketingPricingTierCta = {
  readonly primaryLabel: string;
  readonly primaryKind: "stripe" | "signup" | "quote";
  readonly secondaryLabel?: string;
  readonly secondaryKind?: "signup" | "quote" | "stripe";
};

export const MARKETING_PRICING_TIER_CTAS: Readonly<Record<MarketingPricingTierId, MarketingPricingTierCta>> = {
  architect: {
    primaryLabel: "Start Architect plan",
    primaryKind: "stripe",
    secondaryLabel: "Sign up for Architect",
    secondaryKind: "signup",
  },
  team: {
    primaryLabel: "Start team evaluation",
    primaryKind: "stripe",
    secondaryLabel: "Sign up for Team",
    secondaryKind: "signup",
  },
  professional: {
    primaryLabel: "Request guided trial",
    primaryKind: "quote",
  },
  enterprise: {
    primaryLabel: "Request enterprise discussion",
    primaryKind: "quote",
  },
};

export const MARKETING_PRICING_RECOMMENDED_TIER: MarketingPricingTierId = "professional";

/** Operator billing grid — recommended badge only on self-serve tiers with a checkout path. */
export const OPERATOR_BILLING_RECOMMENDED_TIER: MarketingPricingTierId = "team";

export const OPERATOR_BILLING_PAGE_LEAD =
  "Manage your plan, AI usage credits, payment method, and billing settings.";

export const OPERATOR_BILLING_PUBLIC_PRICING_LINK_LABEL = "View public pricing";

export const OPERATOR_BILLING_CATALOG_NOTE = "Plan details are generated from the current pricing catalog.";

export const OPERATOR_BILLING_AI_OVERAGE_NOTE =
  "Additional AI usage uses prepaid credits after your included allowance is consumed.";

/** Plain-English checkout terms shared between operator billing and public pricing surfaces. */
export const OPERATOR_BILLING_SELF_SERVE_CHECKOUT_TERMS = {
  renewal:
    "Your plan renews automatically each billing period until you cancel from Billing and plans or the Stripe billing portal.",
  tax: "Listed prices exclude tax. Applicable sales or VAT tax is calculated at checkout based on your billing address.",
  proration: "Seat or workspace quantity changes may prorate on your next invoice.",
  cancellation:
    "Cancel or change your subscription anytime from Billing and plans → Invoices and receipts (Stripe billing portal).",
} as const;

export function buildOperatorBillingSelfServeCheckoutTermsLine(): string {
  const { renewal, tax, proration, cancellation } = OPERATOR_BILLING_SELF_SERVE_CHECKOUT_TERMS;

  return `${renewal} ${tax} ${proration} ${cancellation}`;
}

export const OPERATOR_BILLING_TIER_CTAS: Readonly<
  Record<MarketingPricingTierId, { readonly primaryLabel: string }>
> = {
  architect: { primaryLabel: "Start Architect plan" },
  team: { primaryLabel: "Upgrade to Team" },
  professional: { primaryLabel: "Request guided trial" },
  enterprise: { primaryLabel: "Request enterprise discussion" },
};

export const BUYER_MARKETING_PRICING_AI_USAGE_NOTE =
  "Plans include monthly AI credits. Larger workloads can use prepaid credits or an approved customer AI provider.";

export const BUYER_MARKETING_PRICING_ADDONS_NOTE =
  "Need more seats, workspaces, or AI credits? Add-ons are available on paid plans — contact us or see the usage notes below before you scale.";

export const MARKETING_PRICING_USAGE_FAQ_TITLE = "Usage, AI credits, and add-ons";

export const MARKETING_PRICING_USAGE_FAQ_ITEMS: readonly { readonly question: string; readonly answer: string }[] = [
  {
    question: "How do AI credits work?",
    answer:
      "Each paid plan includes a monthly AI credit allowance for architecture creation, review, and evidence Q&A. Architect and Team plans have hard monthly caps with prepaid top-ups when you need more. Professional and Enterprise plans include larger allowances with clear overage options.",
  },
  {
    question: "Can I add seats or workspaces later?",
    answer:
      "Yes. Team and Professional plans include a set number of users and workspaces. Additional seats and workspaces are available as add-ons without changing your core plan.",
  },
  {
    question: "What happens if I exceed my allowance?",
    answer:
      "We notify you before you hit limits. You can purchase prepaid AI credits, reduce usage, or upgrade — we do not run silent unlimited AI on self-serve plans.",
  },
  {
    question: "Is Enterprise priced on this page?",
    answer:
      "Enterprise is custom. We align scope, deployment model, SSO, procurement terms, and support with your organization before quoting.",
  },
];
