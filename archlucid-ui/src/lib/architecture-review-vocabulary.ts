/**
 * Operator-facing labels for architecture reviews (API routes and `runId` fields unchanged).
 * @see `docs/assessments/LATEST.md` item 16 — simplify domain vocabulary in the operator UI.
 */
export const ARCHITECTURE_REVIEW_VOCABULARY = {
  singular: "Architecture review",
  plural: "Architecture reviews",
  /** Support / diagnostics correlation label (value remains the API run id). */
  correlationIdLabel: "Review ID",
  pipelineStatusAriaPrefix: "Architecture review pipeline status",
  pipelineStagesAriaLabel: "Architecture review pipeline stages completed",
  /**
   * Shown under {@link LayerHeader} on Advanced operations / Governance surfaces.
   * Review = work unit; manifest = finalized package; trace = per-step execution record.
   */
  reviewManifestTraceHelp:
    "An architecture review is the end-to-end work unit (intake through finalized outputs). The finalized manifest is the signed package you govern and export for that review. Traces are per-step execution records—agents, scores, and pipeline stages—that explain how the manifest was produced.",
  /** Buyer-polished shell — replaces {@link reviewManifestTraceHelp} on LayerHeader and governance surfaces. */
  buyerReviewPackageScopeHelp:
    "A review package records the decision, evidence, manifest, governance approval, and audit trail for a single architecture review. Traces link review steps, evidence links, decisions, approvals, and deliverables.",
} as const;
