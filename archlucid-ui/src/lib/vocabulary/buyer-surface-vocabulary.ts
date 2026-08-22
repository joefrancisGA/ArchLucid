/**
 * Canonical labels for buyer-polished surfaces — keeps “evidence graph”, “audit trail”,
 * and “approval path” consistent across Review, Manifest, Graph, Governance, and Audit.
 */
import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import { BUYER_START_ARCHITECTURE_REVIEW_CTA } from "@/lib/buyer/buyer-polish-copy";
import { REVIEW_SCORECARD_SAMPLE_HREF } from "@/lib/review-scorecard-empty-state";

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
  /** Golden / finalized review record artifact in buyer copy — use finalized, not signed. */
  sealedReviewRecord: "Finalized review record",
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
  evaluationValueReport: "Pilot outcomes",
  reviewScorecard: "Architecture scorecard",
  governanceDashboard: "Governance dashboard",
  portfolioOverview: "Sponsor dashboard",
} as const;

/** `/internal/product-learning` — pilot feedback dashboard copy (58R/59R surfaces). */
export const PILOT_FEEDBACK_VOCABULARY = {
  pageLead:
    "Track feedback on review outputs and identify recurring improvement opportunities.",
  emptyStateTitle: "No feedback recorded yet",
  emptyStateDescription:
    "Feedback from pilots and review evaluations will appear here after users accept, reject, revise, or comment on review outputs.",
  emptyStatePrimaryAction: "Open reviews",
  emptyStateSecondaryAction: CREATE_ARCHITECTURE_LABEL,
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
 * Canonical `/dashboard` sponsor report copy — import here instead of repeating literals so breadcrumbs,
 * metadata, Ask grounding, and KPI cards stay aligned.
 */
export const BUYER_SPONSOR_SUMMARY_VOCABULARY = {
  /** Canonical `/dashboard` customer noun — matches sidebar “Sponsor dashboard”. */
  pageTitle: "Sponsor dashboard",
  portfolioPageTitle: "Sponsor dashboard",
  /** Review-scoped sponsor briefing (showcase spine, Ask grounding) — not the portfolio dashboard. */
  reviewSponsorReportLabel: "Sponsor report",
  portfolioPageLead:
    "Track approval status, open findings, estimated ROI, and export-ready summaries across finalized reviews.",
  portfolioPageNextStep: "Finalize at least one review to populate dashboard metrics.",
  portfolioPageLearnMoreHref: "/help/sponsor-report",
  portfolioPageLearnMoreLabel: "View dashboard guide",
  howItWorksSectionTitle: "How this dashboard works",
  howItWorksDescription:
    "Create a review from your architecture evidence, then finalize it when findings are ready for sponsor reporting. Metrics and sponsor exports populate after the first finalized review.",
  pageLead:
    "Status, risk, ROI impact, and export readiness for your current workspace — decision-first, with operator detail one click away.",
  roiMetricsSrOnly: "Sponsor ROI metrics",
  emptyStateTitle: "No finalized reviews yet",
  emptyStateDescription:
    "Finalize a review to populate sponsor metrics, remediation progress, ROI estimates, and export-ready outputs.",
  emptyStatePrimaryAction: BUYER_START_ARCHITECTURE_REVIEW_CTA,
  emptyStateSecondaryAction: "Load sample dashboard",
  emptyStateSecondaryHelper: "Populate this workspace with sample review data.",
  emptyStateTertiaryAction: "Open reviews",
  metricsPreviewSectionTitle: "At a glance",
  metricsPreviewUnavailableFootnote: "Available after first finalized review",
  metricsPreviewCards: [
    {
      title: "Findings resolved",
      description: "Accepted, remediated, or approved findings from finalized reviews",
    },
    {
      title: "Open architecture risks",
      description: "Stale risks and expiring waivers needing sponsor attention",
    },
    {
      title: "Decisions recorded",
      description: "Approvals, deferrals, and governance outcomes",
    },
    {
      title: "Estimated savings",
      description: "Directional portfolio impact from finalized review evidence",
    },
    {
      title: "Compliance drift",
      description: "Policy pack change activity across finalized reviews",
    },
    {
      title: "Sponsor exports",
      description: "Scorecard, value report, and board-ready narratives",
    },
  ] as const,
  emptyStatePreviewSectionTitle: "What this dashboard will show",
  emptyStatePreviewBullets: [
    "Findings discovered and resolved",
    "Decisions and waivers",
    "Stale architecture risks",
    "Estimated savings",
    "Compliance drift trends",
    "Export-ready outputs",
  ] as const,
  scorecardLayerContextLine: "Value metrics and recommended actions.",
  scorecardPageTitle: "Sponsor scorecard",
  scorecardEmptyStateDescription:
    "The scorecard appears after at least one review is finalized. It summarizes review volume, findings, estimated hours saved, compliance drift, and recommended actions.",
  scorecardEmptyStatePrimaryAction: CREATE_ARCHITECTURE_LABEL,
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
    "Finalize a review to populate findings, decisions, waivers, risks, and remediation trends.",
  estimatedSavingsNotAvailableYet: "Not available yet",
  estimatedSavingsNotAvailableFootnote:
    "Finalize reviews or add cost evidence to estimate savings.",
  costEvidenceNotConfigured: "Cost baseline not configured",
  costEvidenceNotConfiguredFootnote:
    "Add cost evidence (Azure, AWS, or GCP spend data) to estimate savings and ROI.",
  sampleWorkspaceBannerTitle: "Sample workspace data",
  sampleWorkspaceBannerDescription:
    "Figures below come from the demonstration workspace — not your production inventory.",
  nextActionSectionTitle: "Next action",
  nextActionLinkLabel: "Take action",
  primaryMetricsSectionTitle: "At a glance",
  primaryMetricsSectionSrOnly: "Risk posture, ROI impact, and export readiness",
  supportingMetricsSectionTitle: "Supporting metrics and trends",
  latestFindingsSectionTitle: "Latest findings and portfolio summary",
  executiveExportsTitle: "Sponsor exports",
  executiveExportsDescription:
    "Export-ready reports and board views from finalized reviews.",
  sponsorExportsUnavailableFootnote: "Available after first finalized review",
  sponsorExportsPreviewSampleAction: "Preview sample",
  sponsorExportsScorecardTitle: "Sponsor scorecard",
  sponsorExportsScorecardDescription: "KPI summary and recommended actions for sponsor briefings.",
  sponsorExportsScorecardAction: "Open scorecard",
  sponsorExportsScorecardSampleHref: REVIEW_SCORECARD_SAMPLE_HREF,
  sponsorExportsPilotValueTitle: "Pilot value report",
  sponsorExportsPilotValueDescription: "Quantified outcomes and improvement themes from finalized reviews.",
  sponsorExportsPilotValueAction: "Open value report",
  sponsorExportsPilotValueSampleHref: "/insights/sponsor-report",
  sponsorExportsRoiTitle: "ROI methodology",
  sponsorExportsRoiDescription: "How savings and ROI estimates are derived from review evidence.",
  sponsorExportsRoiAction: "View methodology",
  sponsorExportsDocxTitle: "Sponsor review (DOCX)",
  sponsorExportsDocxDescription: "Board-ready narrative export from a finalized review.",
  sponsorExportsDocxAction: "Download DOCX",
  baselineInventoryUploadAction: "Upload baseline inventory",
  baselineInventorySectionTitle: "Improve ROI estimates",
  baselineInventorySectionDescription:
    "Upload a baseline inventory when you want ROI estimates to reflect your current environment.",
  orphanCandidatesMetric: {
    title: "Unattached resources",
    description: "Resources flagged for cleanup from the latest finalized review",
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
    description: "New risks on finalized reviews in trailing window",
  },
  staleArchitectureRisksMetric: {
    title: "Stale architecture risks",
    description: "Findings needing revisit",
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
