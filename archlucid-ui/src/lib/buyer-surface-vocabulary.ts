/**
 * Canonical labels for buyer-polished surfaces — keeps “evidence graph”, “audit trail”,
 * and “approval path” consistent across Review, Manifest, Graph, Governance, and Audit.
 */
export const BUYER_SURFACE_VOCABULARY = {
  /** Graph surface / citations — matches graph page title in buyer shell. */
  evidenceGraph: "Decision traceability graph",
  /** Sidebar / compact nav — buyer-facing entry label before opening the graph view. */
  evidenceGraphNav: "Evidence trail",
  auditTrail: "Audit trail",
  approvalPath: "Approval path",
  /** Surface term for persisted findings in buyer copy. */
  finding: "Finding",
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
    "High-level ROI and governance indicators for sponsors. Portfolio savings, 30-day finding activity, and risk-register signals load from live APIs; empty tiles show an em dash when data is unavailable.",
  roiMetricsSrOnly: "Executive ROI metrics",
  resolvedFindings30dMetric: {
    title: "Findings resolved (30 days)",
    description: "Accepted, remediated, or approved in trailing window",
  },
  newlyDiscoveredFindings30dMetric: {
    title: "Findings discovered (30 days)",
    description: "New risks on committed runs in trailing window",
  },
  staleArchitectureRisksMetric: {
    title: "Stale architecture risks",
    description: "Risk register entries needing revisit",
  },
  expiringWaiversMetric: {
    title: "Waivers expiring (14 days)",
    description: "Active risk exceptions nearing expiration",
  },
  sqlBackupRegionVerificationMetric: {
    title: "SQL backup region verification",
    description: "Terraform plan guard (CI/CD artifact)",
  },
} as const;
