/** IH-057 — spawn-locked findings honesty (no draft lease banner on the afternoon document). */

export const INHABIT_FINDINGS_SPAWN_LOCKED_LEASE_TITLE =
  "Spawn-locked review — findings use CAS" as const;

export const INHABIT_FINDINGS_SPAWN_LOCKED_LEASE_BODY =
  "The parent architecture draft is spawn-locked, so draft work-lease chrome stays on the architecture draft editor. Disposition on this findings document uses finding CAS — another operator can update a row and you may see a 409 conflict, not a presence indicator." as const;

export const INHABIT_FINDINGS_DRAFT_LEASE_TITLE = "Draft work lease active" as const;

export const INHABIT_FINDINGS_DRAFT_LEASE_BODY =
  "A draft work lease is held on the open architecture draft. Continue disposition here; steal lease remains on the architecture draft editor with confirm and audit." as const;
