import { SECURENOW_PUBLIC_QUOTE_SEQUENCE_SECTION_ID } from "@/lib/marketing/securenow-public-commercial-packaging-copy";

export const SECURENOW_BETA_SKU_CONTENTS_HEADING = "Beta evaluation contents" as const;

export const SECURENOW_BETA_SKU_CONTENTS_LEAD =
  "What a controlled SecureNow evaluation includes and what it does not. Quote fees are recorded in the pricing philosophy; this card does not print dollar amounts." as const;

export const SECURENOW_BETA_SKU_CONTENTS_INCLUDES = [
  "Reader-scoped Azure inventory capture for subscriptions you configure",
  "Stored attack-path ranking, Path inspect, and cited explanations on stored hops",
  "Internal sponsor and pilot disposition pages with tenant audit writes",
  "SKU identifiers, meters, and the private quote sequence",
] as const;

export const SECURENOW_BETA_SKU_CONTENTS_EXCLUDES = [
  "Public list price, live Stripe checkout, or an approved order form on this site",
  "Azure write access, automatic remediation, or a certification claim",
  "A customer outcome — fixture paths and samples stay synthetic until you capture your subscription",
] as const;

export const SECURENOW_BETA_SKU_CONTENTS_QUOTE_HREF =
  `/securenow-sku#${SECURENOW_PUBLIC_QUOTE_SEQUENCE_SECTION_ID}` as const;

export const SECURENOW_BETA_SKU_CONTENTS_QUOTE_LABEL = "View quote sequence on this card" as const;

/** Operator quote packet page keeps the administration surface for signed-in buyers. */
export const SECURENOW_OPERATOR_QUOTE_PACKET_HREF = "/administration/securenow-quote-packet" as const;
