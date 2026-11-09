/**
 * Canonical SecureNow list prices for UI surfaces allowed in PRICING_PHILOSOPHY.md §9.
 * Locked fee phrases are scanned by scripts/ci/check_pricing_single_source.py.
 */

export const SECURENOW_PUBLISHED_LIST_PRICE_SECTION_ID = "securenow-published-list-price" as const;

export const SECURENOW_PUBLISHED_LIST_PRICE_HEADING = "Published list price (quote only)" as const;

export const SECURENOW_PUBLISHED_LIST_PRICE_LEAD =
  "Orders are by quote only. Not checkout, not a Stripe Price, and not permission to invoice. SecureNow beta remains NO_GO." as const;

export type SecureNowPublishedListPriceRow = {
  readonly id: string;
  readonly what: string;
  readonly price: string;
  readonly meter: string;
};

export const SECURENOW_PUBLISHED_LIST_PRICE_ROWS: readonly SecureNowPublishedListPriceRow[] = [
  {
    id: "SN-EVAL",
    what: "45-day controlled evaluation",
    price: "**$8,000** once",
    meter: "Up to 2 Azure subscriptions and 4 successful snapshots. Reader-only.",
  },
  {
    id: "SN-ANNUAL",
    what: "One-year subscription evidence",
    price: "**$24,000** per year",
    meter: "3 Azure subscriptions, 24 successful snapshots in the year, and 5 named operators.",
  },
  {
    id: "SN-SUB-ADD",
    what: "One more subscription on an annual term",
    price: "**$6,000** per year",
    meter: "Cap 10 subscriptions on this sheet.",
  },
  {
    id: "SN-SNAP-4",
    what: "Extra captures",
    price: "**$1,500** prepaid",
    meter: "4 successful snapshots; unused balance expires at the end of that annual term.",
  },
] as const;

export const SECURENOW_PUBLISHED_LIST_PRICE_EVALUATION_CREDIT =
  "The **$8,000** evaluation fee is credited in full against SN-ANNUAL only when the annual order is signed within 90 days after the evaluation ends. It is not credited against any ArchLucid SKU." as const;

export const SECURENOW_PUBLISHED_LIST_PRICE_POSTURE =
  "Currency is USD. Prices exclude sales tax. There is no monthly card price. An ArchLucid Team, Professional, or Enterprise payment does not grant SecureNow." as const;

export const SECURENOW_PUBLISHED_LIST_PRICE_PHILOSOPHY_HREF = "/help/procurement" as const;
