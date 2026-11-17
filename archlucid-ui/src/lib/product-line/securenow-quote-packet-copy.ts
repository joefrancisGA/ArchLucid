import { securenowInternalDocHref } from "@/lib/product-line/securenow-internal-doc-href";

export const SECURENOW_QUOTE_PACKET_HEADING = "Quote packet" as const;

export const SECURENOW_QUOTE_PACKET_LEAD =
  "SKU identifiers and the quote sequence. The owner accepts SN-EVAL orders at the published price by signed quote. SecureNow beta remains NO_GO." as const;

export const SECURENOW_QUOTE_PACKET_GUARDRAIL =
  "Published list prices are quote-only. Seller, tax, and payout identity stay in the private price sheet." as const;

export const SECURENOW_QUOTE_PACKET_COMMERCE_LIMIT =
  "This page cannot authorize commerce." as const;

export const SECURENOW_QUOTE_PACKET_SN_EVAL_HEADING = "SN-EVAL acceptance" as const;

export const SECURENOW_QUOTE_PACKET_SN_EVAL_BODY =
  "SN-EVAL controlled-pilot acceptance language anchors here. Quote and order form bind acceptance — this page is not a countersigned order." as const;

export const SECURENOW_QUOTE_PACKET_SKUS = [
  ["SN-EVAL", "45-day evaluation; up to 2 Azure subscriptions and 4 successful snapshots"],
  [
    "SN-ANNUAL",
    "One-year term; 3 Azure subscriptions, 24 successful snapshots, and 5 named operators",
  ],
  ["SN-SUB-ADD", "One additional subscription on an annual term; the private quote sheet cap applies"],
  [
    "SN-SNAP-4",
    "4 successful snapshots; unused balance expires at the end of the applicable annual term",
  ],
] as const;

export const SECURENOW_QUOTE_PACKET_SEQUENCE = [
  "Quote cover",
  "Controlled pilot proposal",
  "Security one-pager and procurement index",
  "Data-processing schedule",
  "Support commitment",
  "Order form",
  "Blank measurement log and cost input",
] as const;

export const SECURENOW_QUOTE_PACKET_LINKS = [
  {
    label: "SKU and meter card",
    href: securenowInternalDocHref("SKU_METER_CARD.md"),
  },
  {
    label: "Quote-to-pilot checklist",
    href: securenowInternalDocHref("QUOTE_TO_PILOT_CHECKLIST.md"),
  },
  {
    label: "Quote cover",
    href: securenowInternalDocHref("QUOTE_COVER.md"),
  },
  {
    label: "Order form",
    href: securenowInternalDocHref("ORDER_FORM_TEMPLATE.md"),
  },
] as const;
