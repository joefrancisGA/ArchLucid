/** Advisory scans hub — page chrome, form labels, empty states, and governance disposition copy. */

/** Single above-the-fold lead under the page title (TB-1125 — no triple description). */
export const ADVISORY_SCANS_PAGE_LEAD =
  "Generate prioritized follow-up recommendations from finalized reviews.";

/** @deprecated Prefer `ADVISORY_SCANS_PAGE_LEAD` — same string. */
export const ADVISORY_SCANS_PAGE_SUBTITLE = ADVISORY_SCANS_PAGE_LEAD;

export const ADVISORY_SCANS_HOW_IT_WORKS_TITLE = "How advisory scans work";

/** Folded value + trust copy — shown only inside How-it-works disclosure (TB-1125). */
export const ADVISORY_SCANS_HOW_IT_WORKS_BODY =
  "Use advisory scans after a review is finalized to identify changes, risks, tradeoffs, and implementation follow-up. Recommendations come from review findings, evidence, policy rules, and optional comparison signals.";

/** @deprecated Prefer `ADVISORY_SCANS_HOW_IT_WORKS_BODY` — first sentence only. */
export const ADVISORY_SCANS_PAGE_VALUE_STATEMENT =
  "Use advisory scans after a review is finalized to identify changes, risks, tradeoffs, and implementation follow-up actions.";

/** @deprecated Prefer `ADVISORY_SCANS_HOW_IT_WORKS_BODY` — trust sentence only. */
export const ADVISORY_SCANS_TRUST_COPY =
  "Recommendations are generated from review findings, evidence, policy rules, and optional comparison signals.";

export const ADVISORY_SCANS_FORM_SECTION_TITLE = "Generate advisory scan";

export const ADVISORY_SCANS_FINALIZED_REVIEW_LABEL = "Finalized review";

export const ADVISORY_SCANS_FINALIZED_REVIEW_PLACEHOLDER = "Choose a finalized review";

export const ADVISORY_SCANS_BASELINE_REVIEW_LABEL = "Baseline review for comparison";

export const ADVISORY_SCANS_BASELINE_REVIEW_PLACEHOLDER = "Choose baseline review for comparison";

export const ADVISORY_SCANS_BASELINE_REVIEW_HELPER =
  "Choose a baseline review to highlight changes and drift since the earlier review.";

export const ADVISORY_SCANS_CANT_FIND_REVIEW_SUMMARY = "Can't find a review?";

export const ADVISORY_SCANS_CANT_FIND_REVIEW_BODY =
  "Search recent finalized reviews below, or open the reviews list to locate the review you need.";

export const ADVISORY_SCANS_OPEN_REVIEW_PACKAGES_LABEL = "Open reviews";

export const ADVISORY_SCANS_OPEN_REVIEW_PACKAGES_HREF = "/architecture/reviews";

export const ADVISORY_SCANS_GENERATE_BUTTON_LABEL = "Generate advisory scan";

export const ADVISORY_SCANS_GENERATE_BUTTON_WORKING_LABEL = "Generating advisory scan…";

export const ADVISORY_SCANS_GENERATE_DISABLED_HINT =
  "Select a finalized review to generate an advisory scan.";

export const ADVISORY_SCANS_GENERATE_OUTPUT_HINT =
  "The scan will produce prioritized recommendations with suggested dispositions.";

export const ADVISORY_SCANS_REFRESH_SAVED_LABEL = "Refresh saved recommendations";

export const ADVISORY_SCANS_EMPTY_TITLE = "No advisory scan generated yet";

export const ADVISORY_SCANS_EMPTY_BODY =
  "Select a finalized review to generate an advisory scan, or view a sample scan output.";

/** @deprecated Prefer {@link ADVISORY_SCANS_EMPTY_BODY} — folded into compact empty state. */
export const ADVISORY_SCANS_EMPTY_NEXT_STORY_LEAD = ADVISORY_SCANS_EMPTY_BODY;

/** @deprecated Choose-review gate removed — form is inline on first load. */
export const ADVISORY_SCANS_CHOOSE_REVIEW_LABEL = "Choose review";

/** One-line advisory-only boundary near the generate action (no disclosure). */
export const ADVISORY_SCANS_INLINE_CAPABILITY_BOUNDARY =
  "An advisory scan produces prioritized recommendations from finalized reviews — not a finalized review record, resolve outcome, or automatic remediation.";

export const ADVISORY_SCANS_LIST_HEADING = "Saved advisory scans";

export const ADVISORY_SCANS_LIST_COUNT_LABEL = "recommendations in scope";

export const ADVISORY_SCANS_LAST_LOADED_PREFIX = "Last loaded";

export const ADVISORY_SCANS_VIEW_SAMPLE_LABEL = "View sample advisory scan";

/** In-page anchor for the sample recommendation card (TB-1128 empty/demo primary). */
export const ADVISORY_SCANS_SAMPLE_ANCHOR_HREF = "#advisory-sample-recommendation";

export const ADVISORY_SCANS_SAMPLE_SECTION_TITLE = "Sample advisory recommendation";

export const ADVISORY_SCANS_SAMPLE_BADGE_LABEL = "Sample recommendation";

/** Collapsed demo disposition chrome under the sample card (TB-1126). */
export const ADVISORY_SCANS_SAMPLE_DISPOSITION_SUMMARY = "Example dispositions (demo only)";

export const ADVISORY_SCANS_RECOMMENDATIONS_SECTION_TITLE = "Advisory recommendations";

export const ADVISORY_SCANS_RECOMMENDATIONS_SECTION_BODY =
  "Record resolve outcome for each recommendation to feed follow-up workflows.";

export const ADVISORY_SCANS_SUMMARY_SECTION_TITLE = "Scan summary";

export const ADVISORY_SCANS_SUMMARY_RECOMMENDATIONS_GENERATED = "Recommendations generated";

export const ADVISORY_SCANS_SUMMARY_HIGH_IMPACT = "High-impact recommendations";

export const ADVISORY_SCANS_SUMMARY_ACCEPTED = "Accepted";

export const ADVISORY_SCANS_SUMMARY_DEFERRED = "Deferred";

export const ADVISORY_SCANS_SUMMARY_REJECTED = "Rejected";

export const ADVISORY_SCANS_SUMMARY_IMPLEMENTED = "Implemented";

export const ADVISORY_SCANS_SUMMARY_LAST_SCAN = "Last scan time";

export const ADVISORY_SCANS_SUMMARY_COMPARED_TO = "Compared to baseline";

export const ADVISORY_SCANS_DISPOSITION_ACCEPT = "Accept";

export const ADVISORY_SCANS_DISPOSITION_DEFER = "Defer";

export const ADVISORY_SCANS_DISPOSITION_REJECT = "Reject";

export const ADVISORY_SCANS_DISPOSITION_IMPLEMENTED = "Mark implemented";

export const ADVISORY_SCANS_DISPOSITION_ACCEPT_HINT = "Adds to governance follow-up";

export const ADVISORY_SCANS_DISPOSITION_DEFER_HINT = "Keeps recommendation visible for later";

export const ADVISORY_SCANS_DISPOSITION_REJECT_HINT = "Records why it will not be pursued";

export const ADVISORY_SCANS_DISPOSITION_IMPLEMENTED_HINT = "Records completion";

export const ADVISORY_SCANS_DISPOSITION_DIALOG_TITLE = "Record recommendation resolve";

export const ADVISORY_SCANS_DISPOSITION_DIALOG_DESCRIPTION =
  "Optional comment and rationale are stored with the resolve outcome for audit and follow-up.";

export const ADVISORY_SCANS_DISPOSITION_COMMENT_LABEL = "Comment (optional)";

export const ADVISORY_SCANS_DISPOSITION_RATIONALE_LABEL = "Rationale (optional)";

export const ADVISORY_SCANS_DISPOSITION_CONFIRM_LABEL = "Confirm resolve";

export const ADVISORY_SCANS_CARD_IMPACT_LABEL = "Impact level";

export const ADVISORY_SCANS_CARD_RELATED_FINDING_LABEL = "Related finding or risk";

export const ADVISORY_SCANS_CARD_EVIDENCE_LABEL = "Evidence basis";

export const ADVISORY_SCANS_CARD_SUGGESTED_ACTION_LABEL = "Suggested action";

export const ADVISORY_SCANS_CARD_OWNER_LABEL = "Owner or role";

export const ADVISORY_SCANS_CARD_DISPOSITION_LABEL = "Resolve outcome";

export const ADVISORY_SCANS_SCHEDULES_PAGE_HEADING = "Schedule advisory scans";

export const ADVISORY_SCANS_SCHEDULES_INTRO =
  "Run advisory scans automatically after reviews are finalized.";

export const ADVISORY_SCANS_SCHEDULES_ELIGIBILITY =
  "Each scheduled scan uses the latest finalized reviews for the selected project to generate follow-up recommendations.";

export const ADVISORY_SCANS_SCHEDULES_TIMING_NOTE =
  "Scheduled scans may begin a few minutes after the selected time.";

export const ADVISORY_SCANS_SCHEDULES_HOW_IT_WORKS_TITLE = "How scheduled advisory scans work";

/** Schedules-tab orientation — folded into disclosure (not stacked above the form). */
export const ADVISORY_SCANS_SCHEDULES_HOW_IT_WORKS_BODY = [
  ADVISORY_SCANS_SCHEDULES_INTRO,
  ADVISORY_SCANS_SCHEDULES_ELIGIBILITY,
  ADVISORY_SCANS_SCHEDULES_TIMING_NOTE,
].join(" ");

export const ADVISORY_SCANS_SCHEDULES_LAST_LOADED_PREFIX = "Last loaded";

export const ADVISORY_SCANS_SCHEDULES_LIST_COUNT_LABEL = "schedules in scope";

export const ADVISORY_SCANS_SCHEDULES_NEXT_SCAN_HEADER = "Next scan";

export const ADVISORY_SCANS_SCHEDULES_LAST_SCAN_HEADER = "Last scan";

export const ADVISORY_SCANS_SCHEDULES_NEXT_SCHEDULED_SCANS_LABEL = "Next scheduled scans";

export const ADVISORY_SCANS_SCHEDULES_SCAN_NOW_LABEL = "Scan now";

export const ADVISORY_SCANS_SCHEDULES_SCAN_NOW_WORKING_LABEL = "Scanning…";

export const ADVISORY_SCANS_SCHEDULES_SCAN_NOW_SR_ONLY =
  "Scan this advisory scan now without waiting for the next scheduled time.";

export const ADVISORY_SCANS_SCHEDULES_NO_SCAN_HISTORY =
  "No scan history recorded for this schedule yet.";

export const ADVISORY_SCANS_SCHEDULES_SCAN_STARTED = "Advisory scan started.";

/** Vocabulary rail peer link on the schedules tab — distinct from the compact-line sentence. */
export const ADVISORY_SCANS_SCHEDULES_RECURRENCE_PEER_LINK_LABEL = "Open recurrence schedules";

export const ADVISORY_SCANS_SCHEDULES_EXAMPLE_PREVIEW_LABEL = "Example schedule (not live data)";

export const ADVISORY_SCANS_SCHEDULES_EXAMPLE_PREVIEW_HELPER =
  "Illustrates how a saved schedule appears after you create one for the current project scope.";

export const ADVISORY_SCANS_SCHEDULES_EXAMPLE_NAME = "Weekly architecture follow-up scan";

export const ADVISORY_SCANS_SCHEDULES_RECURRENCE_LINK_LABEL = "Manage all recurrence schedules";

export const ADVISORY_SCANS_SCHEDULES_RECURRENCE_LINK_HELPER =
  "Create advisory-scan schedules here. Use recurrence schedules to view and manage all recurring activity across ArchLucid.";

export const ADVISORY_SCANS_SCHEDULES_RECURRENCE_HREF = "/governance/recurrence-schedules";

export const ADVISORY_SCANS_SCHEDULES_EMPTY_TITLE = "No advisory-scan schedules yet";

export const ADVISORY_SCANS_SCHEDULES_EMPTY_BODY =
  "Create a schedule to generate follow-up recommendations automatically.";

export const ADVISORY_SCANS_SCHEDULES_NO_FINALIZED_REVIEWS_TITLE = "Finalized review required";

export const ADVISORY_SCANS_SCHEDULES_NO_FINALIZED_REVIEWS_BODY =
  "Finalize at least one architecture review in this project scope before creating or running advisory scan schedules.";

export const ADVISORY_SCANS_SCHEDULES_RUN_NOW_NO_REVIEWS_HINT =
  "Finalize a review in this project scope before running advisory scans.";

export const ADVISORY_SCANS_SCHEDULES_SAMPLE_BLOCKED =
  "Schedules cannot be created for fabricated sample data. Start an evaluation or sign in to schedule advisory scans for your organization.";

export const ADVISORY_SCANS_SCHEDULES_READ_ONLY =
  "You can review existing schedules. Creating schedules and running them now requires a role that can manage advisory scans.";

export const ADVISORY_SCANS_SCHEDULES_SCOPE_CURRENT = "Schedule project scope";

export const ADVISORY_SCANS_SCHEDULES_SCOPE_HELPER =
  "Runs against the project currently selected in the workspace switcher (top navigation). Change the switcher before creating a schedule to target a different project.";

export const ADVISORY_SCANS_SCHEDULES_SCOPE_SWITCHER_NOTE =
  "Scope is not stored silently in this browser — it follows the workspace switcher selection shown above.";

export const ADVISORY_SCANS_SCHEDULES_ADVANCED_SUMMARY = "Advanced scheduling";

export const ADVISORY_SCANS_SCHEDULES_ADVANCED_HELPER =
  "For administrators who need a custom UTC schedule expression. Ordinary schedules should use Daily, Weekdays, Weekly, or Monthly above.";

export const ADVISORY_SCANS_SCHEDULES_CREATE_WORKING = "Creating schedule…";

export const ADVISORY_SCANS_SCHEDULES_CREATE_SUCCESS = "Schedule created.";

export const ADVISORY_SCANS_SCHEDULES_CREATE_FAILURE =
  "Could not create the schedule. Check the frequency and try again.";

export const ADVISORY_SCANS_MANUAL_ID_ADMIN_SUMMARY = "Technical details (admin)";

export const ADVISORY_SCANS_MANUAL_ID_TARGET_PLACEHOLDER = "Architecture review ID (target review)";

export const ADVISORY_SCANS_MANUAL_ID_BASELINE_PLACEHOLDER = "Optional baseline architecture review ID";

/** Static sample recommendation shown when no scan has been generated. */
export const ADVISORY_SCANS_SAMPLE_RECOMMENDATION = {
  impactLevel: "High impact",
  title: "API tier lacks a circuit breaker around legacy claims service",
  relatedFinding: "Resilience — dependency timeout cascade risk",
  evidenceBasis: "Finalized review findings and dependency health evidence",
  suggestedAction: "Add timeout + bulkhead; capture health metrics for the dependency.",
  body:
    "Under load, repeated timeouts could cascade. Harden the integration and add a documented fallback path before the next production promotion.",
  ownerRole: "Platform engineering lead",
} as const;
