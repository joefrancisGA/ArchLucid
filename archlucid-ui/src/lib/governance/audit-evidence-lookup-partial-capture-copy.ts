/** Audit lineage lookup depends on stored evaluation artifacts; partial capture may hide prior visits. */
export const AUDIT_EVIDENCE_LOOKUP_PARTIAL_CAPTURE_LINE =
  "Audit lineage lookup reads stored evaluation artifacts. Partial capture may hide controls you visited before recovery succeeds." as const;