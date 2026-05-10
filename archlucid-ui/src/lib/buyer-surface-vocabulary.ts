/**
 * Canonical labels for buyer-polished surfaces — keeps “evidence graph”, “audit trail”,
 * and “approval path” consistent across Review, Manifest, Graph, Governance, and Audit.
 */
export const BUYER_SURFACE_VOCABULARY = {
  evidenceGraph: "Evidence graph",
  auditTrail: "Audit trail",
  approvalPath: "Approval path",
  /** Surface term: a persisted “finding” is presented as a risk observation to buyers. */
  riskObservation: "Risk observation",
  phiMinimizationRisk: "PHI minimization risk",
} as const;
