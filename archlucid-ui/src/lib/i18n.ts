/**
 * Central dictionary for operator-facing domain terms and reusable UI labels.
 * @see docs/assessments/LATEST.md — simplify abstract nomenclature without hunting literals in components.
 */
export const DOMAIN_TERMS = {
  goldenManifest: "Golden Manifest",
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

export const PIPELINE_STATUS_LABELS = {
  finalized: "Finalized",
  readyToFinalize: "Ready to finalize",
  inPipeline: "In pipeline",
  starting: "Starting",
  packageFinalized: "Package finalized",
  readyToSeal: "Ready to seal",
  inFlight: "In flight",
} as const;

export const PIPELINE_STATUS_TOOLTIPS = {
  finalized: `The ${DOMAIN_TERMS.goldenManifest} has been committed and the architecture review is sealed.`,
  readyToFinalize: `All analysis is complete. An operator must review and commit the ${DOMAIN_TERMS.goldenManifest}.`,
  inPipeline: "The architecture graph and context have been extracted, and analysis is currently running.",
  starting: "The architecture request has been received and the execution pipeline is initializing.",
} as const;

export const RUNS_DASHBOARD_LABELS = {
  sectionHeading: ARCHITECTURE_REVIEW_LABELS.plural,
  tabRecent: "Recent",
  tabNeedsAttention: "Needs attention",
  tabMonitoredRisks: "Monitored risks",
  tabOutcomes: "Outcomes",
  latestInWorkspace: "Latest in workspace",
  reviewsNeedingAttention: "Reviews needing attention",
  packagingPreFinalPosture: "Packaging and pre-final posture",
  reviewOutcomes: "Review outcomes",
  recentSummary: "Showing the latest reviews for this workspace.",
  attentionSummary: "Reviews with findings awaiting a finalized manifest.",
  attentionSummaryBuyer:
    "Architecture reviews still moving toward a finalized signed manifest before sponsor sign-off.",
  noReviewsNeedAttention: "No reviews currently need attention.",
  oneReviewNeedsAttention: "1 review needs attention.",
  reviewsNeedAttentionCount: (count: number) => `${count} reviews need attention.`,
  loadingReviews: "Loading reviews…",
  openFullReviewsList: "Open full reviews list",
  governanceWarningTitle: "Governance warnings",
  governanceWarningHint: "Unresolved governance alerts or policy violations require operator follow-up.",
  governanceWarningsOnly: "Has governance warnings",
  showArchived: "Show archived",
  restoreRequest: "Restore",
  restoringRequest: "Restoring…",
  archivedListUnsupported:
    "Archived requests are not returned by the runs list yet. When the API adds isArchived or includeArchived, rows will appear here.",
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
  bannerTitle: "Azure Service Bus messaging is degraded",
  bannerBody:
    "Background jobs and integration events may be delayed or failing. Review worker logs and open System health for the azure_service_bus readiness check.",
  systemHealthLink: "System health",
} as const;
