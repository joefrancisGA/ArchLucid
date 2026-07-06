/**
 * Central dictionary for operator-facing domain terms and reusable UI labels.
 * @see docs/assessments/LATEST.md — simplify abstract nomenclature without hunting literals in components.
 */
import { BUYER_EXECUTIVE_SUMMARY_VOCABULARY, BUYER_SURFACE_VOCABULARY, BUYER_TERMINOLOGY } from "@/lib/buyer-surface-vocabulary";
import { BUYER_ONBOARDING_PAGE_TITLE } from "@/lib/buyer-polish-copy";

// Canonical definitions live in the dependency-free leaf module `pipeline-status-labels.ts`
// (see rationale there); re-exported here so existing `@/lib/i18n` imports keep working.
export {
  PIPELINE_STATUS_BUYER_DISPLAY_LABELS,
  PIPELINE_STATUS_LABELS,
} from "@/lib/pipeline-status-labels";

export const DOMAIN_TERMS = {
  goldenManifest: "Signed review record",
  decisionTrace: "Decision Trace",
  policyPack: "Policy Pack",
  policyPackContentDocument: "Policy Pack Content Document",
  findingsSnapshot: "Findings Snapshot",
  artifactBundle: "Artifact Bundle",
  preCommitGate: "Pre-commit gate",
  governanceApproval: "Governance approval",
} as const;

export const ARCHITECTURE_REVIEW_LABELS = {
  singular: "Architecture review",
  plural: "Architecture reviews",
  untitled: "Untitled architecture review",
  correlationIdLabel: "Review ID",
  pipelineStatusAriaPrefix: "Architecture review pipeline status",
} as const;

/** `/reviews` index {@link OperatorPageHeader} title by shell mode (`RunsPageView`). */
export const RUNS_LIST_PAGE_TITLES = {
  buyerPolished: "Review Packages",
  fullOperator: "Review Packages",
} as const;

/** `/reviews` index {@link OperatorPageHeader} subtitle (`RunsPageView`). */
export const RUNS_LIST_PAGE_SUBTITLE =
  "In-progress, finalized, and export-ready architecture review packages.";

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
  reviewsNeedingAttention: "Review packages needing attention",
  packagingPreFinalPosture: "Packaging and pre-final posture",
  reviewOutcomes: "Review outcomes",
  recentSummary: "Showing the latest review packages for this workspace.",
  attentionSummary: "Review packages with findings awaiting a finalized signed review record.",
  attentionSummaryBuyer:
    "Architecture reviews still moving toward a finalized signed review record before sponsor sign-off.",
  noReviewsNeedAttention: "No review packages currently need attention.",
  oneReviewNeedsAttention: "1 review package needs attention.",
  reviewsNeedAttentionCount: (count: number) => `${count} review packages need attention.`,
  loadingReviews: "Loading review packages…",
  openFullReviewsList: "Open all reviews",
  governanceWarningTitle: "Governance warnings",
  governanceWarningHint: "Unresolved governance alerts or policy violations require governance lead follow-up.",
  governanceWarningsOnly: "Has governance warnings",
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

export const SERVICE_BUS_HEALTH_LABELS = {
  bannerTitle: "Some analysis tasks are delayed",
  bannerBody:
    "Results may take longer than usual. Contact your ArchLucid administrator if this persists.",
  systemHealthLink: "System health",
} as const;

/** Operator-facing data retention health copy — no worker-log or readiness-check jargon (TB-650). */
export const DATA_ARCHIVAL_HEALTH_LABELS = {
  bannerTitle: "Retention history may be incomplete",
  bannerBody:
    "Governance metrics in this workspace may be stale until background retention catches up. Contact your ArchLucid administrator if this persists.",
  systemHealthLink: "System health",
  homeStripLabel: "Retention history",
} as const;

/** Workspace setup health callout on operator home (TB-650). */
export const WORKSPACE_SETUP_HEALTH_LABELS = {
  unknownBody: "Some workspace services are unavailable.",
  attentionBody: "Finish workspace setup before starting reviews.",
  troubleshootingLink: "Open troubleshooting",
  systemHealthLink: "system health",
} as const;

/** Post-commit retention rail integration link tooltips (TB-650). */
export const POST_COMMIT_INTEGRATION_LINK_TITLES = {
  mutate: "Connection status and integration health",
  readOnly: "View connection status (read-only at your rank)",
} as const;

/** Sidebar group headings — single source for `*-nav-group-builder.ts` files. */
export const OPERATOR_NAV_GROUP_LABELS = {
  reviewWork: "Architecture",
  analysis: "Insights",
  governance: "Governance",
  reports: "Reports",
  integrations: "Integrations",
  operations: "Operations",
  architectPrograms: "Programs",
} as const;

/** Primary sidebar link labels — adapt terminology here without editing each nav builder. */
export const OPERATOR_NAV_LINK_LABELS = {
  /** Operator workspace landing (`/`) — left nav label; logo also routes here. */
  home: "Overview",
  /** Operator-shell ROI dashboard (`/dashboard`); the standalone executive-chrome duplicate was retired (TB-608). */
  portfolioOverview: "Executive dashboard",
  executiveSummary: BUYER_EXECUTIVE_SUMMARY_VOCABULARY.pageTitle,
  reviewPackage: "Review packages",
  evidenceTrail: BUYER_SURFACE_VOCABULARY.evidenceGraphNav,
  /** Left nav destination for `/reviews/new` — distinct from hero/quick-action "Start review". */
  capture: "New review",
  onboarding: BUYER_ONBOARDING_PAGE_TITLE,
  findings: "Risk register",
  riskExceptions: "Risk exceptions",
  decisionRegister: "Decision register",
  recurrenceSchedules: "Recurrence schedules",
  help: "Help",
  pilotBaselines: "ROI baselines",
  scorecard: BUYER_TERMINOLOGY.reviewScorecard,
  alerts: "Alerts",
  policyPacks: "Policy packs",
  governanceResolution: "Standards & rules",
  governanceWorkflow: "Approval queue",
  auditTrail: BUYER_SURFACE_VOCABULARY.auditTrail,
  governanceSetupGuide: "Governance setup guide",
  securityTrust: "Security & trust",
  aiUsage: "AI usage",
  /** Internal Operations — buyer-facing nav label (TB-648). */
  knowledgeIndexHealth: "Knowledge index health",
  failedIntegrationMessages: "Failed integration messages",
  teamsNotifications: "Teams notifications",
  itsmConnectors: "Jira & ServiceNow",
  valueReport: "Value report",
  compareTwoReviews: "Compare two reviews",
  replayReview: "Validate review package",
  askReview: "Ask review questions",
  searchEvidence: "Search review evidence",
  architectureAdvisory: "Advisory scans",
  recommendationTuning: "Recommendation tuning",
  pilotFeedback: BUYER_TERMINOLOGY.evaluationFeedback,
  planning: "Planning",
  evolutionCandidates: "Impact preview",
  pilotValueReport: BUYER_TERMINOLOGY.evaluationValueReport,
  roiReport: "ROI report",
  connectorOperations: "Integration readiness",
  integrationReadiness: "Connection status",
  jira: "Jira",
  itsm: "ITSM",
  servicenow: "ServiceNow",
  microsoftTeams: "Microsoft Teams",
  slack: "Slack",
  webhooks: "Webhooks",
  /** @deprecated Prefer {@link OPERATOR_NAV_LINK_LABELS.cloudConnections} — Azure-only nav label retained for legacy imports. */
  azureCloudConnection: "Azure cloud connection",
  cloudConnections: "Cloud connections",
  systemHealth: "System health",
  digests: "Digests",
  /** Administration nav — `/settings/tenant` (customer-facing; route keeps tenant segment). */
  settings: "Settings",
  workspaceSettings: "Workspace settings",
} as const;

/** Customer-facing copy for `/integrations/cloud-connections`. */
export const CLOUD_CONNECTIONS_PAGE_COPY = {
  lead:
    "Cloud connections are optional. Connect Azure, AWS, or GCP for scheduled read-only evidence collection, or create reviews from briefs, diagrams, documents, and uploaded ZIPs alone.",
  automatedConnectionsSectionHeading: "Automated connections",
  azureSectionHeading: "Azure",
  awsSectionHeading: "AWS",
  gcpSectionHeading: "GCP",
} as const;

/** @deprecated Prefer {@link CLOUD_CONNECTIONS_PAGE_COPY} — Azure-only alias retained for legacy imports. */
export const AZURE_CLOUD_CONNECTION_PAGE_COPY = {
  lead: CLOUD_CONNECTIONS_PAGE_COPY.lead,
  connectionSectionHeading: CLOUD_CONNECTIONS_PAGE_COPY.azureSectionHeading,
} as const;
