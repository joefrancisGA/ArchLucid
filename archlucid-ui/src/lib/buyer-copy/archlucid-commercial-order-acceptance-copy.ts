/**
 * Owner commercial acceptance — quote-first; Stripe checkout when Prices are published.
 * Dollar amounts stay in docs/go-to-market/PRICING_PHILOSOPHY.md only.
 */

export const ARCHLUCID_COMMERCIAL_ORDER_ACCEPTANCE_SHORT =
  "The owner accepts guided-pilot, design-partner, Enterprise evaluation, trial-to-paid, and monthly Architect, Team, and Professional orders at published list prices by signed quote." as const;

export const ARCHLUCID_COMMERCIAL_ORDER_ACCEPTANCE_CHECKOUT_LINE =
  "Stripe checkout is authorized when engineering publishes Prices; until then, quote and order form are the binding paths." as const;

export const ARCHLUCID_BETA_PACKAGING_LEAD =
  `${ARCHLUCID_COMMERCIAL_ORDER_ACCEPTANCE_SHORT} Monthly list prices are on /pricing. ${ARCHLUCID_COMMERCIAL_ORDER_ACCEPTANCE_CHECKOUT_LINE} Beta remains NO_GO.` as const;

export const ARCHLUCID_BETA_PACKAGING_LEAD_PRICING_PAGE =
  `${ARCHLUCID_COMMERCIAL_ORDER_ACCEPTANCE_SHORT} Monthly list prices are in the tier grid above. ${ARCHLUCID_COMMERCIAL_ORDER_ACCEPTANCE_CHECKOUT_LINE} Beta remains NO_GO.` as const;

export const ARCHLUCID_PRICING_SALES_LED_NOTE =
  "ArchLucid is sold through guided evaluation and procurement. The owner accepts guided-pilot, design-partner, Enterprise evaluation, trial-to-paid, and monthly Architect, Team, and Professional orders at published list prices by signed quote. Monthly list prices are in the tier grid. Stripe checkout is authorized when Prices are published; until then, quote and order form finalize terms." as const;

export const ARCHLUCID_PROCUREMENT_ORDER_ACCEPTANCE_LEAD =
  `${ARCHLUCID_COMMERCIAL_ORDER_ACCEPTANCE_SHORT} ${ARCHLUCID_COMMERCIAL_ORDER_ACCEPTANCE_CHECKOUT_LINE} Other rows show what exists versus what is not published.` as const;
