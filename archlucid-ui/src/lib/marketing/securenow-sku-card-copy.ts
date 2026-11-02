export const SECURENOW_SKU_CARD_HEADING = "SecureNow SKU and meter card" as const;

export const SECURENOW_SKU_CARD_LEAD =
  "Buyer-safe identifiers and capacity meters for a controlled evaluation. SecureNow beta remains NO_GO." as const;

export const SECURENOW_SKU_CARD_ROWS = [
  ["SN-EVAL", "Controlled evaluation", "45-day evaluation; up to 2 Azure subscriptions and 4 successful snapshots"],
  ["SN-ANNUAL", "Annual subscription evidence", "One-year term; 3 Azure subscriptions, 24 successful snapshots, and 5 named operators"],
  ["SN-SUB-ADD", "Annual scope expansion", "One additional subscription on an annual term; private quote cap applies"],
  ["SN-SNAP-4", "Capture expansion", "4 successful snapshots; unused balance expires at the applicable annual term"],
] as const;

export const SECURENOW_SKU_CARD_LIMIT =
  "These identifiers are not active entitlements. This card does not state a fee, tax amount, discount, or public list price." as const;
