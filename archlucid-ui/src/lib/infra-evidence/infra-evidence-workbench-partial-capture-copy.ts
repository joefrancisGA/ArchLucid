/** Drift workbench diffs reflect the selected snapshot; partial capture may omit resources. */
export const DRIFT_WORKBENCH_PARTIAL_CAPTURE_LINE =
  "Drift and inventory rows reflect the selected snapshot. Partial capture may omit resources until recovery succeeds." as const;

/** Diagram reconcile uses inventory snapshot correspondence; partial capture may hide matches. */
export const DIAGRAM_RECONCILE_PARTIAL_CAPTURE_LINE =
  "Correspondence rows compare diagram nodes to inventory. Partial capture may omit unscanned resources." as const;

/** Live diagram render reads a stored snapshot; partial capture may omit nodes. */
export const DIAGRAMS_WORKBENCH_PARTIAL_CAPTURE_LINE =
  "Diagrams render from the selected inventory snapshot. Partial capture may omit resources until recovery succeeds." as const;

/** Terraform advisory text is generated from stored snapshot inventory; partial capture may omit resources. */
export const TERRAFORM_WORKBENCH_PARTIAL_CAPTURE_LINE =
  "Snippet preview reflects stored snapshot inventory. Partial capture may omit resources until recovery succeeds." as const;