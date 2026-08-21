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
export const alertToolingConfigureSectionSubline = "Configure alert rules and routing — write actions require elevated permissions.";

/** Alert tooling — configure block **`h3`** (`alert-rules`, `alert-routing`, `composite-alert-rules`; tuning uses operator string only). */
export const alertToolingChangeConfigurationHeadingOperator = "Change configuration";

export const alertToolingChangeConfigurationHeadingReader = "Change configuration (elevated permissions)";

/** `title` on mutation controls the UI soft-disables for Reader-tier principals (API remains authoritative). */
export const enterpriseMutationControlDisabledTitle =
  "Requires elevated permissions in this workspace; the API still enforces every write.";

/**
 * Audit CSV export uses **`RequireAuditor`** on the API (Auditor **or** Admin)—stricter than Execute-tier pack
 * mutations; align the Export button with **`/me` role claims**, not `useOperateCapability`.
 */
export const auditExportControlDisabledTitle =
  "Available to authorized audit users in this workspace; adjust date filters or roles if export stays unavailable.";

/**
 * Sidebar / mobile: optional micro-copy under the Governance nav group.
 * Empty for all ranks — labels alone carry the section; page cues stay on-route.
 */
export const enterpriseNavHintReaderRank = "";

/** Same omit policy as {@link enterpriseNavHintReaderRank} (kept for rank-pairing call sites). */
export const enterpriseNavHintOperatorRank = "";

/**
 * `LayerHeader` rank-aware line under `enterpriseFootnote` on Enterprise Controls pages (same threshold as nav hints:
 * below Execute → reader framing).
 */
export const layerHeaderEnterpriseReaderRankLine = "Governance controls — inspect view.";

export const layerHeaderEnterpriseOperatorRankLine =
  "Governance controls record who submitted, reviewed, and approved architecture reviews in this workspace.";

/** Deep execute tooling: only when resolved rank is below Execute (e.g. Reader deep-linked) */
export const enterpriseExecutePageHintReaderRank = "Writes need elevated permissions in this workspace.";

/** Second line on policy resolution — readers vs operators (see `GovernanceResolutionRankCue`). */
export const governanceResolutionRankReaderLine =
  "Policy pack and workflow changes require architect permission.";

export const governanceResolutionRankOperatorLine =
  "Change pack order on Policy packs or Governance workflow—not on this page.";

const governanceResolutionPageLead =
  "See which governance packs, controls, and workflow rules are currently effective for this workspace. Use this page to diagnose policy conflicts, precedence, and generated governance decisions.";

/** Policy resolution — lead under page title (`governance-resolution/page.tsx`), before rank cue. */
export const governanceResolutionPageLeadOperator = governanceResolutionPageLead;

export const governanceResolutionPageLeadReader = governanceResolutionPageLead;

/** Policy resolution — refresh action (always enabled at any shell rank). */
export const governanceResolutionRefreshButtonTitle = "Reload effective policy for this scope.";

/** Policy resolution — primary inspect sections (`governance-resolution/page.tsx`). */
export const governanceResolutionEffectivePolicyHeadingOperator = "Effective policy";

export const governanceResolutionEffectivePolicyHeadingReader = "Effective policy (inspect)";

export const governanceResolutionResolutionDetailsHeadingOperator = "Resolution details";

export const governanceResolutionResolutionDetailsHeadingReader = "Resolution details (inspect)";

/** Policy resolution — raw JSON disclosure label (`AdvancedOptionsAccordion` trigger). */
export const governanceResolutionRawOutputAccordionLabel = "Raw resolution output";

/** Policy resolution — refresh strip heading (LayerHeader + rank cue already frame read vs write). */
export const governanceResolutionRefreshPolicySectionHeading = "Refresh policy resolution";

export const governanceResolutionChangeRelatedControlsLead =
  "Refresh the effective policy after changing policy packs or governance workflow settings.";

/**
 * Policy resolution — extra line under **Refresh policy resolution** when **`useOperateCapability()`** is
 * false (writes live on Policy packs and Governance workflow).
 */
export const governanceResolutionChangeRelatedControlsReaderSupplement =
  "Changing policy packs or workflow settings requires elevated permissions.";

/** Governance dashboard: readers can consume signals; in-product actions still need execute on the API. */
export const governanceDashboardReaderActionLine = "Read-only queue until an architect can act in this workspace.";

/** Governance dashboard — batch bar when rank cannot mutate (`governance/dashboard/page.tsx`). */
export const governanceDashboardApproveSelectedButtonLabelReaderRank = "Approve selected (architect permission)";

export const governanceDashboardRejectSelectedButtonLabelReaderRank = "Reject selected (architect permission)";

/** Governance dashboard — pending queue heading (`governance/dashboard/page.tsx`). */
export const governanceDashboardPendingApprovalsHeadingOperator = "Pending approvals";

export const governanceDashboardPendingApprovalsHeadingReader = "Pending approvals (inspect)";

/** Governance dashboard — signal sections above the pending queue (`governance/dashboard/page.tsx`). */
export const governanceDashboardRecentDecisionsHeadingOperator = "Recent decisions";

export const governanceDashboardRecentDecisionsHeadingReader = "Recent decisions (inspect)";

export const governanceDashboardComplianceDriftHeadingOperator = "Compliance drift trend (last 30 days)";

export const governanceDashboardComplianceDriftHeadingReader =
  "Compliance drift trend (last 30 days) (inspect)";

export const governanceDashboardChangeLogHeadingOperator = "Policy pack change log";

export const governanceDashboardChangeLogHeadingReader = "Policy pack change log (inspect)";

/** Governance dashboard — **Lineage** link on pending cards (GET detail). */
export const governanceDashboardLineageLinkTitle = "Read-only approval and review lineage (GET).";

/** Governance dashboard — **Review** opens workflow for the review (`governance/dashboard/page.tsx`). */
export const governanceDashboardOpenWorkflowReviewTitleOperator =
  "Open resolve outcomes for this review to continue approval release steps.";

export const governanceDashboardOpenWorkflowReviewTitleReader =
  "Open workflow for inspection; approve or reject actions need elevated permissions in this workspace.";

/** Governance workflow — lead under page title when caller can mutate (Execute+ in shell). */
export const governanceWorkflowPageLeadOperator =
  "Submit finalized architecture outputs for governance review. Load a review to see approval status and the full approval trail.";

/** Governance workflow — lead under page title for read tier (inspect-first layout already elevates Load). */
export const governanceWorkflowPageLeadReader =
  "Inspect how an architecture review moved through approval. Load a review below to view its approval history.";

/** Governance workflow — submit card title (`governance/page.tsx`). */
export const governanceWorkflowSubmitCardTitleOperator = "Submit for governance approval";

export const governanceWorkflowSubmitCardTitleReader = "Submit for governance approval";

/** Governance workflow — load and list card title. */
export const governanceWorkflowApprovalRequestsCardTitleOperator = "Approval requests for this review";

export const governanceWorkflowApprovalRequestsCardTitleReader = "Approval requests for this review";

/** Governance workflow — promotions + activations section (`governance/page.tsx`). */
export const governanceWorkflowPromotionsActivationsHeadingOperator = "Governance activity";

export const governanceWorkflowPromotionsActivationsHeadingReader = "Governance activity";

/** Governance workflow — activations list under promotions. */
export const governanceWorkflowActivationsSubheadingOperator = "Deployment releases";

export const governanceWorkflowActivationsSubheadingReader = "Deployment releases";

/** Governance workflow — reload lists for the active review (`GET`); shown next to **Load** after a review is selected. */
export const governanceWorkflowRefreshRunDataTitle =
  "Reload approval requests and governance activity for the loaded review.";

export const governanceWorkflowRefreshRunDataButtonLabel = "Refresh data";

/** Alerts triage dialog — primary control when **Confirm** is disabled at read rank (preview-only path). */
export const alertsTriageDialogConfirmButtonLabelReaderRank = "Apply triage (architect permission)";

/** Audit trail — search section heading (`audit/page.tsx`); branch with **`callerAuthorityRank`**. */
export const auditSearchEventsSectionHeadingOperator = "Search audit events";

export const auditSearchEventsSectionHeadingReader = "Search audit events (inspect)";

/** Audit trail — buyer demo shell: section title without internal “inspect” cue. */
export const auditSearchEventsSectionHeadingBuyerPolished = "Filters";

/** Audit trail — search is always **GET**; label nudges read-tier callers away from export expectations. */
export const auditSearchEventsButtonLabelReaderRank = "Search audit trail";

/** Audit trail — primary **Search** control `title` (`audit/page.tsx`). */
export const auditSearchEventsButtonTitleOperator = "Run search with the current filter fields (GET).";

export const auditSearchEventsButtonTitleReader =
  "Run search (GET). CSV export remains Auditor/Admin-gated on the API.";

/** Audit trail — **Audit results** section heading; branch with **`callerAuthorityRank`**. */
export const auditResultsSectionHeadingOperator = "Audit results";

export const auditResultsSectionHeadingReader = "Audit results (inspect)";

/** Audit trail — buyer demo shell: results block title without “inspect”. */
export const auditResultsSectionHeadingBuyerPolished = "Audit results";

/** Audit trail — **Load more** pagination (`GET`). */
export const auditLoadMoreButtonTitleOperator = "Load the next page of audit events for the current filters (GET).";

export const auditLoadMoreButtonTitleReader =
  "Load older rows (GET). Export rules unchanged on the API.";

/** Audit trail — **Clear filters** when rank cannot mutate in the shell (still GET-only; clarifies re-run vs export). */
export const auditClearFiltersButtonLabelReaderRank = "Clear filters & search";

/** Alert routing — delivery history fetch is **GET**; reader label clarifies inspect vs toggle writes. */
export const alertRoutingDeliveryAttemptsButtonLabelReaderRank = "Delivery attempts (inspect)";

/** Alert routing — **`title`** on **Show delivery attempts** (`alert-routing/page.tsx`). */
export const alertRoutingDeliveryAttemptsButtonTitleOperator =
  "Load recent delivery attempts for this destination (GET).";

export const alertRoutingDeliveryAttemptsButtonTitleReader =
  "Load delivery attempts (GET). Enabling or disabling a destination needs architect permission.";

/** Policy packs — compare action stays inspection-only at read rank (lifecycle writes below). */
export const policyPacksShowDiffButtonLabelReaderRank = "Show diff (inspect)";

/**
 * Governance workflow — inline review card when rank is below Execute (defense if UI state still shows the form;
 * Approve/Reject entry points are normally disabled for Reader).
 */
export const governanceWorkflowPendingReviewReaderNote =
  "Review actions need elevated access on the server — this form is preview only at your current role.";

/** Buyer shell: avoids “operator-level” jargon where possible. */
export const governanceWorkflowPendingReviewReaderNoteBuyerPolished =
  "Authorized roles record approval decisions here. Requesters cannot approve their own reviews (segregation of duties).";

/**
 * Alert rules / routing / simulation / tuning / composite — rank-aware cue (`AlertOperatorToolingRankCue`) for tests
 * or routes that mount a second strip below **`LayerHeader`**.
 */
export const alertOperatorToolingReaderRankLine = "Inspect above — configuration below needs architect permission.";

export const alertOperatorToolingOperatorRankLine = "Writes below: API-enforced.";

/**
 * Alert rules / alert routing / composite — list **Refresh** (`GET` only); configure sections remain Execute+ on the
 * API (`alert-rules/page.tsx`, `alert-routing/page.tsx`, `composite-alert-rules/page.tsx`).
 */
export const alertToolingListRefreshButtonTitleOperator = "Reload the list from the API (GET).";

export const alertToolingListRefreshButtonTitleReader =
  "Reload list (GET). Creates, toggles, and edits below need elevated permissions.";

/**
 * Alert tuning — lead under page title (`alert-tuning/page.tsx`). **POST** recommendation is **read access** on the
 * API; persisting thresholds to production remains **Execute+** on Alert / composite rule routes.
 */
export const alertTuningPageLead =
  "Scoring ranks candidate thresholds (Read on the API). Applying a winning threshold to production uses Alert rules or composite rules (Execute+).";

/**
 * Alert simulation — lead under page title (`alert-simulation/page.tsx`). Simulation **POST**s use **read access**;
 * live subscriptions and persisted rules are changed elsewhere (**Execute+**).
 */
export const alertSimulationPageLead =
  "What-if tabs call simulation APIs (Read on the API). Enabling subscriptions or editing live rules stays on Alert routing or Alert rules (Execute+).";

/**
 * Alert rules Test alerts tab — shared lead for merged simulation + tuning (`AlertSimulationTuningSection`).
 * Simulate is the primary section title; tuning is secondary disclosure (TB-1589); rank cue mounts once (TB-1593).
 */
export const alertTestAlertsTabLead =
  "Nothing on this tab changes live alert rules, subscriptions, or thresholds — simulations are recorded in the audit trail.";

/** Alert tuning — primary **Recommend threshold** control (`alert-tuning/page.tsx`). */
export const alertTuningRecommendButtonTitle =
  "Run threshold recommendation (Read access on the API; does not change live rules).";

/** Alert tuning — results section **`h3`** (`alert-tuning/page.tsx`); recommend stays available at Read on the API. */
export const alertTuningCurrentTuningHeadingOperator = "Current tuning";

export const alertTuningCurrentTuningHeadingReader = "Current tuning (inspect)";

/** Alert simulation — **Simulate** / **Compare candidates** controls (`alert-simulation/page.tsx`). */
export const alertSimulationRunControlTitle =
  "Run what-if (Read access on the API; no live rule or subscription changes from this page).";

/** Alert simulation — outcome column **`h3`** (`alert-simulation/page.tsx`); inputs stay neutral (read access POSTs). */
export const alertSimulationCurrentBehaviorHeadingOperator = "Simulated outcome";

export const alertSimulationCurrentBehaviorHeadingReader = "Simulated outcome (inspect)";

/** Alert simulation — empty simulated-outcome column before any simulation (P0-3). */
export const alertSimulationBehaviorEmptyLead =
  "No simulation yet. Results show per-review matches, suppression, and dedupe for the reviews you select — nothing is applied to live alert rules.";

/** Alerts inbox — lead under title (Execute+); rank cue hidden — see `LayerHeader`. */
export const alertsPageLeadOperator = "Filter, page, then triage per card.";

/** Alerts inbox — lead under title (read tier); `AlertsInboxRankCue` carries write boundary. */
export const alertsPageLeadReader = "Filter and page.";

/** Semantic search — subtitle under title (`search/page.tsx`). */
export const semanticSearchPageSubtitleOperator =
  "Find evidence, findings, decisions, and sealed review records across this workspace.";

/** semanticSearchPageSubtitleOperator — expanded note for engineers (optional collapse). Kept out of the default subtitle. */
export const semanticSearchPageDeploymentNoteDev =
  "Local/dev stacks may use in-memory indexing or synthetic embeddings; staging and production use your configured search backend.";

export const alertsInboxRefreshButtonTitleOperator = "Reload alerts for the current status filter (GET).";

export const alertsInboxRefreshButtonTitleReader =
  "Reload alerts (GET). Confirming triage needs elevated permissions.";

/** Alerts inbox — pagination controls when triage writes are off (`alerts/page.tsx`). */
export const alertsPaginationNavTitleReaderRank = "Page results (read-only in this shell; API authoritative).";

/** Alerts inbox — readers vs operators (see `AlertsInboxRankCue`). */
export const alertsInboxRankReaderLine =
  "Preview only here — confirming alert triage needs elevated permissions.";

export const alertsInboxRankOperatorLine = "Triage writes: API-enforced.";

/** Alerts triage confirmation dialog — extra copy when rank is below Execute (`alerts/page.tsx`). */
export const alertsTriageDialogReaderNote =
  "Confirm off at read rank; API enforces writes.";

/** Title on triage action buttons when rank can open the dialog but cannot Confirm (`alerts/page.tsx`). */
export const alertsTriageOpenPreviewReaderTitle =
  "Open triage preview — confirming changes needs elevated permissions.";

/** Alerts inbox — triage button visible names when Confirm/write is off at this shell rank (preview-only path). */
export const alertsTriageAcknowledgeButtonLabelReaderInbox = "Acknowledge (preview)";

export const alertsTriageResolveButtonLabelReaderInbox = "Resolve (preview)";

export const alertsTriageSuppressButtonLabelReaderInbox = "Suppress (preview)";

/** Audit trail — readers vs operators (see `AuditLogRankCue`). */
export const auditLogRankReaderLine =
  "Audit exports are available only to authorized audit or workspace administrators when your time window is set.";

export const auditLogRankOperatorLine =
  "Audit exports are available only to authorized audit or workspace administrators.";

/** Extra line under the pending-approvals empty state when rank is below Execute (batch/review CTAs are disabled). */
export const governanceDashboardPendingClearReaderSupplement =
  "Batch and row actions stay disabled here until elevated access applies (API).";

/** Governance workflow — “Approval requests for a review” card description by rank. */
export const governanceWorkflowQueryCardDescriptionReader =
  "Load a review to see its approval requests. Approving, releasing to environment, and activating require approver rights on your account.";

/** Buyer-polished shell: avoids “approver rights” jargon; sample-first framing. */
export const governanceWorkflowQueryCardDescriptionBuyerPolished =
  "The sample below shows a completed approval trail for the Claims Intake review. In production, choose a review to load its workflow history; approving and activating follow your organization’s role policy.";

export const governanceWorkflowQueryCardDescriptionOperator =
  "Pick a review, then load its approval requests. Approve or reject submitted requests, release approved architecture snapshots to the target environment, and activate when ready.";

/** No rows returned for the loaded review — reader copy references submit section position when inspect-first layout is used. */
export const governanceWorkflowNoApprovalsReaderHint =
  "No open approval rows for this review. Try another review, or ask an architect to submit a request.";

export const governanceWorkflowNoApprovalsOperatorHint =
  "Submit a request above or choose a different review.";

/** Governance workflow — Submit for approval when rank cannot mutate (shell soft-disable; API authoritative). */
export const governanceWorkflowSubmitForApprovalButtonLabelReaderRank = "Submit for governance approval";

/** Governance workflow — inline review Submit when rank cannot mutate. */
export const governanceWorkflowReviewSubmitButtonLabelReaderRank = "Submit review (needs approver rights)";

/** Governance workflow — row actions when rank cannot mutate (buttons stay disabled; label clarifies floor). */
export const governanceWorkflowApproveButtonLabelReaderRank = "Approve (needs approver rights)";

export const governanceWorkflowRejectButtonLabelReaderRank = "Reject (needs approver rights)";

export const governanceWorkflowPromoteButtonLabelReaderRank =
  "Release to environment (needs approver rights)";

export const governanceWorkflowActivateButtonLabelReaderRank = "Activate (needs approver rights)";

/** Governance workflow — under environment releases + activations for Execute+ (timeline + actions). */
export const governanceWorkflowPromotionsActivationsSectionLeadOperator =
  "Release approved rows to the target environment, then activate when ready.";

/** Governance workflow — same section for read tier (Release/Activate buttons stay disabled in the shell). */
export const governanceWorkflowPromotionsActivationsSectionLeadReader =
  "Read-only timeline; Release to environment and Activate require approver rights (API).";

/** Governance workflow — outcome banner under headers (`governance/page.tsx`): scope vs Policy packs / resolution. */
export const governanceWorkflowOutcomeBannerLine =
  "Tracks approvals for finalized architecture reviews. Outcomes are recorded in the audit trail.";

/** Policy packs — lead under title (Execute+); link to Policy resolution for stack semantics. */
export const policyPacksPageLeadOperator =
  "Review inventory and effective policy first; publish or assign when your role allows.";

/** Policy packs — lead under title (read tier). */
export const policyPacksPageLeadReader =
  "Inspect registered packs and combined policy content for this scope (read-only where your role limits changes).";

/** Policy packs — buyer demo shell: lead under title (Execute+); avoids “effective/registry” jargon. */
export const policyPacksPageLeadOperatorBuyerPolished =
  "Review which rules are active for this workspace first; your role controls whether you can publish or assign packs.";

/** Policy packs — buyer demo shell: lead for read tier. */
export const policyPacksPageLeadReaderBuyerPolished =
  "See which compliance rules apply to architecture reviews in this workspace. Changes require the appropriate role in your organization.";

/** Policy packs — outcome banner under headers (`policy-packs/page.tsx`). */
export const policyPacksOutcomeBannerLine =
  "Versions and assigns packs for this scope; enforcement applies through governance resolution and review finalization—not from this page alone.";

/** Policy packs — delta demo checklist link (improvement #2, assessment LATEST_GPT55). */
export const policyPacksDeltaDemoBannerLine =
  "Demo the policy moat: same committed review, stricter pack enforcement, different pre-commit gate outcome — see the policy-pack delta demo script in product documentation.";

/** Policy packs — **Current policy packs** section heading (`policy-packs/page.tsx`). */
export const policyPacksCurrentPacksHeadingOperator = "Current policy packs";

export const policyPacksCurrentPacksHeadingReader = "Current policy packs (inspect)";

/** Policy packs — effective / resolved JSON section heading. */
export const policyPacksPackContentHeadingOperator = "Pack content";

export const policyPacksPackContentHeadingReader = "Pack content (inspect)";

/** Policy packs — reader assist next to **Refresh** (`policy-packs/page.tsx`); reload is GET-only. */
export const policyPacksRefreshAssistReaderLine =
  "Refresh reloads inventory and effective policy (GET only; no lifecycle writes).";

/** Policy packs — buyer demo shell: reader assist next to **Refresh** (no internal “effective policy” phrasing). */
export const policyPacksRefreshAssistReaderLineBuyerPolished =
  "Refresh updates the pack list and the combined rules shown for this workspace (read-only).";

/** Policy packs — empty list under “Packs in scope”. */
export const policyPacksEmptyScopeReaderLine =
  "None in scope yet. Inspect when data exists; create and lifecycle need elevated permissions on the API.";

export const policyPacksEmptyScopeOperatorLine = "No packs yet.";

/** Policy packs — “Published versions” empty when a pack is selected but no rows returned. */
export const policyPacksPublishedVersionsEmptyReaderLine =
  "No published versions yet. Inspect here; publish needs elevated permissions on the API.";

export const policyPacksPublishedVersionsEmptyOperatorLine =
  "No published versions loaded for this pack yet.";

/** Policy packs — one line under Lifecycle heading for read tier (forms below stay soft-disabled). */
export const policyPacksLifecycleLeadReaderLine = "Lifecycle changes need elevated permissions.";

/** Policy packs — primary lifecycle buttons when mutation capability is false (shell soft-disable; API authoritative). */
export const policyPacksCreatePackButtonLabelReaderRank = "Create pack (architect permission)";

export const policyPacksPublishButtonLabelReaderRank = "Publish (architect permission)";

export const policyPacksAssignButtonLabelReaderRank = "Assign (architect permission)";

/** Governance workflow — Submit card description for read tier (operator copy stays inline on the page with API path). */
export const governanceWorkflowSubmitCardDescriptionReader =
  "Submitting requests requires approver rights in this workspace. You can still review the workflow below.";

/** Canonical noun for composite-rules tab, section headings, and empty titles (GOA P0-6). */
export const COMPOSITE_RULES_NOUN = "composite rules";

/** Hub tab label for `?tab=advanced-rules` — URL param unchanged. */
export const COMPOSITE_RULES_TAB_LABEL = "Composite rules";

/** Header metadata when the workspace has never persisted a composite rule. */
export const COMPOSITE_RULES_CONFIG_NEVER_CONFIGURED_LABEL =
  "Composite rules never configured in this workspace";

/** List-row disclosure — composite rules API is create-only (GOA P0-2). */
export const COMPOSITE_RULES_CREATE_ONLY_DISCLOSURE =
  "Composite rules are create-only on the API — you cannot disable or delete them from this workspace after creation.";

/** Empty-state worked example before the create form opens (GOA P0-5). */
export const COMPOSITE_RULES_EMPTY_EXAMPLE_HEADING = "Example pairing";

export const COMPOSITE_RULES_EMPTY_EXAMPLE_BODY =
  "Cost increase % ≥ 10 AND new compliance gap count ≥ 1 — fires only when both signals align.";

/** Secondary empty-state action — link to the Conditions tab (GOA P0-5). */
export const COMPOSITE_RULES_CONDITIONS_TAB_LINK_LABEL = "Open Conditions tab";

/** Composite alert rules — empty “Current composite rules” list. */
export const compositeRulesDefinedListEmptyReaderLine =
  "No composite rules yet. Inspect definitions; writes require elevated permissions on the API.";

export const compositeRulesDefinedListEmptyOperatorLine = "None yet.";

/** Composite alert rules — compact empty body (TB-1555 hub-zone preset; title from `operatorHubZoneEmptyTitle`). */
export const COMPOSITE_RULES_LIST_EMPTY_BODY =
  "Composite rules combine multiple metrics before firing — create one when a single threshold is too noisy.";

/** Composite alert rules — lead under page title (`composite-alert-rules/page.tsx`). */
export const compositeRulesPageLeadOperator =
  "Review compound conditions in the list, then author a new composite rule below.";

/** Composite alert rules — lead when the list is empty and the create form is collapsed (TB-1582). */
export const compositeRulesPageLeadOperatorEmpty =
  "Create a composite rule when multiple signals must align before an alert fires.";

export const compositeRulesPageLeadReader =
  "Inspect definitions above; new composite rules need Execute+ on the API at this rank.";

/** Composite — current list heading (mirrors simple alert rules pattern). */
export const compositeRulesCurrentRulesHeadingOperator = `Current ${COMPOSITE_RULES_NOUN}`;

export const compositeRulesCurrentRulesHeadingReader = `Current ${COMPOSITE_RULES_NOUN} (inspect)`;

/** Composite — reader assist next to **Refresh** (GET list only). */
export const compositeRulesRefreshAssistReaderLine =
  "Refresh reloads the rule list (GET only; does not create or change rules).";

/** Composite — primary create button when mutation capability is true. */
export const compositeRulesCreateButtonLabelOperator = "Create composite rule";

/** Composite — primary create button when mutation capability is false. */
export const compositeRulesCreateButtonLabelReaderRank = "Create composite rule (Execute+)";

/** Alert rules — empty “Defined rules” list. */
export const alertRulesDefinedListEmptyReaderLine =
  "No rules yet. Inspect thresholds; writes need elevated permissions on the API.";

export const alertRulesDefinedListEmptyOperatorLine = "None yet.";

/** Alert rules — lead under page title (`alert-rules/page.tsx`); rank cue stays in `AlertOperatorToolingRankCue`. */
export const alertRulesPageLeadOperator = "Scan current thresholds, then add or adjust rules below.";

export const alertRulesPageLeadReader =
  "Inspect thresholds above; the Change configuration block is Execute+ on the API at this rank.";

/** Alert routing — lead under page title when at least one destination exists. */
export const alertRoutingPageLeadOperator =
  "Review notification destinations and delivery health; add or adjust destinations below.";

export const alertRoutingPageLeadReader =
  "Inspect notification destinations first; create, enable, and disable need Execute+ on the API at this rank.";

/** Alert routing — lead when no destinations are configured yet. */
export const alertRoutingPageLeadOperatorEmpty =
  "Add a notification destination so qualifying alerts reach email or webhook channels.";

export const alertRoutingPageLeadReaderEmpty =
  "No notification destinations yet. Inspect the form below; creating destinations needs Execute+ on the API at this rank.";

/** Alert rules — list block above **Change configuration** (read tier: inspect-first label). */
export const alertRulesCurrentRulesHeadingOperator = "Current rules";
export const alertRulesCurrentRulesHeadingReader = "Current rules (inspect)";

/** Alert routing — subscriptions block above **Change configuration** (read tier: inspect-first label). */
export const alertRoutingCurrentRoutingHeadingOperator = "Current routing";
export const alertRoutingCurrentRoutingHeadingReader = "Current routing (inspect)";

/** Alert routing — empty “Current routing” list (mirrors alert rules empty pattern). */
export const alertRoutingSubscriptionsEmptyReaderLine =
  "No subscriptions yet. Inspect below; create, enable, and disable need elevated permissions on the API.";

export const alertRoutingSubscriptionsEmptyOperatorLine = "None yet.";

/** Governance workflow — governance release timeline empty (after a run is loaded). */
export const governanceWorkflowPromotionsEmptyReaderHint =
  "None yet. Rows appear after an architect releases an approved request to the target environment.";

export const governanceWorkflowPromotionsEmptyOperatorHint =
  "Release an approved request to the target environment to see rows here.";

/** Governance workflow — activations list empty. */
export const governanceWorkflowActivationsEmptyReaderHint =
  "None yet. Appear after an architect activates a governance release; inspect-only at your rank.";

export const governanceWorkflowActivationsEmptyOperatorHint =
  "Use Activate on a governance release card after releases exist.";

/** Alerts inbox — filtered empty state (Reader: deemphasize triage/configure as primary path). */
export const alertsFilteredEmptyDescriptionReader =
  "Nothing matches your filters yet, or no alerts have been raised for this workspace.";

export const alertsFilteredEmptyDescriptionOperator =
  "Nothing matches this filter yet — or rules have not fired. Adjust filters or keep building coverage below.";

export const auditSearchNoResultsReaderLine = "No audit events match your search.";

/** Audit trail — zero rows after search in buyer-polished shell (no “broken product” tone). */
export const auditSearchNoResultsBuyerPolishedLine =
  "No events match the current review and filter settings.";

export const auditSearchNoResultsOperatorLine = "No audit events match your filters.";

/** Audit trail — under “Search audit events” for read tier (LayerHeader already frames export roles). */
export const auditSearchSectionLeadReaderLine =
  "Bulk CSV downloads need Auditor or Admin (search above stays available).";

/** Audit trail — short line above the CSV button (LayerHeader + search strip carry the rest). */
export const auditExportSectionSupportingLine =
  "Bulk downloads need Auditor or Admin; pick Start date and End date, then Export audit trail.";

/** Audit trail — polished shell: no bulk-export mechanics in primary copy. */
export const auditExportSectionSupportingLineBuyerPolished =
  "Authorized users can export this audit trail as CSV for the selected date range.";

/** Audit CSV — button label when Start/End are incomplete (export disabled before role checks). */
export const auditExportCsvButtonLabelWindowIncomplete = "Export audit trail (set Start date/End date)";

/** Audit CSV — button label when window is valid but principal lacks Auditor/Admin for bulk export (API). */
export const auditExportCsvButtonLabelRoleRestricted = "Download audit trail";

/** Audit trail — buyer-polished: intro under results heading (single summary lives in the ribbon above). */
export const auditResultsSectionIntroBuyerPolished =
  "Events are grouped by lifecycle stage. Expand a row for structured details.";

/** Audit trail — buyer-polished public sample: short note when bulk CSV is not enabled (date window and/or role). */
export const auditExportSampleWorkspaceCsvHintBuyerPolished =
  "In this demonstration workspace, bulk CSV export follows the same role and date-window rules as production.";

/** Audit trail — buyer-polished: collapsible region for export and related operator actions (after the timeline). */
export const auditBuyerUtilitiesDetailsSummary = "Audit utilities";

/** Policy packs — intro under “Compare versions” when caller can mutate (Execute+ in shell). */
export const policyPacksCompareVersionsIntroOperator =
  "Pick two versions for a JSON path diff.";

/** Policy packs — same block for read tier (diff only; lifecycle writes below). */
export const policyPacksCompareVersionsIntroReader =
  "Read-only diff; publish/assign stay under Lifecycle (Execute+).";

/** Policy packs — under “Compare versions” when rank cannot mutate (diff is still read-only inspection). */
export const policyPacksCompareVersionsReaderSubline =
  "Diff is inspect-only; writes in Lifecycle.";

/** Policy packs — title on “Show diff” when rank cannot mutate (diff stays inspection-only; lifecycle on API). */
export const policyPacksShowDiffButtonReaderTitle =
  "Read-only diff between versions; publish and assign need Execute+ in Lifecycle (API).";

/** Policy packs — **Hide diff** (`policy-packs/page.tsx`); collapses client-side diff only. */
export const policyPacksHideDiffButtonTitle = "Close diff view (client only; no API write).";

/** Architecture digests — history sidebar **`h3`** (`digests/page.tsx`). */
export const digestsHistoryHeadingOperator = "History";

export const digestsHistoryHeadingReader = "History (inspect)";

/** Architecture digests — list **Refresh**. */
export const digestsListRefreshButtonTitleOperator = "Reload digest list and health status.";

export const digestsListRefreshButtonTitleReader =
  "Reload digest list and health status. Changing email subscriptions needs architect permission.";
/** Digest subscriptions — subscription list **`h3`** (`components/digests/DigestSubscriptionsContent.tsx`). */
/**
 * Follows the sibling `Current rules` / `Current routing` pattern above. The tab,
 * section heading, list heading, and empty state now all say "destinations" — the
 * list previously said "Your subscriptions" above a "No delivery destinations yet"
 * empty state, which read as two different features.
 */
export const digestSubscriptionsYourSubscriptionsHeadingOperator = "Saved delivery destinations";

export const digestSubscriptionsYourSubscriptionsHeadingReader = "Saved delivery destinations (inspect)";

/**
 * Digest subscriptions — primary create when rank cannot mutate in the shell.
 *
 * Buyer-facing wording: "architect permission", matching
 * {@link policyPacksCreatePackButtonLabelReaderRank}. `Execute+` is the internal
 * authority-rank name and must not appear on a control a buyer reads.
 */
export const digestSubscriptionsCreateSubscriptionButtonLabelReaderRank =
  "Create subscription (architect permission)";

export const digestSubscriptionsToggleToDisabledReaderRank = "Disable (architect permission)";

export const digestSubscriptionsToggleToEnabledReaderRank = "Enable (architect permission)";

/** Digest subscriptions — delivery attempts (read-only). */
export const digestSubscriptionsDeliveryAttemptsButtonLabelReaderRank = "Delivery attempts (inspect)";

export const digestSubscriptionsDeliveryAttemptsButtonTitleOperator =
  "Load recent digest delivery attempts for this subscription.";

export const digestSubscriptionsDeliveryAttemptsButtonTitleReader =
  "Load delivery attempts. Creating or toggling a subscription needs architect permission.";

/** Digest subscriptions — empty list. */
export const digestSubscriptionsEmptyListOperatorLine =
  "Add a delivery destination to send scheduled architecture digests to email or a Teams/Slack webhook.";

export const digestSubscriptionsEmptyListReaderLine =
  "No delivery destinations yet. Inspect when rows exist; create and toggle need architect access.";

/**
 * Advisory schedules — schedules list **`h3`** (`components/advisory/AdvisorySchedulesContent.tsx`).
 * Named "Existing schedules" (not just "Schedules") so it doesn't repeat the tab's own page-level `h2`.
 */
export const advisorySchedulesListHeadingOperator = "Existing schedules";

export const advisorySchedulesListHeadingReader = "Existing schedules (inspect)";

/** Advisory schedules — create block **`h3`**. */
export const advisorySchedulesCreateSectionHeadingOperator = "New schedule";

export const advisorySchedulesCreateSectionHeadingReader = "New schedule";

/** Advisory schedules — **Create schedule** submit when rank cannot mutate. */
export const advisorySchedulesCreateScheduleButtonLabelReaderRank = "Create schedule";

/** Advisory schedules — **Scan now** when rank cannot mutate. */
export const advisorySchedulesRunNowButtonLabelReaderRank = "Scan now";

/** Advisory schedules — **Load executions** (`GET`). */
export const advisorySchedulesLoadExecutionsButtonLabelReaderRank = "View history";

export const advisorySchedulesLoadExecutionsButtonTitleOperator =
  "Show recent advisory scan runs for this schedule.";

export const advisorySchedulesLoadExecutionsButtonTitleReader =
  "Show recent advisory scan runs for this schedule.";

/** Advisory schedules — empty list (`components/advisory/AdvisorySchedulesContent.tsx`). */
export const advisorySchedulesEmptyListOperatorLine = "No advisory-scan schedules yet";

export const advisorySchedulesEmptyListReaderLine = "No advisory-scan schedules yet";

/** Policy packs — pack selector when lifecycle writes are soft-disabled at read rank in the shell. */
export const policyPacksPackSelectReaderTitle =
  "Switch pack to inspect versions and JSON; publish, assign, and create need Execute+ below (API).";

/** Audit — Execute+ caller without Auditor/Admin claims (CSV export remains API-role-gated). */
export const auditExportExecuteRankAuditorRoleNote =
  "Exports are available to authorized audit users — your current role can review events in the UI but not download the CSV bundle.";

/** Alert rules — Create button label when mutation capability is false (same Execute+ floor as the hook). */
export const alertRulesCreateButtonLabelReaderRank = "Create rule (Execute+)";

/** Alert routing — Create destination button label when mutation capability is false. */
export const alertRoutingCreateSubscriptionButtonLabelReaderRank =
  "Create notification destination (Execute+)";

/** Alert routing — Enable toggle label at read rank (control disabled; API authoritative). */
export const alertRoutingToggleToEnabledReaderRank = "Enable (Execute+)";

/** Alert routing — Disable toggle label at read rank. */
export const alertRoutingToggleToDisabledReaderRank = "Disable (Execute+)";

/** Alerts triage dialog — appended to title when Confirm is disabled at read rank. */
export const alertsTriageDialogTitleReaderSuffix = " (read-only)";

/** Under-card shortcut hint for read tier (`useAlertCardShortcuts` skips Alt+1–3 unless Execute+ in shell). */
export const alertsPageShortcutsLineReader =
  "Alt+J/K between cards; Alt+1–3 only at Execute+ here.";
