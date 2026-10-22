import { resolveInAppDocHref } from "@/lib/in-app-doc-href";

export const CUSTOM_POLICY_PACK_QUOTE_INTEREST = "custom-policy-pack";

export const CUSTOM_POLICY_PACK_TIER_INTEREST_LABEL =
  "Custom policy pack (professional services)";

export const PRICING_PHILOSOPHY_CUSTOM_PACK_HREF =
  resolveInAppDocHref(
    "docs/go-to-market/PRICING_PHILOSOPHY.md#42-custom-policy-pack-authoring-professional-services",
  );

export const CUSTOM_POLICY_PACK_SOW_HREF = resolveInAppDocHref(
  "docs/go-to-market/CUSTOM_POLICY_PACK_AUTHORING_SOW_TEMPLATE.md",
);

export const ORDER_FORM_ADDENDUM_C_HREF =
  resolveInAppDocHref(
    "docs/go-to-market/ORDER_FORM_TEMPLATE.md#addendum-c--custom-policy-pack-authoring-professional-services",
  );

export type CustomPolicyPackAuthoringSku = {
  id: string;
  title: string;
  scopeSummary: string;
  deliveryWindow: string;
  postDeliverySupport: string;
};

/** Scope summaries mirror PRICING_PHILOSOPHY §4.2 — list prices stay in that doc only. */
export const CUSTOM_POLICY_PACK_AUTHORING_SKUS: CustomPolicyPackAuthoringSku[] = [
  {
    id: "starter",
    title: "Custom Pack — Starter",
    scopeSummary: "1 pack, up to 20 rules",
    deliveryWindow: "4 weeks",
    postDeliverySupport: "30 days",
  },
  {
    id: "standard",
    title: "Custom Pack — Standard",
    scopeSummary: "Up to 3 packs or 1 pack with 50+ rules",
    deliveryWindow: "8 weeks",
    postDeliverySupport: "90 days",
  },
  {
    id: "program",
    title: "Custom Pack — Program",
    scopeSummary: "Multi-pack engagement, dedicated PS lead, quarterly refresh",
    deliveryWindow: "Negotiated",
    postDeliverySupport: "Annual",
  },
];

export function buildCustomPolicyPackQuoteHref(quoteSectionDomId: string): string {
  return `/pricing?interest=${CUSTOM_POLICY_PACK_QUOTE_INTEREST}#${quoteSectionDomId}`;
}
