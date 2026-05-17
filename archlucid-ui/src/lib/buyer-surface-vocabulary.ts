/**
 * Canonical labels for buyer-polished surfaces — keeps “evidence graph”, “audit trail”,
 * and “approval path” consistent across Review, Manifest, Graph, Governance, and Audit.
 */
export const BUYER_SURFACE_VOCABULARY = {
  /** Graph surface / citations — matches graph page title in buyer shell. */
  evidenceGraph: "Decision traceability graph",
  /** Sidebar / compact nav — buyer-facing entry label before opening the graph view. */
  evidenceGraphNav: "Evidence trail",
  auditTrail: "Audit Trail",
  approvalPath: "Approval path",
  /** Surface term: a persisted “finding” is presented as a risk observation to buyers. */
  riskObservation: "Risk observation",
  phiMinimizationRisk: "PHI minimization risk",
} as const;
