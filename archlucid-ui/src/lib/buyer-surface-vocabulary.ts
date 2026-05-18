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
  /** Golden / signed manifest artifact in buyer copy — avoid informal “sealed”. */
  finalizedSignedManifestRecord: "Finalized signed manifest record",
} as const;

/**
 * Canonical `/dashboard` executive summary copy — import here instead of repeating literals so breadcrumbs,
 * metadata, Ask grounding, and KPI cards stay aligned.
 */
export const BUYER_EXECUTIVE_SUMMARY_VOCABULARY = {
  pageTitle: "Executive summary",
  pageLead:
    "High-level ROI indicators for sponsors. Figures below are illustrative placeholders until live workspace metrics are wired.",
  roiMetricsSrOnly: "Executive ROI metrics",
  architecturalDriftsPreventedMetric: {
    title: "Architectural drifts prevented",
    description: "Early correction count (mock)",
  },
  estimatedHoursSavedMetric: {
    title: "Estimated hours saved",
    description: "Architect time (mock)",
  },
  compliancePostureScoreMetric: {
    title: "Compliance posture score",
    description: "Aggregate posture (mock)",
  },
  sqlBackupRegionVerificationMetric: {
    title: "SQL backup region verification",
    description: "Terraform plan guard (CI/CD artifact)",
  },
} as const;
