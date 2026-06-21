/**
 * Canonical labels for buyer-polished surfaces — keeps “evidence graph”, “audit trail”,
 * and “approval path” consistent across Review, Manifest, Graph, Governance, and Audit.
 */
export const BUYER_SURFACE_VOCABULARY = {
  /** Graph surface / citations — matches graph page title in buyer shell. */
  evidenceGraph: "Evidence graph",
  /** Sidebar / compact nav — buyer-facing entry label before opening the graph view. */
  evidenceGraphNav: "Evidence graph",
  auditTrail: "Audit trail",
  approvalPath: "Approval path",
  /** Surface term for persisted findings in buyer copy. */
  finding: "Finding",
  phiMinimizationRisk: "PHI minimization risk",
  /** Golden / signed review record artifact in buyer copy — avoid informal “sealed”. */
  signedReviewRecord: "Signed review record",
  finalizedSignedManifestRecord: "Signed review record",
} as const;

/**
 * Canonical `/dashboard` executive summary copy — import here instead of repeating literals so breadcrumbs,
 * metadata, Ask grounding, and KPI cards stay aligned.
 */
export const BUYER_EXECUTIVE_SUMMARY_VOCABULARY = {
  pageTitle: "Executive summary",
  pageLead:
    "Status, risk, ROI impact, and governance readiness for your current workspace — decision-first, with operator detail one click away.",
  roiMetricsSrOnly: "Executive ROI metrics",
  emptyStateTitle: "No committed reviews yet.",
  emptyStateDescription:
    "Run or commit a review to populate executive risk, ROI, and compliance trends.",
  emptyStatePrimaryAction: "Start review",
  emptyStateSecondaryAction: "Upload baseline inventory",
  sampleWorkspaceBannerTitle: "Sample workspace data",
  sampleWorkspaceBannerDescription:
    "Figures below come from the demonstration workspace — not your production inventory.",
  nextActionSectionTitle: "Next action",
  primaryMetricsSectionTitle: "At a glance",
  primaryMetricsSectionSrOnly: "Risk posture, ROI impact, and governance readiness",
  supportingMetricsSectionTitle: "Supporting metrics and trends",
  latestFindingsSectionTitle: "Latest findings and portfolio summary",
  executiveExportsTitle: "Executive exports",
  executiveExportsDescription:
    "Sponsor-ready reports and board views from committed review packages.",
  orphanCandidatesMetric: {
    title: "Unattached resources",
    description: "Resources flagged for cleanup from the latest committed review",
  },
  evidenceRetrievalQualityTitle: "Evidence retrieval quality",
  evidenceRetrievalQualityDescription:
    "How reliably review evidence surfaces the right supporting material",
  costEvidenceStatusMetric: {
    title: "Cost evidence status",
    description: "Whether savings estimates are backed by uploaded spend data",
  },
  costEvidenceNotUploaded: "Not uploaded",
  globalZeroCountsFootnote:
    "Counts are measured for this window. Zero means none recorded — not missing data.",
  resolvedFindings30dMetric: {
    title: "Findings resolved (30 days)",
    description: "Accepted, remediated, or approved in trailing window",
  },
  findingsRemediated30dMetric: {
    title: "Findings remediated (30 days)",
    description: "Disposition workflow evidence in trailing window",
  },
  newlyDiscoveredFindings30dMetric: {
    title: "Findings discovered (30 days)",
    description: "New risks on committed reviews in trailing window",
  },
  staleArchitectureRisksMetric: {
    title: "Stale architecture risks",
    description: "Risk register entries needing revisit",
  },
  expiringWaiversMetric: {
    title: "Waivers expiring (14 days)",
    description: "Active risk exceptions nearing expiration",
  },
  decisionsNeededMetric: {
    title: "Decisions needed",
    description: "Approvals, stale risks, due deferrals, and expiring waivers",
  },
  sqlBackupRegionVerificationMetric: {
    title: "Database backup region check",
    description: "Infrastructure resilience signal from latest deployment plan",
  },
} as const;
