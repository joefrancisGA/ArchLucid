/**
 * Central dictionary for architect-workspace domain terms and reusable UI labels.
 * @see docs/assessments/LATEST.md — simplify abstract nomenclature without hunting literals in components.
 */
import { ARCHITECTURE_DRAFTS_LIST_LABEL, CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import { BUYER_SPONSOR_SUMMARY_VOCABULARY, BUYER_SURFACE_VOCABULARY, BUYER_TERMINOLOGY } from "@/lib/vocabulary/buyer-surface-vocabulary";
import { BUYER_ONBOARDING_PAGE_TITLE } from "@/lib/buyer/buyer-polish-copy";
import { EVIDENCE_TRAIL_SEARCH } from "@/lib/search-surface-disambiguation";

// Canonical definitions live in the dependency-free leaf module `pipeline-status-labels.ts`
// (see rationale there); re-exported here so existing `@/lib/i18n` imports keep working.
export {
  PIPELINE_STATUS_BUYER_DISPLAY_LABELS,
  PIPELINE_STATUS_LABELS,
} from "@/lib/pipeline-status-labels";

export {
  DATA_ARCHIVAL_HEALTH_LABELS,
  POST_COMMIT_INTEGRATION_LINK_TITLES,
  SERVICE_BUS_HEALTH_LABELS,
  WORKSPACE_SETUP_HEALTH_LABELS,
} from "@/lib/operator/operator-health-labels";

export const DOMAIN_TERMS = {
  goldenManifest: "Finalized review record",
  decisionTrace: "Decision Trace",
  policyPack: "Policy Pack",
  policyPackContentDocument: "Policy Pack Content Document",
  findingsSnapshot: "Findings Snapshot",
  artifactBundle: "Deliverables bundle",
  preCommitGate: "Approval check",
  governanceApproval: "Resolve outcomes",
} as const;

export const ARCHITECTURE_REVIEW_LABELS = {
  singular: "Architecture review",
  plural: "Architecture reviews",
  untitled: "Untitled architecture review",
  correlationIdLabel: "Review ID",
  pipelineStatusAriaPrefix: "Architecture review pipeline status",
} as const;

/** `/architecture/reviews` index {@link OperatorPageHeader} title by shell mode (`RunsPageView`). */
export const RUNS_LIST_PAGE_TITLES = {
  buyerPolished: "Reviews",
  fullOperator: "Reviews",
} as const;

/** `/architecture/reviews` index {@link OperatorPageHeader} subtitle (`RunsPageView`). @deprecated Use `REVIEWS_HUB_PAGE_SUBTITLE`. */
export const RUNS_LIST_PAGE_SUBTITLE =
  "Create, refine, evaluate, and approve architecture reviews.";

export const PIPELINE_STATUS_TOOLTIPS = {
  finalized: `The ${DOMAIN_TERMS.goldenManifest} is finalized and the architecture review is complete.`,
  readyToFinalize: "All analysis is complete. Finalize the review to produce a signed, auditable record.",
  inPipeline: "ArchLucid is analyzing your architecture evidence and building findings.",
  starting: "ArchLucid is preparing your architecture review.",
} as const;

export const RUNS_DASHBOARD_LABELS = {
  sectionHeading: ARCHITECTURE_REVIEW_LABELS.plural,
  tabRecent: "Recent",
  tabNeedsAttention: "Needs attention",
  tabMonitoredRisks: "Monitored risks",
  tabOutcomes: "Outcomes",
  latestInWorkspace: "Latest in workspace",
  reviewsNeedingAttention: "Reviews needing attention",
  packagingPreFinalPosture: "Reviews nearing finalization",
  reviewOutcomes: "Review outcomes",
  recentSummary: "Showing the latest architecture reviews for this workspace.",
  attentionSummary: "Reviews with findings awaiting a finalized review record.",
  attentionSummaryBuyer:
    "Architecture reviews still moving toward a finalized review record before sponsor sign-off.",
  noReviewsNeedAttention: "No reviews currently need attention.",
  oneReviewNeedsAttention: "1 review needs attention.",
  reviewsNeedAttentionCount: (count: number) => `${count} reviews need attention.`,
  loadingReviews: "Loading reviews…",
  openFullReviewsList: "Open all reviews",
  governanceWarningTitle: "Review warnings",
  governanceWarningHint: "Unresolved review alerts or policy violations need follow-up.",
  governanceWarningsOnly: "Has review warnings",
  showArchived: "Show archived",
  restoreRequest: "Restore",
  restoringRequest: "Restoring…",
} as const;

export const RUN_PACKAGE_EXPORT_LABELS = {
  docx: "Export to DOCX",
  pdf: "Export to PDF",
  html: "Export to HTML",
} as const;

export const ALERTS_INBOX_LABELS = {
  acknowledgeSelected: "Acknowledge selected",
  acknowledgingSelected: "Acknowledging…",
  archiveAlert: "Archive",
  archivingAlert: "Archiving…",
  selectAlert: "Select alert for bulk acknowledge",
  selectAllOnPage: "Select all alerts on this page",
} as const;

/** Sidebar group headings — single source for `*-nav-group-builder.ts` files. */
export const OPERATOR_NAV_GROUP_LABELS = {
  reviewWork: "Architecture",
  analysis: "Insights",
  governance: "Governance",
  reports: "Reports",
  integrations: "Integrations",
  operations: "Operations",
  help: "Help",
} as const;

/** Primary sidebar link labels — adapt terminology here without editing each nav builder. */
export const OPERATOR_NAV_LINK_LABELS = {
  /** Operator workspace landing (`/`) — left nav label; logo also routes here. */
  home: "Home",
  /** Operator-shell ROI dashboard (`/architecture/sponsor-dashboard`); the standalone sponsor-chrome duplicate was retired (TB-608). */
  portfolioOverview: "Sponsor dashboard",
  SponsorReport: BUYER_SPONSOR_SUMMARY_VOCABULARY.reviewSponsorReportLabel,
  /** Architecture draft inventory (`/architectures`). */
  architectures: ARCHITECTURE_DRAFTS_LIST_LABEL,
  reviewPackage: "Reviews",
  /** Evidence graph (`/insights/evidence-graph`). */
  evidenceGraph: BUYER_SURFACE_VOCABULARY.evidenceGraphNav,
  /** Left nav destination for `/architecture/reviews/new` — creation intake (brief, diagram, document, optional cloud). */
  capture: CREATE_ARCHITECTURE_LABEL,
  /** First review guide (`/architecture/first-review-guide`). */
  onboarding: BUYER_ONBOARDING_PAGE_TITLE,
  findings: "Findings",
  assignedToMeFindings: "Assigned to me",
  riskExceptions: "Exceptions",
  decisionRegister: "Decision register",
  sealedReviewRecords: "Finalized review records",
  recurrenceSchedules: "Recurrence schedules",
  help: "Help",
  /** Baseline settings (`/administration/baseline`) — sidebar short form; the page H1 keeps the "— ROI measurement" qualifier. */
  baselineSettings: "Baseline settings",
  /** Architecture scorecard (`/insights/architecture-scorecard`). */
  scorecard: BUYER_TERMINOLOGY.reviewScorecard,
  alerts: "Alerts",
  alertRules: "Alert rules",
  policyPacks: "Policy packs",
  /** Standards & rules (`/governance/standards-and-rules`). */
  governanceResolution: "Standards & rules",
  governanceWorkflow: "Approval queue",
  auditTrail: BUYER_SURFACE_VOCABULARY.auditTrail,
  governanceSetupGuide: "Approval setup",
  workspaceHealth: "Workspace health",
  securityTrust: "Security & Trust",
  aiUsage: "AI usage",
  /** Internal Operations — buyer-facing nav label (TB-648). */
  knowledgeIndexHealth: "Knowledge index health",
  failedIntegrationMessages: "Failed integration messages",
  teamsNotifications: "Teams notifications",
  itsmConnectors: "Jira & ServiceNow",
  valueReport: "Sponsor report",
  /** Compare two reviews (`/insights/compare-two-reviews`). */
  compareTwoReviews: "Compare two reviews",
  replayReview: "Validate review",
  /** Ask review questions (`/insights/ask-review-questions`). */
  askReview: "Ask review questions",
  /** Search review evidence (`/insights/search-review-evidence`). */
  searchEvidence: EVIDENCE_TRAIL_SEARCH.title,
  architectureAdvisory: "Advisory scans",
  recommendationTuning: "Recommendation learning",
  pilotFeedback: BUYER_TERMINOLOGY.evaluationFeedback,
  planning: "Improvement planning",
  /** Impact preview (`/insights/impact-preview`). */
  evolutionCandidates: "Impact preview",
  pilotValueReport: BUYER_TERMINOLOGY.evaluationValueReport,
  roiReport: "ROI summary",
  /** Connection status (`/administration/connection-status`) — connector health and integration readiness. */
  connectionStatus: "Connection status",
  jira: "Jira",
  azureBoards: "Azure Boards",
  itsm: "ITSM",
  servicenow: "ServiceNow",
  microsoftTeams: "Microsoft Teams",
  slack: "Slack",
  webhooks: "Webhooks",
  /** @deprecated Prefer {@link OPERATOR_NAV_LINK_LABELS.cloudConnections} — Azure-only nav label retained for legacy imports. */
  azureCloudConnection: "Azure cloud connection",
  cloudConnections: "Cloud connections",
  systemHealth: "System health",
  /** Notification preference hub (`/administration/notifications`) TB-2203. */
  notifications: "Notifications",
  digests: "Digests",
  /**
   * Settings hub (`/administration`) — the searchable index, not a leaf page. Named "All settings" so the
   * sidebar row reads distinctly from the `workspaceSettings` leaf below it.
   */
  settings: "All settings",
  workspaceSettings: "Workspace settings",
  /** Users & roles hub (`/administration/users`) — ampersand matches Security & Trust nav spelling. */
  usersAndRoles: "Users & roles",
} as const;

/** Customer-facing copy for `/integrations/cloud-connections`. */
export const CLOUD_CONNECTIONS_PAGE_COPY = {
  lead: "Connect cloud providers for read-only evidence collection, or run evidence-only reviews from briefs, diagrams, documents, and IaC exports.",
  automatedConnectionsSectionHeading: "Connection options",
  azureSectionHeading: "Azure",
  awsSectionHeading: "AWS",
  gcpSectionHeading: "GCP",
} as const;

/** @deprecated Prefer {@link CLOUD_CONNECTIONS_PAGE_COPY} — Azure-only alias retained for legacy imports. */
export const AZURE_CLOUD_CONNECTION_PAGE_COPY = {
  lead: CLOUD_CONNECTIONS_PAGE_COPY.lead,
  connectionSectionHeading: CLOUD_CONNECTIONS_PAGE_COPY.azureSectionHeading,
} as const;
