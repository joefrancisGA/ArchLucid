/** MG-003 — Working execute gravity in one sentence (help/account). */
export const MODE_GRAVITY_WORKING_GRAVITY_ONE_SENTENCE =
  "This desk is Career work unless you switch to Rehearsal." as const;

export const MODE_GRAVITY_WORKING_GRAVITY_REHEARSAL_EXCEPTION =
  "Rehearsal is explicit practice — not the unlabeled default day." as const;

export const MODE_GRAVITY_GUIDED_GRAVITY_ONE_SENTENCE =
  "Guided is a teaching product with eval chrome — not Working Career gravity." as const;

/** Customer-facing copy must not list engineering flags (ADR 0094). */
export const MODE_GRAVITY_FORBIDDEN_CUSTOMER_FLAG_MARKERS = [
  /NEXT_PUBLIC_/i,
  /operator-experience/i,
  /appsettings/i,
] as const;
