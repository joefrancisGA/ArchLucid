/**
 * Short, sober copy for Enterprise Controls context (nav, key pages, and selected empty-state / card-description strings).
 * Aligned with docs/OPERATOR_DECISION_GUIDE.md (default rule, §2 “Move to Enterprise Controls”) and
 * docs/COMMERCIAL_BOUNDARY_HARDENING_SEQUENCE.md (Stage 1 — role clarity without commercializing the wedge).
 * Keep wording responsibility-based, not permission-jargon.
 *
 * **Rank pairing:** several `*Reader*` / `*Operator*` pairs are chosen in pages via `useOperateCapability()` or
 * `useNavCallerAuthorityRank()` vs `AUTHORITY_RANK.ExecuteAuthority` — keep thresholds aligned with `nav-authority.ts`.
 */

/**
 * Shared one-liner under alert-tooling “Change configuration” sections — replaces repeating “Configuration surface…”
 * on every page (`alert-rules`, `alert-routing`, `alert-tuning`, `composite-alert-rules`).
 */

export const enterpriseMutationControlDisabledTitle =
  "Requires elevated permissions in this workspace; the API still enforces every write.";


export const enterpriseNavHintReaderRank = "";


export const enterpriseNavHintOperatorRank = "";


export const layerHeaderEnterpriseReaderRankLine = "Governance controls — inspect view.";


export const layerHeaderEnterpriseOperatorRankLine =
  "Governance controls record who submitted, reviewed, and approved architecture reviews in this workspace.";


export const enterpriseExecutePageHintReaderRank = "Writes need elevated permissions in this workspace.";


export const governanceResolutionRankReaderLine =
  "Policy pack and workflow changes require architect permission.";


export const governanceResolutionRankOperatorLine =
  "Change pack order on Policy packs or Governance workflo — ot on this page.";


const governanceResolutionPageLead =
  "See which governance packs, controls, and workflow rules are currently effective for this workspace. Use this page to diagnose policy conflicts, precedence, and generated governance decisions.";


export const governanceResolutionPageLeadOperator = governanceResolutionPageLead;


export const governanceResolutionPageLeadReader = governanceResolutionPageLead;


export const governanceResolutionRefreshButtonTitle = "Reload effective policy for this scope.";


export const governanceResolutionEffectivePolicyHeadingOperator = "Effective policy";


export const governanceResolutionEffectivePolicyHeadingReader = "Effective policy (inspect)";


export const governanceResolutionResolutionDetailsHeadingOperator = "Resolution details";


export const governanceResolutionResolutionDetailsHeadingReader = "Resolution details (inspect)";


export const governanceResolutionRawOutputAccordionLabel = "Raw resolution output";


export const governanceResolutionRefreshPolicySectionHeading = "Refresh policy resolution";


export const governanceResolutionChangeRelatedControlsLead =
  "Refresh the effective policy after changing policy packs or governance workflow settings.";


export const governanceResolutionChangeRelatedControlsReaderSupplement =
  "Changing policy packs or workflow settings requires elevated permissions.";


export const governanceDashboardReaderActionLine = "Read-only queue until an architect can act in this workspace.";


export const governanceDashboardApproveSelectedButtonLabelReaderRank = "Approve selected (architect permission)";


export const governanceDashboardRejectSelectedButtonLabelReaderRank = "Reject selected (architect permission)";


export const governanceDashboardPendingApprovalsHeadingOperator = "Pending approvals";


export const governanceDashboardPendingApprovalsHeadingReader = "Pending approvals (inspect)";


export const governanceDashboardRecentDecisionsHeadingOperator = "Recent decisions";


export const governanceDashboardRecentDecisionsHeadingReader = "Recent decisions (inspect)";


export const governanceDashboardComplianceDriftHeadingOperator = "Compliance drift trend (last 30 days)";


export const governanceDashboardComplianceDriftHeadingReader =
  "Compliance drift trend (last 30 days) (inspect)";


export const governanceDashboardChangeLogHeadingOperator = "Policy pack change log";


export const governanceDashboardChangeLogHeadingReader = "Policy pack change log (inspect)";


export const governanceDashboardLineageLinkTitle = "Read-only approval and review lineage (GET).";


export const governanceDashboardOpenWorkflowReviewTitleOperator =
  "Open governance workflow for this review to continue governance release steps.";


export const governanceDashboardOpenWorkflowReviewTitleReader =
  "Open workflow for inspection; approve or reject actions need elevated permissions in this workspace.";


export const governanceWorkflowPageLeadOperator =
  "Submit finalized architecture outputs for governance review. Load a review to see approval status and the full approval trail.";


export const governanceWorkflowPageLeadReader =
  "Inspect how an architecture review moved through approval. Load a review below to view its approval history.";


export const governanceWorkflowSubmitCardTitleOperator = "Submit for governance approval";


export const governanceWorkflowSubmitCardTitleReader = "Submit for governance approval";


export const governanceWorkflowApprovalRequestsCardTitleOperator = "Approval requests for this review";


export const governanceWorkflowApprovalRequestsCardTitleReader = "Approval requests for this review";


export const governanceWorkflowPromotionsActivationsHeadingOperator = "Governance activity";


export const governanceWorkflowPromotionsActivationsHeadingReader = "Governance activity";


export const governanceWorkflowActivationsSubheadingOperator = "Deployment releases";


export const governanceWorkflowActivationsSubheadingReader = "Deployment releases";


export const governanceWorkflowRefreshRunDataTitle =
  "Reload approval requests and governance activity for the loaded review.";


export const governanceWorkflowRefreshRunDataButtonLabel = "Refresh data";


export const governanceWorkflowPendingReviewReaderNote =
  "Review actions need elevated access on the server — this form is preview only at your current role.";


export const governanceWorkflowPendingReviewReaderNoteBuyerPolished =
  "Authorized roles record approval decisions here. Requesters cannot approve their own reviews (segregation of duties).";


export const governanceDashboardPendingClearReaderSupplement =
  "Batch and row actions stay disabled here until elevated access applies (API).";


export const governanceWorkflowQueryCardDescriptionReader =
  "Load a review to see its approval requests. Approving, releasing to environment, and activating require approver rights on your account.";


export const governanceWorkflowQueryCardDescriptionBuyerPolished =
  "The sample below shows a completed approval trail for the Claims Intake review. In production, choose a review to load its workflow history; approving and activating follow your organization’s role policy.";


export const governanceWorkflowQueryCardDescriptionOperator =
  "Pick a review, then load its approval requests. Approve or reject submitted requests, release approved architecture snapshots to the target environment, and activate when ready.";


export const governanceWorkflowNoApprovalsReaderHint =
  "No open approval rows for this review. Try another review, or ask an architect to submit a request.";


export const governanceWorkflowNoApprovalsOperatorHint =
  "Submit a request above or choose a different review.";


export const governanceWorkflowSubmitForApprovalButtonLabelReaderRank = "Submit for governance approval";


export const governanceWorkflowReviewSubmitButtonLabelReaderRank = "Submit review (needs approver rights)";


export const governanceWorkflowApproveButtonLabelReaderRank = "Approve (needs approver rights)";


export const governanceWorkflowRejectButtonLabelReaderRank = "Reject (needs approver rights)";


export const governanceWorkflowPromoteButtonLabelReaderRank =
  "Release to environment (needs approver rights)";


export const governanceWorkflowActivateButtonLabelReaderRank = "Activate (needs approver rights)";


export const governanceWorkflowPromotionsActivationsSectionLeadOperator =
  "Release approved rows to the target environment, then activate when ready.";


export const governanceWorkflowPromotionsActivationsSectionLeadReader =
  "Read-only timeline; Release to environment and Activate require approver rights (API).";


export const governanceWorkflowOutcomeBannerLine =
  "Tracks approvals for finalized architecture reviews. Outcomes are recorded in the audit trail.";


export const governanceWorkflowSubmitCardDescriptionReader =
  "Submitting requests requires approver rights in this workspace. You can still review the workflow below.";


export const governanceWorkflowPromotionsEmptyReaderHint =
  "None yet. Rows appear after an architect releases an approved request to the target environment.";


export const governanceWorkflowPromotionsEmptyOperatorHint =
  "Release an approved request to the target environment to see rows here.";


export const governanceWorkflowActivationsEmptyReaderHint =
  "None yet. Appear after an architect activates a governance release; inspect-only at your rank.";


export const governanceWorkflowActivationsEmptyOperatorHint =
  "Use Activate on a governance release card after releases exist.";

