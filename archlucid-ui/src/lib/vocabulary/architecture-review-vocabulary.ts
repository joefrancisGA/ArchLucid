/**
 * Operator-facing labels for architecture reviews (API routes and `runId` fields unchanged).
 * @see `docs/assessments/LATEST.md` item 16 — simplify domain vocabulary in the operator UI.
 */
export const ARCHITECTURE_REVIEW_VOCABULARY = {
  singular: "Architecture review",
  plural: "Architecture reviews",
  /**
   * One-time bridge for first-session / diagnostics copy where URLs and payloads still expose `runId`
   * (see `docs/library/PRODUCT_PACKAGING.md` §3).
   */
  runIdBridgeSentence:
    "Each architecture review is tracked as one run in APIs and support bundles (runId).",
  /** Inline label when showing the raw identifier next to review vocabulary. */
  correlationIdFieldBridge: "Review ID (API field: runId)",
  /** Support / diagnostics correlation label (value remains the API run id). */
  correlationIdLabel: "Review ID",
  pipelineStatusAriaPrefix: "Architecture review pipeline status",
  pipelineStagesAriaLabel: "Architecture review pipeline stages completed",
  /**
   * Shown under {@link LayerHeader} on Advanced operations / Governance surfaces.
   * Architecture review = governed work unit; evidence trail = provenance for how outputs were produced.
   */
  reviewManifestTraceHelp:
    "An architecture review contains the sealed review record, findings, decisions, evidence, and audit trail. It is the end-to-end work unit from intake through those outputs. The evidence trail explains how the review was produced.",
  /** LayerHeader and governance surfaces — same vocabulary as {@link reviewManifestTraceHelp}. */
  buyerReviewPackageScopeHelp:
    "An architecture review contains the sealed review record, findings, decisions, evidence, and audit trail. It is the end-to-end work unit from intake through those outputs. The evidence trail explains how the review was produced.",
} as const;
