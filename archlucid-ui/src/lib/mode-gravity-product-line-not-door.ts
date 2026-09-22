/** MG-007 — product line is packaging, not a Career door. */
export const MODE_GRAVITY_PRODUCT_LINE_NOT_DOOR_LINE =
  "Product line (Architecture vs Security) is packaging — not a third execute door (CG-017 / ADR 0094)." as const;

export const MODE_GRAVITY_PRODUCT_LINE_ADR_CITATION = "0094" as const;

export const MODE_GRAVITY_FORBIDDEN_THIRD_DOOR_MARKERS = [
  /third door/i,
  /product line.*career/i,
  /security.*rehearsal door/i,
] as const;
