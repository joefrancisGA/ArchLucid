import { securenowInternalDocHref } from "@/lib/product-line/securenow-internal-doc-href";

import {
  SECURENOW_QUOTE_PACKET_COMMERCE_LIMIT,
  SECURENOW_QUOTE_PACKET_GUARDRAIL,
  SECURENOW_QUOTE_PACKET_SEQUENCE,
  SECURENOW_QUOTE_PACKET_SKUS,
} from "@/lib/product-line/securenow-quote-packet-copy";

export const SECURENOW_REVIEWER_PACKET_PATH = "/administration/securenow-reviewer-packet" as const;

export const SECURENOW_REVIEWER_PACKET_HEADING = "Reviewer packet (signed in)" as const;

export const SECURENOW_REVIEWER_PACKET_LEAD =
  "Procurement and readiness index for evaluators already in the tenant. The owner accepts SN-EVAL orders at the published price by signed quote. SecureNow beta remains NO_GO." as const;

export const SECURENOW_REVIEWER_PACKET_GUARDRAIL =
  "List prices are on the quote packet. This page does not take payment or start commerce." as const;

export const SECURENOW_REVIEWER_PACKET_NO_GO =
  "SecureNow beta remains NO_GO until owner-directed pilot gates clear." as const;

export const SECURENOW_REVIEWER_PACKET_PROCUREMENT_ITEMS = [
  "Quote cover and controlled pilot proposal",
  "Security one-pager and procurement index",
  "Data-processing schedule and support commitment",
  "Order form and measurement log templates",
] as const;

export const SECURENOW_REVIEWER_PACKET_OPERATOR_LINKS = [
  {
    label: "Quote packet (SKU identifiers)",
    href: "/administration/securenow-quote-packet",
  },
  {
    label: "Security and trust",
    href: "/administration/security-trust",
  },
  {
    label: "Compliance notes",
    href: "/administration/securenow-compliance-notes",
  },
  {
    label: "Accessibility",
    href: "/administration/securenow-accessibility",
  },
] as const;

export const SECURENOW_REVIEWER_PACKET_SOURCE_NOTES = [
  {
    label: "Procurement index",
    href: securenowInternalDocHref("PROCUREMENT_INDEX.md"),
  },
  {
    label: "Quote cover",
    href: securenowInternalDocHref("QUOTE_COVER.md"),
  },
  {
    label: "Controlled pilot proposal",
    href: securenowInternalDocHref("CONTROLLED_PILOT_PROPOSAL.md"),
  },
] as const;

export const SECURENOW_REVIEWER_PACKET_SKUS = SECURENOW_QUOTE_PACKET_SKUS;
export const SECURENOW_REVIEWER_PACKET_SEQUENCE = SECURENOW_QUOTE_PACKET_SEQUENCE;
export const SECURENOW_REVIEWER_PACKET_COMMERCE_LIMIT = SECURENOW_QUOTE_PACKET_COMMERCE_LIMIT;
export const SECURENOW_REVIEWER_PACKET_QUOTE_GUARDRAIL = SECURENOW_QUOTE_PACKET_GUARDRAIL;
