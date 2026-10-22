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


export const alertToolingChangeConfigurationHeadingOperator = "Change configuration";


export const alertToolingChangeConfigurationHeadingReader = "Change configuration (elevated permissions)";


export const alertsTriageDialogConfirmButtonLabelReaderRank = "Apply triage (architect permission)";


export const alertRoutingDeliveryAttemptsButtonLabelReaderRank = "Delivery attempts (inspect)";


export const alertRoutingDeliveryAttemptsButtonTitleOperator =
  "Load recent delivery attempts for this destination (GET).";


export const alertRoutingDeliveryAttemptsButtonTitleReader =
  "Load delivery attempts (GET). Enabling or disabling a destination needs architect permission.";


export const alertOperatorToolingReaderRankLine = "Inspect above — configuration below needs architect permission.";


export const alertOperatorToolingOperatorRankLine = "Writes below: API-enforced.";


export const alertToolingListRefreshButtonTitleOperator = "Reload the list from the API (GET).";


export const alertToolingListRefreshButtonTitleReader =
  "Reload list (GET). Creates, toggles, and edits below need elevated permissions.";


export const alertTuningPageLead =
  "Scoring ranks candidate thresholds (Read on the API). Applying a winning threshold to production uses Alert rules or composite rules (Execute+).";


export const alertSimulationPageLead =
  "What-if tabs call simulation APIs (Read on the API). Enabling subscriptions or editing live rules stays on Alert routing or Alert rules (Execute+).";


export const alertTestAlertsTabLead =
  "Nothing on this tab changes live alert rules, subscriptions, or thresholds — simulations are recorded in the audit trail.";


export const alertTuningRecommendButtonTitle =
  "Run threshold recommendation (Read access on the API; does not change live rules).";


export const alertTuningCurrentTuningHeadingOperator = "Current tuning";


export const alertTuningCurrentTuningHeadingReader = "Current tuning (inspect)";


export const alertSimulationRunControlTitle =
  "Run what-if (Read access on the API; no live rule or subscription changes from this page).";


export const alertSimulationCurrentBehaviorHeadingOperator = "Simulated outcome";


export const alertSimulationCurrentBehaviorHeadingReader = "Simulated outcome (inspect)";


export const alertSimulationBehaviorEmptyLead =
  "No simulation yet. Results show per-review matches, suppression, and dedupe for the reviews you select — nothing is applied to live alert rules.";


export const alertsPageLeadOperator = "Filter, page, then triage per card.";


export const alertsPageLeadReader = "Filter and page.";


export const semanticSearchPageSubtitleOperator =
  "Find evidence, findings, decisions, and sealed review records across this workspace.";


export const semanticSearchPageDeploymentNoteDev =
  "Local/dev stacks may use in-memory indexing or synthetic embeddings; staging and production use your configured search backend.";


export const alertsInboxRefreshButtonTitleOperator = "Reload alerts for the current status filter (GET).";


export const alertsInboxRefreshButtonTitleReader =
  "Reload alerts (GET). Confirming triage needs elevated permissions.";


export const alertsPaginationNavTitleReaderRank = "Page results (read-only in this shell; API authoritative).";


export const alertsInboxRankReaderLine =
  "Preview only here — confirming alert triage needs elevated permissions.";


export const alertsInboxRankOperatorLine = "Triage writes: API-enforced.";


export const alertsTriageDialogReaderNote =
  "Confirm off at read rank; API enforces writes.";


export const alertsTriageOpenPreviewReaderTitle =
  "Open triage preview — confirming changes needs elevated permissions.";


export const alertsTriageAcknowledgeButtonLabelReaderInbox = "Acknowledge (preview)";


export const alertsTriageResolveButtonLabelReaderInbox = "Resolve (preview)";


export const alertsTriageSuppressButtonLabelReaderInbox = "Suppress (preview)";


export const COMPOSITE_RULES_NOUN = "composite rules";


export const COMPOSITE_RULES_TAB_LABEL = "Composite rules";


export const COMPOSITE_RULES_CONFIG_NEVER_CONFIGURED_LABEL =
  "Composite rules never configured in this workspace";


export const COMPOSITE_RULES_CREATE_ONLY_DISCLOSURE =
  "Composite rules are create-only on the API — you cannot disable or delete them from this workspace after creation.";


export const COMPOSITE_RULES_EMPTY_EXAMPLE_HEADING = "Example pairing";


export const COMPOSITE_RULES_EMPTY_EXAMPLE_BODY =
  "Cost increase % ≥ 10 AND new compliance gap count ≥ 1 — fires only when both signals align.";


export const COMPOSITE_RULES_CONDITIONS_TAB_LINK_LABEL = "Open Conditions tab";


export const compositeRulesDefinedListEmptyReaderLine =
  "No composite rules yet. Inspect definitions; writes require elevated permissions on the API.";


export const compositeRulesDefinedListEmptyOperatorLine = "None yet.";


export const COMPOSITE_RULES_LIST_EMPTY_BODY =
  "Composite rules combine multiple metrics before firing — create one when a single threshold is too noisy.";


export const compositeRulesPageLeadOperator =
  "Review compound conditions in the list, then author a new composite rule below.";


export const compositeRulesPageLeadOperatorEmpty =
  "Create a composite rule when multiple signals must align before an alert fires.";


export const compositeRulesPageLeadReader =
  "Inspect definitions above; new composite rules need Execute+ on the API at this rank.";


export const compositeRulesCurrentRulesHeadingOperator = `Current ${COMPOSITE_RULES_NOUN}`;


export const compositeRulesCurrentRulesHeadingReader = `Current ${COMPOSITE_RULES_NOUN} (inspect)`;


export const compositeRulesRefreshAssistReaderLine =
  "Refresh reloads the rule list (GET only; does not create or change rules).";


export const compositeRulesCreateButtonLabelOperator = "Create composite rule";


export const compositeRulesCreateButtonLabelReaderRank = "Create composite rule (Execute+)";


export const alertRulesDefinedListEmptyReaderLine =
  "No rules yet. Inspect thresholds; writes need elevated permissions on the API.";


export const alertRulesDefinedListEmptyOperatorLine = "None yet.";


export const alertRulesPageLeadOperator = "Scan current thresholds, then add or adjust rules below.";


export const alertRulesPageLeadReader =
  "Inspect thresholds above; the Change configuration block is Execute+ on the API at this rank.";


export const alertRoutingPageLeadOperator =
  "Review notification destinations and delivery health; add or adjust destinations below.";


export const alertRoutingPageLeadReader =
  "Inspect notification destinations first; create, enable, and disable need Execute+ on the API at this rank.";


export const alertRoutingPageLeadOperatorEmpty =
  "Add a notification destination so qualifying alerts reach email or webhook channels.";


export const alertRoutingPageLeadReaderEmpty =
  "No notification destinations yet. Inspect the form below; creating destinations needs Execute+ on the API at this rank.";


export const alertRulesCurrentRulesHeadingOperator = "Current rules";

export const alertRulesCurrentRulesHeadingReader = "Current rules (inspect)";


export const alertRoutingCurrentRoutingHeadingOperator = "Current routing";

export const alertRoutingCurrentRoutingHeadingReader = "Current routing (inspect)";


export const alertRoutingSubscriptionsEmptyReaderLine =
  "No subscriptions yet. Inspect below; create, enable, and disable need elevated permissions on the API.";


export const alertRoutingSubscriptionsEmptyOperatorLine = "None yet.";


export const alertsFilteredEmptyDescriptionReader =
  "Nothing matches your filters yet, or no alerts have been raised for this workspace.";


export const alertsFilteredEmptyDescriptionOperator =
  "Nothing matches this filter yet — or rules have not fired. Adjust filters or keep building coverage below.";


export const digestsHistoryHeadingOperator = "History";


export const digestsHistoryHeadingReader = "History (inspect)";


export const digestsListRefreshButtonTitleOperator = "Reload digest list and health status.";


export const digestsListRefreshButtonTitleReader =
  "Reload digest list and health status. Changing email subscriptions needs architect permission.";

export const digestSubscriptionsYourSubscriptionsHeadingOperator = "Saved delivery destinations";


export const digestSubscriptionsYourSubscriptionsHeadingReader = "Saved delivery destinations (inspect)";


export const digestSubscriptionsCreateSubscriptionButtonLabelReaderRank =
  "Create subscription (architect permission)";


export const digestSubscriptionsToggleToDisabledReaderRank = "Disable (architect permission)";


export const digestSubscriptionsToggleToEnabledReaderRank = "Enable (architect permission)";


export const digestSubscriptionsDeliveryAttemptsButtonLabelReaderRank = "Delivery attempts (inspect)";


export const digestSubscriptionsDeliveryAttemptsButtonTitleOperator =
  "Load recent digest delivery attempts for this subscription.";


export const digestSubscriptionsDeliveryAttemptsButtonTitleReader =
  "Load delivery attempts. Creating or toggling a subscription needs architect permission.";


export const digestSubscriptionsEmptyListOperatorLine =
  "Add a delivery destination to send scheduled architecture digests to email or a Teams/Slack webhook.";


export const digestSubscriptionsEmptyListReaderLine =
  "No delivery destinations yet. Inspect when rows exist; create and toggle need architect access.";


export const advisorySchedulesListHeadingOperator = "Existing schedules";


export const advisorySchedulesListHeadingReader = "Existing schedules (inspect)";


export const advisorySchedulesCreateSectionHeadingOperator = "New schedule";


export const advisorySchedulesCreateSectionHeadingReader = "New schedule";


export const advisorySchedulesCreateScheduleButtonLabelReaderRank = "Create schedule";


export const advisorySchedulesRunNowButtonLabelReaderRank = "Run now";


export const advisorySchedulesLoadExecutionsButtonLabelReaderRank = "View history";


export const advisorySchedulesLoadExecutionsButtonTitleOperator =
  "Show recent advisory scan runs for this schedule.";


export const advisorySchedulesLoadExecutionsButtonTitleReader =
  "Show recent advisory scan runs for this schedule.";


export const advisorySchedulesEmptyListOperatorLine = "No advisory-scan schedules yet";


export const advisorySchedulesEmptyListReaderLine = "No advisory-scan schedules yet";


export const alertRulesCreateButtonLabelReaderRank = "Create rule (Execute+)";


export const alertRoutingCreateSubscriptionButtonLabelReaderRank =
  "Create notification destination (Execute+)";


export const alertRoutingToggleToEnabledReaderRank = "Enable (Execute+)";


export const alertRoutingToggleToDisabledReaderRank = "Disable (Execute+)";


export const alertsTriageDialogTitleReaderSuffix = " (read-only)";


export const alertsPageShortcutsLineReader =
  "Alt+J/K between cards; Alt+1–3 only at Execute+ here.";
