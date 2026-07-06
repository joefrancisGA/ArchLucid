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
 * Buyer-facing replacements for legacy pilot/internal product language.
 *
 * "evaluation" SCOPING RULE (TB-456/457/458, COPY_TERMINOLOGY_AUDIT §2): the word "evaluation" is banned
 * only as a PRODUCT-STATUS adjective (it must not imply ArchLucid is pre-release / in evaluation). Hence
 * these symbols render "Review …", never "Evaluation …". It remains intentionally ALLOWED as the BUYER's
 * activity on marketing entry CTAs (signup / try / hero — e.g. "Start an evaluation"), where it reads as a
 * respectful expert assessment rather than a sales "free trial". Do not introduce NEW "evaluation workspace"
 * phrasing (a few legacy usages remain in pricing/demo copy, flagged for cleanup in COPY_TERMINOLOGY_AUDIT §2).
 */
export const BUYER_TERMINOLOGY = {
  evaluationFeedback: "Review feedback",
  evaluationValueReport: "Review value report",
  reviewScorecard: "Review scorecard",
  governanceDashboard: "Governance dashboard",
  portfolioOverview: "Executive dashboard",
} as const;

/** `/product-learning` — pilot feedback dashboard copy (58R/59R surfaces). */
export const PILOT_FEEDBACK_VOCABULARY = {
  pageLead:
    "Track feedback on review outputs and identify recurring improvement opportunities.",
  emptyStateTitle: "No feedback recorded yet",
  emptyStateDescription:
    "Feedback from pilots and review evaluations will appear here after users accept, reject, revise, or comment on review outputs.",
  emptyStatePrimaryAction: "Open review packages",
  emptyStateSecondaryAction: "Start review",
  summaryKpiFeedbackSummaries: "Feedback summaries",
  summaryKpiRepeatedIssues: "Repeated issues",
  summaryKpiImprovementOpportunities: "Improvement opportunities",
  summaryKpiItemsNeedingReview: "Items needing review",
  summaryNotesHeading: "How to read these numbers",
  feedbackByAreaHeading: "Feedback by review area",
  feedbackByAreaLead:
    "Counts per review area — trusted acceptance versus revisions, rejections, and follow-ups.",
  topImprovementOpportunitiesHeading: "Top improvement opportunities",
  itemsNeedingReviewHeading: "Items needing review",
  itemsNeedingReviewLead:
    "Ranked follow-ups from improvement opportunities and repeated feedback themes.",
  exportSectionHeading: "Export",
  exportSectionLead:
    "Download a summary for architecture or product review. Raw comments are omitted.",
  layerContextLine:
    "Track pilot feedback, recurring issues, and improvement opportunities.",
} as const;

/**
 * Canonical `/dashboard` executive summary copy — import here instead of repeating literals so breadcrumbs,
 * metadata, Ask grounding, and KPI cards stay aligned.
 */
export const BUYER_EXECUTIVE_SUMMARY_VOCABULARY = {
  pageTitle: "Executive summary",
  /** `/dashboard` portfolio surface — aligns with sidebar “Executive dashboard”. */
  portfolioPageTitle: "Executive dashboard",
  portfolioPageLead:
    "Track governance posture, remediation progress, estimated ROI, and sponsor-ready proof across committed review packages.",
  portfolioPageNextStep: "Finalize at least one review package to populate dashboard metrics.",
  portfolioPageLearnMoreHref: "/help/executive-summary",
  portfolioPageLearnMoreLabel: "Open dashboard guide",
  pageLead:
    "Status, risk, ROI impact, and governance readiness for your current workspace — decision-first, with operator detail one click away.",
  roiMetricsSrOnly: "Executive ROI metrics",
  emptyStateTitle: "No committed reviews yet.",
  emptyStateDescription: "Finalize a review package to populate dashboard metrics.",
  emptyStatePrimaryAction: "Start review",
  emptyStateSecondaryAction: "Load sample workspace",
  emptyStateTertiaryAction: "View sample portfolio dashboard",
  emptyStatePreviewSectionTitle: "What this dashboard will show",
  emptyStatePreviewBullets: [
    "Findings discovered and resolved",
    "Decisions and waivers",
    "Stale architecture risks",
    "Estimated savings",
    "Compliance drift trends",
    "Sponsor-ready exports",
  ] as const,
  scorecardLayerContextLine: "Value metrics and recommended actions.",
  scorecardPageTitle: "Executive scorecard",
  scorecardEmptyStateDescription:
    "The scorecard appears after at least one review package is finalized. It summarizes review volume, findings, estimated hours saved, compliance drift, and recommended actions.",
  scorecardEmptyStatePrimaryAction: "Start review",
  scorecardEmptyStateSecondaryAction: "Load sample workspace",
  scorecardEmptyStateTertiaryAction: "Open sample scorecard",
  scorecardEmptyStatePreviewSectionTitle: "What this scorecard will show",
  scorecardEmptyStatePreviewBullets: [
    "Architecture reviews completed",
    "Findings generated",
    "Estimated hours saved",
    "Compliance drift activity",
    "Recommended actions",
  ] as const,
  portfolioMetricsUnavailableTitle: "Portfolio metrics unavailable",
  portfolioMetricsUnavailableDescription:
    "Finalize a review package to populate findings, decisions, waivers, risks, and remediation trends.",
  estimatedSavingsNotAvailableYet: "Not available yet",
  estimatedSavingsNotAvailableFootnote:
    "Commit reviews or add cost evidence to estimate savings.",
  costEvidenceNotConfigured: "Cost baseline not configured",
  costEvidenceNotConfiguredFootnote:
    "Add cost evidence (Azure, AWS, or GCP spend data) to estimate savings and ROI.",
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
    description:
      "ArchLucid platform database backup region — verified against Terraform CI. Shows where ArchLucid stores your workspace data.",
    platformScopeNote: "ArchLucid platform infrastructure — not your architecture workloads.",
  },
} as const;
