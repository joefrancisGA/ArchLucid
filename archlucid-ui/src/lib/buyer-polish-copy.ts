/**
 * Shared buyer-polished copy — import here instead of scattering literals across pages.
 */

import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture-workflow-labels";
import { CLOUD_NEUTRAL_PRIMARY_COPY } from "@/lib/cloud-neutral-primary-copy";
import { RISK_EXCEPTIONS_EMPTY_BODY, RISK_EXCEPTIONS_PAGE_SUBTITLE } from "@/lib/risk-exceptions-page";

export const BUYER_WORKSPACE_DISPLAY_NAME = "Claims Intake Workspace";

export const BUYER_EXAMPLE_WORKSPACE_TOOLTIP =
  "Claims Intake workspace — demonstration data for architecture review walkthroughs.";

export const BUYER_COMPARE_PAGE_TITLE = "Compare reviews";

export const BUYER_COMPARE_PRIMARY_ACTION_LABEL = "Compare reviews";

export const BUYER_COMPARE_OPEN_SIGNED_REVIEW_RECORD_CTA = "Open signed review record";

export const BUYER_COMPARE_OPEN_EVIDENCE_TRAIL_CTA = "Open evidence trail";

export const BUYER_COMPARE_OPEN_SAMPLE_COMPARISON_CTA = "Open sample comparison";

export const BUYER_COMPARE_STRUCTURED_HEADING = "Review comparison";

export const BUYER_COMPARE_STRUCTURED_LEAD =
  "Compare finalized reviews to understand what changed between reviews — each card below summarizes one category. Prefer this narrative before supplementary diffs further down.";

export const BUYER_COMPARE_MANIFEST_DIFF_APPENDIX_LABEL = "Review change details";

export const BUYER_COMPARE_CHANGE_REVIEWS_SUMMARY = "Change compared reviews";

export const BUYER_HOME_SAMPLE_PACKAGE_HEADLINE =
  "Explore a completed example review";

export const BUYER_HOME_SAMPLE_PACKAGE_SUBTITLE =
  "Completed architecture review with signed review record, evidence trail, and audit record.";

export const BUYER_HOME_SAMPLE_PACKAGE_LEAD =
  "Review a completed example review with evidence trail, findings, governance approval, and audit-ready artifacts before creating your first review.";

export const BUYER_HOME_PRIMARY_CTA = "Open sample finding";

/** Quiet label above the non-clickable sample finding preview rows — signals "content", not "actions". */
export const OPERATOR_HOME_SAMPLE_FINDINGS_INCLUDES_LABEL = "Sample includes:";

export const OPERATOR_HOME_REVIEW_SAMPLE_FINDINGS_CTA = "Run guided review";

export const OPERATOR_HOME_OPEN_COMPLETED_REVIEW_CTA = "Open review";

/** @deprecated Prefer {@link OPERATOR_HOME_OPEN_COMPLETED_REVIEW_CTA}. */
export const OPERATOR_HOME_OPEN_FULL_EXAMPLE_REVIEW_CTA = OPERATOR_HOME_OPEN_COMPLETED_REVIEW_CTA;

/** Empty Overview primary CTA on demo/seeded Claims Intake / Workspace A/B pins (TB-1039). */
export const OPERATOR_HOME_OPEN_SAMPLE_PACKAGE_CTA = "Open sample review";

/** Bridge when demo/seeded Overview skips setup and opens the sample review (TB-1039). */
export const OPERATOR_HOME_DEMO_SEEDED_SAMPLE_BRIDGE =
  "This demo workspace includes a finished sample review — open it to see findings, evidence, and decisions.";

export const OPERATOR_HOME_OPEN_CREATION_EXAMPLE_CTA = "Open creation example";

/** @deprecated Prefer {@link OPERATOR_HOME_OPEN_CREATION_EXAMPLE_CTA}. */
export const OPERATOR_HOME_OPEN_CREATED_SAMPLE_CTA = OPERATOR_HOME_OPEN_CREATION_EXAMPLE_CTA;

export const OPERATOR_HOME_CREATION_EXAMPLE_TITLE = "Architecture creation example";

export const OPERATOR_HOME_CREATION_EXAMPLE_BODY =
  "See how ArchLucid turns goals and constraints into an architecture.";

export const OPERATOR_HOME_GUIDED_REVIEW_EXAMPLE_TITLE = "Guided review example";

export const OPERATOR_HOME_GUIDED_REVIEW_EXAMPLE_BODY =
  "See how ArchLucid evaluates a sample architecture.";

export const OPERATOR_HOME_COMMAND_CENTER_TAGLINE =
  "Create architecture drafts, govern AI-assisted reviews, track evidence, and produce auditable decisions your organization can trust.";

export const OPERATOR_HOME_INTENT_CHOOSER_HEADING = "Start the architecture review lifecycle";

export const OPERATOR_HOME_CONTINUE_ARCHITECTURE_HEADING = "Continue your architecture";

export const OPERATOR_HOME_ACTIVE_REVIEWS_HEADING = "Reviews in progress";

export const OPERATOR_HOME_ACTIVE_REVIEWS_LEAD =
  "Open an in-progress review or start another governed review when your architecture is ready.";

export const OPERATOR_HOME_LIFECYCLE_RECOMMENDED_BADGE = "Recommended next";

export const OPERATOR_HOME_RESUME_LATEST_DRAFT_CTA = "Resume latest draft";

export function formatOperatorHomeContinueArchitectureLead(draftCount: number): string {
  const safeCount = Number.isFinite(draftCount) ? Math.max(0, Math.trunc(draftCount)) : 0;

  if (safeCount === 1) {
    return "1 draft saved — start a review when you are ready.";
  }

  return `${safeCount} drafts saved — start a review when you are ready.`;
}

export function formatOperatorHomeResumeDraftBridge(displayName: string, draftCount: number): string {
  const trimmedName = displayName.trim();
  const safeCount = Number.isFinite(draftCount) ? Math.max(0, Math.trunc(draftCount)) : 0;

  if (trimmedName.length > 0 && safeCount === 1) {
    return `Pick up "${trimmedName}" or start a governed review from the lifecycle steps below.`;
  }

  if (trimmedName.length > 0) {
    return `Pick up "${trimmedName}" — your most recent draft — or start a governed review from the lifecycle steps below.`;
  }

  return "Resume your most recent draft or start a governed review from the lifecycle steps below.";
}

export const OPERATOR_HOME_EXPLORE_COMPLETED_REVIEW_TITLE = "Explore a completed review";

export const OPERATOR_HOME_EXPLORE_COMPLETED_REVIEW_BODY =
  "Inspect real findings, evidence, decisions, and a finalized review before using your own architecture.";

export const OPERATOR_HOME_BEST_FOR_EVALUATING_BADGE = "Best for evaluating ArchLucid";

export const OPERATOR_HOME_MISSING_COMPLETED_SAMPLE_MESSAGE =
  "No completed sample has been selected for this workspace.";

export const OPERATOR_HOME_CHOOSE_SAMPLE_REVIEW_CTA = "Choose sample review";

export const OPERATOR_HOME_CONTACT_WORKSPACE_OWNER_HINT = "Contact the workspace owner.";

export const OPERATOR_HOME_COMPACT_STARTING_ACTIONS_HEADING = "Start another review";

/** Bold lead label on Overview subtitle (buyer-polished shell). */
export const OPERATOR_HOME_ARCHITECTURE_LIFECYCLE_INTRO_LABEL = "One lifecycle:";

export const OPERATOR_HOME_ARCHITECTURE_LIFECYCLE_INTRO_BODY =
  "describe your architecture, then run a governed review. The review is the durable work item.";

export const OPERATOR_HOME_ARCHITECTURE_LIFECYCLE_INTRO =
  `${OPERATOR_HOME_ARCHITECTURE_LIFECYCLE_INTRO_LABEL} ${OPERATOR_HOME_ARCHITECTURE_LIFECYCLE_INTRO_BODY}`;

export const OPERATOR_HOME_CREATE_ARCHITECTURE_CARD_TITLE = "Step 1 — Describe or import your architecture";

export const OPERATOR_HOME_CREATE_ARCHITECTURE_CARD_BODY =
  "Start from a draft, business goals, constraints, requirements, and available evidence. Saving a draft does not start a review.";

export const OPERATOR_HOME_REVIEW_ARCHITECTURE_CARD_TITLE = "Step 2 — Run a governed review";

export const OPERATOR_HOME_REVIEW_ARCHITECTURE_CARD_BODY =
  "Provide the architecture information you already have, including diagrams, descriptions, requirements, evidence, or other supporting material.";

/** @deprecated Merged into {@link OPERATOR_HOME_REVIEW_ARCHITECTURE_CARD_BODY} on the home review card. */
export const OPERATOR_HOME_REVIEW_ARCHITECTURE_SUPPORT = OPERATOR_HOME_REVIEW_ARCHITECTURE_CARD_BODY;

export const OPERATOR_HOME_REVIEW_ARCHITECTURE_CTA = "Start review";

/** @deprecated Removed from first-run hero — retained for legacy imports. */
export const OPERATOR_HOME_RECOMMENDED_FIRST_BADGE = "Best for evaluating ArchLucid";

export const OPERATOR_HOME_DUAL_PATH_CHOOSER_GUIDANCE = OPERATOR_HOME_REVIEW_ARCHITECTURE_SUPPORT;

export const OPERATOR_HOME_RECOMMENDED_NEXT_LABEL = "Recommended next:";

export const OPERATOR_HOME_RECOMMENDED_NEXT_STATIC =
  "Open the completed review to see findings, evidence, and decisions before your first review.";

export const OPERATOR_HOME_RECOMMENDED_NEXT_CREATE_OR_REVIEW = OPERATOR_HOME_OPEN_COMPLETED_REVIEW_CTA;

export const OPERATOR_HOME_RECOMMENDED_NEXT_START_REVIEW = "Start review";

export const OPERATOR_HOME_RECOMMENDED_NEXT_CREATE_ARCHITECTURE = "Create architecture";

export const OPERATOR_HOME_RECOMMENDED_NEXT_OPEN_SAMPLE = OPERATOR_HOME_OPEN_COMPLETED_REVIEW_CTA;

export const OPERATOR_HOME_RECOMMENDED_NEXT_OPEN_LATEST = "Open latest review";

export const OPERATOR_HOME_EXPLORE_SAMPLE_HEADING = "See ArchLucid in action";

export const OPERATOR_HOME_EXPLORE_SAMPLE_LEAD =
  "Explore how ArchLucid creates an architecture or evaluates one through a guided review.";

export const OPERATOR_HOME_OPEN_COMPLETED_SAMPLE_HINT =
  "Inspect findings, evidence, and decisions from a finished review.";

export const OPERATOR_HOME_RUN_SAMPLE_REVIEW_HINT = OPERATOR_HOME_GUIDED_REVIEW_EXAMPLE_BODY;

export const OPERATOR_HOME_READ_ONLY_INTENT_HINT =
  "Your role can explore samples and learn how reviews work. Ask a workspace administrator for permission to create or start reviews.";

/** @deprecated Prefer {@link OPERATOR_HOME_EXPLORE_SAMPLE_HEADING} — retained for legacy imports. */
export const OPERATOR_HOME_SAMPLE_FINDINGS_HEADING = OPERATOR_HOME_EXPLORE_SAMPLE_HEADING;

/** @deprecated Prefer {@link OPERATOR_HOME_EXPLORE_SAMPLE_LEAD}. */
export const OPERATOR_HOME_SAMPLE_FINDINGS_LEAD = OPERATOR_HOME_EXPLORE_SAMPLE_LEAD;

export const OPERATOR_HOME_SAMPLE_FINDINGS_DEFENSIBLE_LAYER =
  "Example review — not your workspace data. Open the full review for findings, evidence, and the signed record.";

export const SAMPLE_REVIEW_AHA_FINDING_LABEL = "Finding";

export const SAMPLE_REVIEW_AHA_WHY_LABEL = "Why it matters";

export const SAMPLE_REVIEW_AHA_EVIDENCE_LABEL = "Evidence support";

export const SAMPLE_REVIEW_AHA_DECISION_LABEL = "Decision change";

export const SAMPLE_REVIEW_AHA_DEMO_LABEL = "Example review";

export const SAMPLE_REVIEW_PACKAGE_AHA_HEADING = "Your first-value moment";

export const SAMPLE_REVIEW_PACKAGE_AHA_LEAD =
  "This sample review leads with one decision-changing finding — expand evidence and exports below when ready.";

export const OPERATOR_HOME_WORKSPACE_EMPTY_TITLE = "No reviews yet";

export const OPERATOR_HOME_WORKSPACE_EMPTY_BODY =
  "Your in-progress and completed architecture reviews will appear here.";

/** Recent reviews outcome when only a demo/seeded or showcase sample is visible. */
export const OPERATOR_HOME_RECENT_REVIEWS_EXAMPLE_ONLY_OUTCOME =
  "Showing a completed example review. Your own reviews will appear here.";

export const OPERATOR_HOME_LEARN_HOW_REVIEWS_WORK_CTA = "Learn how reviews work";

/** Bridge when setup readiness still blocks the first review. */
export const OPERATOR_HOME_DO_THIS_NEXT_SETUP_BRIDGE =
  "Finish the remaining required setup item, then start or open a sample review.";

export const OPERATOR_HOME_WORKSPACE_ACTIVITY_LEAD =
  "Continue active reviews or open completed results.";

export const OPERATOR_HOME_WORKSPACE_ARCHIVED_EMPTY_TITLE = "No archived reviews yet.";

export const OPERATOR_HOME_WORKSPACE_ARCHIVED_EMPTY_BODY = "Archived reviews will appear here.";

export const PILOT_COMMAND_CENTER_HEADING = "Architecture review lifecycle";

export const OPERATOR_HOME_WORKSPACE_OVERVIEW_HEADING = "Recent activity";

/** Hero title on `/` — first-run intent chooser until the tenant has a committed architecture review. */
export function resolveOperatorHomeHeroHeading(hasWorkspaceActivity: boolean): string {
  return hasWorkspaceActivity
    ? OPERATOR_HOME_WORKSPACE_OVERVIEW_HEADING
    : OPERATOR_HOME_INTENT_CHOOSER_HEADING;
}

export const PILOT_COMMAND_CENTER_LEAD =
  "Create an architecture review from a design brief, uploaded evidence, or an optional cloud connection.";

/** Hero bridge copy when the tenant has no runs — zero-setup evaluation first. */
export const PILOT_FIRST_HOUR_NO_RUN_BRIDGE_COPY =
  "See a finished architecture review in minutes — no setup required. Start your own when you are ready.";

/** Secondary text link on the home hero when the primary CTA opens the completed sample. */
export const PILOT_COMMAND_CENTER_START_OWN_REVIEW_LINK = "Start your own review";

export const PILOT_COMMAND_CENTER_PRIMARY_CTA = CREATE_ARCHITECTURE_LABEL;

export const PILOT_COMMAND_CENTER_OUTCOMES_HEADING = "What ArchLucid discovers";

export const PILOT_COMMAND_CENTER_OUTCOMES = [
  "Missing dependencies",
  "Hidden risks",
  "Cost drivers",
  "Governance gaps",
  "Evidence gaps",
  "Decision impact",
] as const;

export const PILOT_COMMAND_CENTER_OPTIONAL_SETUP_LABEL = "Optional workspace setup";

/** Ready-state body on the home readiness panel. */
export const OPERATOR_HOME_CONTINUE_SETUP_BODY =
  "No additional setup is required to create or review an architecture.";

/** Compact readiness strip beside primary home choices (single Ready pill — no redundant support phrase). */
export const OPERATOR_HOME_READY_STRIP_LABEL = "Ready to begin";

/** @deprecated Strip no longer shows a second phrase; kept for any lingering imports. */
export const OPERATOR_HOME_READY_STRIP_SUPPORT = "Workspace configured";

export const OPERATOR_HOME_READY_TO_BEGIN_TITLE = "Ready to begin";

export const OPERATOR_HOME_ONE_REQUIRED_ITEM_TITLE = "One required item remains";

export const OPERATOR_HOME_ASSIGN_ADMIN_BLOCKER =
  "Assign a workspace administrator before starting a review.";

export const OPERATOR_HOME_HEALTH_BLOCKER =
  "Confirm platform health before starting a review.";

export const OPERATOR_HOME_SETUP_WORKSPACE_ACCESS_LABEL = "Workspace access";

export const OPERATOR_HOME_SETUP_CLOUD_CONNECTION_LABEL = "Cloud connection";

export const OPERATOR_HOME_SETUP_REVIEWER_INVITATION_LABEL = "Reviewer invitation";

export const OPERATOR_HOME_SETUP_STATUS_READY = "Ready";

export const OPERATOR_HOME_SETUP_STATUS_OPTIONAL = "Optional";

export const OPERATOR_HOME_CONNECT_CLOUD_TITLE = "Connect cloud environment";

export const OPERATOR_HOME_CONNECT_CLOUD_BODY =
  "Import architecture evidence from Azure, AWS, or Google Cloud.";

/** Low-emphasis cloud shortcut beneath the review architecture path. */
export const OPERATOR_HOME_CLOUD_EVIDENCE_LINK = "Have cloud evidence? Connect a cloud environment.";

export const OPERATOR_HOME_CLOUD_CONNECT_ADMIN_HINT =
  "Cloud connection requires workspace administrator access.";

export const OPERATOR_HOME_INVITE_COLLABORATORS_BODY =
  "Invite collaborators when you are ready to share or review work.";

export const OPERATOR_HOME_SETUP_NEXT_OPEN_GUIDE = "Open the first review guide.";

export const OPERATOR_HOME_SETUP_NEXT_CHOOSE_PATH = "Continue the architecture review lifecycle.";

export const OPERATOR_HOME_EXAMPLES_AND_LEARNING_HEADING = "Examples and learning";

export const OPERATOR_HOME_LEARNING_RESOURCES_HEADING = "Learning resources";

export const OPERATOR_HOME_LEARNING_RESOURCES_LEAD =
  "Walk through creation and review examples without starting a live review.";

export const OPERATOR_HOME_SETUP_NEXT_CONNECT_CLOUD = "Connect cloud";

export const OPERATOR_HOME_SETUP_NEXT_INVITE_REVIEWER = "Invite reviewer";

/** Collapsed summary on `/architecture/first-review-guide` optional setup disclosure (TB-679). */
export const ONBOARDING_OPTIONAL_SETUP_COLLAPSED_SUMMARY =
  "Identity, administrator access, platform health, and ROI baseline — optional before your first review.";

/** Post-registration trial handoff on `/architecture/first-review-guide` (TB-679). */
export const GETTING_STARTED_TRIAL_POST_REGISTRATION_LEAD =
  "Confirm trial limits below, then use the checklist on this page or start a review with the sample highlighted on step one.";

/** @deprecated Prefer {@link OPERATOR_HOME_READY_TO_BEGIN_TITLE} on first-run home. */
export const OPERATOR_HOME_SETUP_READINESS_TITLE = "Setup readiness";

export const PILOT_COMMAND_CENTER_STEPS_HEADING = "3 steps";

export const PILOT_COMMAND_CENTER_CONNECT_AZURE = "Connect cloud";

export const PILOT_COMMAND_CENTER_INVITE_REVIEWER = "Invite reviewer";

export const PILOT_PATH_PREVIEW_STEPS = [
  { id: "start", label: "Start with a design or evidence" },
  { id: "review", label: "Review findings and add supporting evidence" },
  { id: "commit", label: "Finalize review" },
] as const;

/** Section B on operator home — optional setup, walkthroughs, and workspace context. */
export const OPERATOR_HOME_WORKSPACE_SETUP_SECTION_TITLE = "Workspace setup";

export const OPERATOR_HOME_ADVANCED_GUIDANCE_TITLE = "Learn the architecture workflow";

export const OPERATOR_HOME_ADVANCED_GUIDANCE_COLLAPSED_SUMMARY =
  "See how ArchLucid moves from goals and evidence to architecture, findings, decisions, and finalized results.";

export const OPERATOR_HOME_EXPLORE_REVIEW_WALKTHROUGH_HEADING = "Architecture workflow";

export const OPERATOR_HOME_EXPLORE_REVIEW_WALKTHROUGH_LEAD =
  "See how ArchLucid moves from goals and evidence to architecture, findings, decisions, and finalized results.";

export const OPERATOR_HOME_EXPLORE_REVIEW_WALKTHROUGH_CTA = "View workflow";

export const OPERATOR_HOME_DEMO_OPERATIONS_TITLE = "Demo operations";

export const OPERATOR_HOME_DEMO_OPERATIONS_COLLAPSED_SUMMARY =
  "Internal demo readiness checks and reset controls.";

export const OPERATOR_HOME_WORKSPACE_STATUS_TITLE = "Workspace status";

export const OPERATOR_HOME_WORKSPACE_STATUS_COLLAPSED_SUMMARY =
  "ROI baseline and workspace readiness signals.";

export const OPERATOR_HOME_WORKSPACE_STATUS_COLLAPSED_SUMMARY_FIRST_RUN =
  "Workspace readiness signals.";

export const NEW_REVIEW_SAMPLE_ESCAPE_CTA =
  "See a completed signed review record and its evidence trail.";

export const NEW_REVIEW_SAMPLE_ESCAPE_HINT =
  "Skip setup and explore a finished signed review record.";

/** TB-2151 — pre-intake specimen preview on `/architecture/reviews/new` and home start CTAs. */
export const REVIEWS_NEW_SPECIMEN_PREVIEW_TITLE = "See what you will get";

export const REVIEWS_NEW_SPECIMEN_PREVIEW_LEAD =
  "Open the Claims Intake Demo specimen — a signed review record with findings — before you commit to intake.";

export const REVIEWS_NEW_SPECIMEN_PREVIEW_PRIMARY_CTA = "Open sample signed review record";

export const REVIEWS_NEW_SPECIMEN_PREVIEW_FINDINGS_LINK = "View sample findings";

/** Streamlined first-run lead on `/architecture/reviews/new` — avoids path-switcher jargon above the fold. */
export const REVIEWS_NEW_PAGE_LEAD = CLOUD_NEUTRAL_PRIMARY_COPY.reviewsNewPageLead;

export const PRODUCT_CONCEPTS_GLOSSARY_DIALOG_TITLE = "Product concepts";

export const PRODUCT_CONCEPTS_GLOSSARY_DIALOG_DESCRIPTION =
  "Short definitions for terms you will encounter in your architecture reviews — open on demand.";

export const BUYER_HOME_START_CTO_DEMO_HEADING = "Open example review";

export const BUYER_HOME_START_CTO_DEMO_LEAD =
  "Open a completed sample architecture review.";

export const BUYER_HOME_START_CTO_DEMO_CTA = "Open example review";

export const BUYER_HOME_START_CTO_DEMO_ARIA = "Open example review — sample review walkthrough";

export const BUYER_CTO_DEMO_TOUR_HEADING = "CTO demo tour";

export const BUYER_CTO_DEMO_TOUR_ARIA = "CTO demo guided tour";

export const BUYER_CTO_DEMO_TOUR_BACK_CTA = "Back";

export const BUYER_CTO_DEMO_TOUR_NEXT_CTA = "Next";

export const BUYER_CTO_DEMO_TOUR_END_CTA = "End tour";

export const BUYER_CTO_DEMO_TOUR_COLLAPSE_CTA = "Minimize";

export const BUYER_CTO_DEMO_TOUR_EXPAND_CTA = "Expand CTO demo tour";

export const BUYER_CTO_DEMO_READINESS_HEADING = "Demo readiness";

/** Internal admin panel region — must not say "CTO demo" in screenshare or a11y trees (TB-1410). */
export const BUYER_CTO_DEMO_READINESS_ARIA = "Internal demo readiness checks";

export const BUYER_CTO_DEMO_READINESS_READY_LABEL = "Demo ready";

export const BUYER_CTO_DEMO_READINESS_STATIC_LABEL = "Demo ready (static fallback)";

export const BUYER_CTO_DEMO_READINESS_NOT_READY_LABEL = "Demo not ready";

export const BUYER_CTO_DEMO_READINESS_CHECKING_LABEL = "Checking demo readiness…";

export const BUYER_CTO_DEMO_PREPARING_LABEL = "Preparing demo…";

export const BUYER_CTO_DEMO_START_FAILED_MESSAGE = "We could not start the demo right now. Please try again.";

export const BUYER_CTO_DEMO_ENVIRONMENT_UNAVAILABLE_MESSAGE =
  "The demo environment is temporarily unavailable.";

export const BUYER_CTO_DEMO_SAMPLE_MODE_NOTICE =
  "Showing a saved example review for this walkthrough.";

export const BUYER_CTO_DEMO_TRY_AGAIN_CTA = "Try again";

export const BUYER_CTO_DEMO_CONTACT_SUPPORT_CTA = "Contact support";

export const INTERNAL_DEMO_READINESS_PAGE_LEAD =
  "Internal demo diagnostics, showcase controls, and readiness rechecks for ArchLucid operators.";

export const INTERNAL_DEMO_READINESS_DIAGNOSTICS_LINK = "Open diagnostics dashboard";

export const BUYER_CTO_DEMO_READINESS_REFRESH_CTA = "Recheck readiness";

/** Buyer-facing readiness copy — never mention demo seed, static operator mode, or env flags. */
export const BUYER_DEMO_READINESS_SAMPLE_READY_DETAIL = "Sample review is ready.";

export const BUYER_DEMO_READINESS_SAMPLE_UNAVAILABLE_DETAIL = "Sample review is temporarily unavailable.";

export const BUYER_DEMO_READINESS_SAMPLE_PREPARING_DETAIL =
  "Sample review is being prepared. Try again in a moment.";

/** Presenter/operator diagnostics — gated behind internal demo-operator tooling. */
export const BUYER_DEMO_READINESS_OPERATOR_SHOWCASE_API_MISSING =
  "Showcase review not reachable — start the API with demo seed or enable static operator mode.";

export const BUYER_DEMO_READINESS_OPERATOR_SHOWCASE_NOT_FINALIZED =
  "Showcase review exists but is not finalized — run demo seed or finalize the review.";

export const BUYER_DEMO_READINESS_OPERATOR_API_START_REQUIRED =
  "API health check failed — start ArchLucid.Api before the CTO demo.";

export const BUYER_DEMO_READINESS_OPERATOR_AUTH_REQUIRED =
  "Sign in or enable demo/static operator flags before presenting live API data.";

export const BUYER_DEMO_READINESS_BUYER_API_UNAVAILABLE = "Service is temporarily unavailable.";

export const BUYER_DEMO_READINESS_BUYER_AUTH_REQUIRED = "Sign in to continue.";

export const BUYER_CTO_DEMO_RESET_CTA = "Reset demo";

export const BUYER_CTO_DEMO_RESET_BUSY_CTA = "Resetting demo…";

export const BUYER_CTO_DEMO_RESET_SUCCESS = "Demo reset — restarting the five-step tour.";

export const BUYER_CTO_DEMO_TOUR_NOTES_HIDE_CTA = "Hide presenter notes";

export const BUYER_CTO_DEMO_TOUR_NOTES_SHOW_CTA = "Show presenter notes";

export const BUYER_CTO_DEMO_TOUR_NOTES_FULL_CTA = "Full script";

export const BUYER_CTO_DEMO_TOUR_NOTES_SUMMARY_CTA = "Summary";

export const BUYER_CTO_DEMO_QUESTIONS_SHOW_CTA = "CTO questions";

export const BUYER_CTO_DEMO_QUESTIONS_HIDE_CTA = "Hide CTO questions";

export const BUYER_CTO_DEMO_RECAP_HEADING = "Executive recap for follow-up";

export const BUYER_CTO_DEMO_RECAP_COPY_CTA = "Copy recap";

export const BUYER_CTO_DEMO_RECAP_DOWNLOAD_CTA = "Download recap (.md)";

export const BUYER_CTO_DEMO_RECAP_BOARD_PACKET_CTA = "Download board packet";

export const BUYER_CTO_DEMO_RECAP_BOARD_PACKET_BUSY_CTA = "Board packet…";

export const BUYER_CTO_DEMO_COMPARE_DRIFT_LABEL = "Optional 3b — Show drift";

export const BUYER_CTO_DEMO_COMPARE_DRIFT_CTA = "See what changed →";

export const BUYER_CTO_DEMO_PANIC_SCRIPT_HEADING = "Offline fallback";

export const BUYER_CTO_DEMO_PANIC_SCRIPT_BODY =
  "If the API goes down: say \"Let me switch to our pre-loaded version — same data, same output.\" Then click Enable offline fallback below. Navigate to Step 1 using keyboard shortcut 1. Continue the walkthrough — all five steps work offline.";

export const BUYER_CTO_DEMO_PANIC_ENABLE_CTA = "Enable offline fallback";

export const BUYER_CTO_DEMO_PANIC_ENABLED_LABEL = "Offline fallback active";

export const BUYER_SIMULATOR_TRUST_BADGE_LABEL =
  "Rule-based analysis — findings match live-mode structure; cost estimates are illustrative.";

export const BUYER_SIMULATOR_TRUST_BADGE_TOOLTIP =
  "Simulator mode runs the full four-agent pipeline using rule-based inference. Findings have the same structure as live mode; cost estimates are illustrative.";

export const BUYER_CTO_DEMO_AUDIT_EXPORT_CTA = "Export audit trail (CSV)";

export const BUYER_CTO_DEMO_AUDIT_EXPORT_BUSY = "Exporting…";

export const BUYER_CTO_DEMO_AUDIT_EXPORT_SUCCESS =
  "Audit trail exported — attach to your GRC record.";

export const BUYER_MANIFEST_DELIVERABLES_HEADING = "Deliverables";

export const BUYER_MANIFEST_DELIVERABLE_EXECUTIVE_PDF_TITLE = "Executive PDF";

export const BUYER_MANIFEST_DELIVERABLE_EXECUTIVE_PDF_DESC =
  "Sponsor-ready one-pager with verdict, top risks, and recommended actions.";

export const BUYER_MANIFEST_DELIVERABLE_DOCX_TITLE = "Architecture review export (DOCX)";

export const BUYER_MANIFEST_DELIVERABLE_DOCX_DESC =
  "Full review for architecture board and GRC teams.";

export const BUYER_MANIFEST_DELIVERABLE_ZIP_TITLE = "Review bundle (ZIP)";

export const BUYER_MANIFEST_DELIVERABLE_ZIP_DESC =
  "All signed artifacts, evidence index, and review record in one archive.";

export const BUYER_MANIFEST_DELIVERABLE_MARKDOWN_TITLE = "Decision receipt (Markdown)";

export const BUYER_MANIFEST_DELIVERABLE_MARKDOWN_DESC =
  "Machine-readable record of all decisions in this review.";

export const BUYER_CTO_DEMO_DATA_SOURCE_LIVE_LABEL = "Live data";

export const BUYER_CTO_DEMO_DATA_SOURCE_SAMPLE_LABEL = "Sample data — Claims Intake showcase";

export const QUICK_REVIEW_SAMPLE_BRIEF_CAPTION = "Sample — edit freely";

export const COMMAND_PALETTE_START_CTO_DEMO_LABEL = "Start CTO demo tour";

export const COMMAND_PALETTE_RESET_DEMO_LABEL = "Reset demo";

export const BUYER_CTO_DEMO_TOUR_KEYBOARD_HINT =
  "Press 1–5 to jump steps · E — explore · P — presenter notes · S — spotlight · 0 — offline · Shift+R — hard reset";

export const BUYER_CTO_DEMO_TOUR_AUTOPLAY_ON_CTA = "Auto-play";

export const BUYER_CTO_DEMO_TOUR_AUTOPLAY_OFF_CTA = "Stop auto";

export const BUYER_CTO_DEMO_TOUR_AUTOPLAY_BADGE = "Auto";

export const BUYER_CTO_DEMO_SMOKE_CHECK_CTA = "Pre-call check";

export const BUYER_CTO_DEMO_SMOKE_CHECK_RECHECK_CTA = "Re-check";

export const BUYER_CTO_DEMO_SOFT_RESTART_CTA = "Back to step 1";

export const BUYER_CTO_DEMO_RECAP_SNAPSHOT_COPY_CTA = "Copy snapshot link";

export const BUYER_CTO_DEMO_PANIC_BANNER =
  "Offline mode active — cached showcase data in use";

export const BUYER_CTO_DEMO_PANIC_DISABLE_CTA = "Disable";

export const BUYER_CTO_DEMO_READ_ONLY_SNAPSHOT_BANNER =
  "Shared read-only view — this link is safe to forward after the live demo.";

export function buyerCtoDemoRemainingMinutesLabel(minutes: number): string {
  return `~${minutes} min remaining`;
}

export const BUYER_CTO_DEMO_RUN_OF_SHOW_DOWNLOAD_CTA = "Download run-of-show";

export const BUYER_CTO_DEMO_SEGREGATION_CALLOUT_HEADING = "Segregation of duties";

export const BUYER_CTO_DEMO_SEGREGATION_CALLOUT_BODY =
  "The review requester and approver are different principals — neither can unilaterally finalize the review.";

export const BUYER_CTO_DEMO_AUDIT_DEMO_FILTER_BANNER =
  "Showing demo-relevant events only — create, execute, commit, and export milestones.";

export const BUYER_CTO_DEMO_AUDIT_SHOW_ALL_EVENTS_CTA = "Show all events";

export const BUYER_CTO_DEMO_EXECUTIVE_PRINT_CTA = "Print executive summary";

export const BUYER_CTO_DEMO_STATIC_PRESENTER_BANNER =
  "Presenter: all five demo steps are running on cached showcase data — live API is unavailable or static fallback is enabled.";

export const BUYER_CTO_DEMO_LATENCY_OK = "Within demo latency budget";

export const BUYER_CTO_DEMO_LATENCY_EXCEEDED = "Taking longer than expected — switch to example review.";

export const BUYER_HOME_EXAMPLE_PACKAGE_SHORTCUTS_ARIA = "Example review shortcuts";

export const BUYER_HOME_EXAMPLE_PACKAGE_HEADING = "Example review";

export const BUYER_HOME_EXAMPLE_PACKAGE_LEAD =
  "Open a completed example to see the output, then start your own review.";

export const BUYER_HOME_EXAMPLE_EXPLORE_LINK = "Explore example";

export const BUYER_HOME_WELCOME_HEADING = "Explore one governed architecture review";

export const BUYER_HOME_WELCOME_LEAD =
  "Start with the executive view, then the signed review record, audit trail, and prioritized findings.";

/** Canonical home reviews zone heading — both operator shells (TB-347). */
export const OPERATOR_HOME_RECENT_REVIEWS_HEADING = "Recent reviews";

export const BUYER_HOME_REVIEWS_SECTION_HEADING = OPERATOR_HOME_RECENT_REVIEWS_HEADING;

export const BUYER_HOME_SECONDARY_CTA = "Create from evidence";

/** Help guide step 1 — executive-first walkthrough (distinct from home hero CTA). */
export const BUYER_HELP_EXECUTIVE_STEP_CTA = "Open executive summary";

export const BUYER_HOME_SETUP_SECTION_HEADING = "Start a new review";

export const BUYER_RUNS_DASHBOARD_RECENT_LABEL = "Featured finalized review";

export const BUYER_RUNS_DASHBOARD_RECENT_LABEL_EMPTY = "Architecture reviews";

export const BUYER_RUNS_DASHBOARD_RECENT_SUMMARY =
  "Track findings, evidence, decisions, and finalized outputs from your architecture reviews.";

export const BUYER_RUN_INSPECTOR_FINALIZED_LABEL = "Example · finalized";

export const BUYER_SEED_EXAMPLE_REVIEW_CTA = "Load the example review";

export const BUYER_SEED_EXAMPLE_REVIEW_HINT =
  "Loads the interactive example review so you can explore outputs before uploading your own architecture context.";

export const BUYER_RUNS_GETTING_STARTED_GUIDE = "getting-started guide";

export const BUYER_RUNS_LIST_GLOSSARY_LEAD =
  "Open a review for the signed record, evidence, findings, and deliverables.";

export const BUYER_RUNS_LIST_MALFORMED_HEADING = "Reviews could not be displayed.";

export const BUYER_RUNS_LIST_MALFORMED_BODY =
  "Try reloading the page. If this continues, contact support.";

export const BUYER_NEW_REVIEW_TOAST_CATEGORY = CREATE_ARCHITECTURE_LABEL;

/** Form section heading when the user is defining the governed review artifact. */
export const CREATE_REVIEW_PACKAGE_HEADING = "Create review";

export const BUYER_START_ARCHITECTURE_REVIEW_CTA = "Start an architecture review";

export const RUNS_LIST_EMPTY_PRIMARY_PATH_TITLE = "Start a review";

export const RUNS_LIST_EMPTY_PRIMARY_PATH_DESCRIPTION =
  "Create a review from your own architecture brief, diagram, IaC, or evidence.";

export const RUNS_LIST_EMPTY_SAMPLE_PATH_TITLE = "Explore a sample";

export const RUNS_LIST_EMPTY_SAMPLE_PATH_DESCRIPTION =
  "Open a completed sample review or run a demo review to see findings, evidence traceability, and exports.";

export const RUNS_LIST_VIEW_SAMPLE_PACKAGE_CTA = "View sample review";

export const BUYER_ONBOARDING_PAGE_TITLE = "First review guide";

export const BUYER_ONBOARDING_PAGE_LEAD =
  "Create, evaluate, and finalize your first evidence-backed architecture review.";

export const FIRST_REVIEW_GUIDE_PROGRESS_SECTION_TITLE = "Your first review";

export const FIRST_REVIEW_GUIDE_OUTCOMES_TITLE = "What you will have";

export const FIRST_REVIEW_GUIDE_OUTCOMES: readonly string[] = [
  "A finalized architecture review record",
  "Evidence-backed findings",
  "Recorded decisions and exceptions",
  "A shareable review",
] as const;

export const FIRST_REVIEW_GUIDE_REQUIRED_SETUP_TITLE = "Required before you start";

export const FIRST_REVIEW_GUIDE_OPTIONAL_SETUP_TITLE = "Optional workspace setup";

export const FIRST_REVIEW_GUIDE_OPTIONAL_SETUP_LEAD =
  "These settings can improve security, administration, and reporting, but most are not required to begin your first review.";

export const FIRST_REVIEW_GUIDE_GET_MORE_TITLE = "Get more from ArchLucid";

export const FIRST_REVIEW_GUIDE_GET_MORE_ROI_COPY =
  "Add an ROI baseline to estimate savings and support executive reporting.";

export const FIRST_REVIEW_GUIDE_HELP_TITLE = "Need help?";

export const FIRST_REVIEW_GUIDE_TEMPLATE_LABEL = "Review template";

export const FIRST_REVIEW_GUIDE_TEMPLATE_CHOOSE_ACTION = "Choose template";

export const FIRST_REVIEW_GUIDE_NEXT_STEP_LABEL = "Next step";

export const ONBOARDING_OPTIONAL_SETUP_DISMISS_LABEL = "Dismiss optional setup";

export const ONBOARDING_OPTIONAL_SETUP_DISMISS_DETAIL =
  "Hides this checklist on this device. It does not validate or complete the underlying settings.";

export const BUYER_ONBOARDING_NAV_TOOLTIP = "First review guide — checklist and milestones";

export const OPERATOR_HOME_OPEN_FIRST_REVIEW_GUIDE_CTA = "Open guide";

/** Shown on `/architecture/first-review-guide` when the caller is not a workspace admin (TB-678). */
export const ONBOARDING_WORKSPACE_SETUP_ADMIN_DELEGATION =
  "Workspace identity and ROI setup requires a workspace admin. Ask your administrator to finish optional setup when you are ready.";

export const BUYER_ONBOARDING_WALKTHROUGH_HELP_LINK = "Architecture review walkthrough";

export const BUYER_MANIFEST_SUMMARY_LOAD_ERROR_HEADING = "Review record summary could not be loaded.";

export const BUYER_MANIFEST_SUMMARY_MALFORMED_HEADING = "Review record summary response was not usable.";

export const BUYER_MANIFEST_SUMMARY_MISSING_HEADING = "Review record summary missing.";

export const COMPARE_REVIEW_RECORD_DIFF_OPERATOR_INTRO =
  "Pretty-printed JSON review record documents for each architecture review. Red and green lines are removed or added; unchanged lines provide context around edits.";

export const BUYER_PIPELINE_IN_PROGRESS_LABEL = "In progress";

export const BUYER_COMPARE_TECHNICAL_APPENDIX_LABEL = "Detailed comparison appendix";

export const BUYER_SEALED_MANIFEST_TOOLTIP =
  "Finalized signed review record: hash-verified, write-locked record after governance approval — not informal draft text.";

export const BUYER_PRICING_FAIR_USE_OVERAGE_NOTE = "Higher volumes are handled through procurement terms.";

export const BUYER_GOVERNANCE_CHANGE_MANAGEMENT_FOOTNOTE =
  "Production execution remains controlled by the customer's enterprise change-management process.";

export const BUYER_GOVERNANCE_APPROVAL_RECORD_LEAD =
  "Governance approval — signed review record approved with monitored PHI minimization control.";

export const BUYER_GOVERNANCE_GOVERNED_USE_SCOPE =
  "Approved for implementation planning, subject to enterprise change control — not a production deployment authorization.";

export const BUYER_ASK_PAGE_TITLE = "Evidence-backed review questions";

export const BUYER_ASK_PAGE_HERO =
  "Ask plain-language questions about a finalized review. Answers cite review evidence when available and do not replace formal governance records.";

export const BUYER_ASK_CARD_TITLE = "Ask a question";

export const BUYER_ASK_SUGGESTED_QUESTIONS_HEADING = "Suggested questions";

export const BUYER_ASK_SCOPE_PREFIX = "Review:";

export const BUYER_ASK_SYNTHETIC_SAMPLE_HINT = "Using the sample review for this workspace.";

export const BUYER_ASK_CONVERSATION_EMPTY_TITLE = "No questions yet.";

export const BUYER_ASK_CONVERSATION_EMPTY_BODY =
  "Ask a question to start an evidence-backed Q&A exchange.";

export const BUYER_ASK_RETRIEVAL_DEGRADED_LABEL =
  "Answer quality may be reduced when evidence search is limited.";

export const BUYER_GOVERNANCE_PAGE_TITLE = "Governance workflow";

export const BUYER_GOVERNANCE_STATUS_BANNER_TITLE = "Governance approval record";

export const BUYER_GOVERNANCE_STATUS_BANNER_BODY =
  "Approved for governed use with monitored PHI minimization control. Production deployments remain governed by enterprise change management.";

export const BUYER_GOVERNANCE_STATUS_BANNER_VIEW_APPROVAL = "View approval record";

export const BUYER_GOVERNANCE_STATUS_BANNER_VIEW_DISPOSITIONS = "View dispositions";

export const BUYER_GOVERNANCE_STATUS_BANNER_VIEW_AUDIT = "View audit trail";

export const BUYER_GOVERNANCE_FINDINGS_PAGE_TITLE = "Findings";

export const BUYER_GOVERNANCE_FINDINGS_PAGE_LEAD =
  "Track architecture risks created from findings, waivers, exceptions, and governance decisions for this review.";

export const BUYER_RISK_REGISTER_EMPTY_TITLE = "No risks recorded for this review";

export const BUYER_RISK_REGISTER_EMPTY_BODY =
  "Risks appear here when accepted findings, waivers, exceptions, or governance decisions create follow-up risk items.";

export const BUYER_RISK_REGISTER_EMPTY_SECONDARY_ACTION = "View governance decisions";

export const BUYER_RISK_EXCEPTIONS_PAGE_TITLE = "Exceptions";

export const BUYER_RISK_EXCEPTIONS_PAGE_LEAD = RISK_EXCEPTIONS_PAGE_SUBTITLE;

export const BUYER_RISK_EXCEPTIONS_EMPTY_TITLE = "No active risk exceptions";

export const BUYER_RISK_EXCEPTIONS_EMPTY_BODY = RISK_EXCEPTIONS_EMPTY_BODY;

export const BUYER_RISK_EXCEPTIONS_EMPTY_TERTIARY_ACTION = CREATE_ARCHITECTURE_LABEL;

export const BUYER_GOVERNANCE_FINDINGS_RISKS_SECTION_TITLE = "Monitored risks";

export const BUYER_GOVERNANCE_DECISION_REGISTER_TITLE = "Decision register";

export const BUYER_GOVERNANCE_DECISION_REGISTER_LEAD =
  "Browse architecture decisions locked with each signed review record — category, supporting findings, confidence, and lineage.";

export const BUYER_GOVERNANCE_FINDINGS_VIEW_OBSERVATION_CTA = "View finding and evidence";

export const BUYER_GOVERNANCE_FINDINGS_VIEW_EVIDENCE_TRAIL_CTA = "View evidence trail";

export const BUYER_ASK_GROUNDING_ONCE =
  "Answers are scoped to selected review evidence. Validate conclusions against the finalized signed review record — Ask does not replace formal governance records.";

export const BUYER_ASK_REVIEW_ANCHORS_LINE =
  "Replies on this review can include quick links to executive summary, review record, policy basis, evidence trail, and audit anchors where available.";

export const BUYER_ASK_SHOWCASE_ANCHORS_LINE = BUYER_ASK_REVIEW_ANCHORS_LINE;

export const BUYER_COMPARE_SECONDARY_PAGE_LEAD =
  "Load a prior vs. later review pair to see an explicit delta between signed review records.";

export const BUYER_REVIEW_MONITORED_RISK_COUNT_CLARIFIER =
  "The monitored PHI risk is counted among findings but does not block approval — it remains under active oversight.";

export const BUYER_MANIFEST_BUNDLE_DOWNLOAD_DETAILS_SUMMARY = "Download finalized review";

export const BUYER_MANIFEST_BUNDLE_DOWNLOAD_ZIP_NOTE = "Delivered as a ZIP archive for diligence and archiving.";

export const BUYER_PRICING_ARCHITECTURE_PROOF_ENGINE_CLAUSE =
  "for governed architecture review, evidence traceability, and audit-ready signed review records";

export const BUYER_FINDINGS_COUNT_WITH_MONITORED_RISK = (findingCount: number, warningCount: number): string => {
  const findingsWord = findingCount === 1 ? "finding" : "findings";
  const riskWord = warningCount === 1 ? "risk" : "risks";

  return `${findingCount} ${findingsWord}, including ${warningCount} monitored ${riskWord} under active review (non-blocking).`;
};

export const BUYER_COMPARE_OPEN_FULL_LINK_LABEL = "View review change comparison";

export const BUYER_MARKETING_PRICING_PAGE_INTRO =
  "Start with one architect, grow into a governed review practice, and use Enterprise when procurement, SSO, or private deployment is required.";

/** Sales-led posture: no self-serve checkout; quote and order form finalize commercial terms. */
export const BUYER_SALES_LED_PRICING_NOTE =
  "ArchLucid is sold through guided evaluation and procurement — request a quote for packaging, fair-use limits, and diligence artifacts. List tiers illustrate scope; they are not a live marketplace checkout.";

/** @deprecated Use {@link BUYER_SALES_LED_PRICING_NOTE}. */
export const BUYER_SALES_LED_V1_PRICING_NOTE = BUYER_SALES_LED_PRICING_NOTE;

/** Forbidden-state copy when a surface requires workspace administrator access. */
export const FORBIDDEN_WORKSPACE_ADMIN_ACCESS_MESSAGE =
  "This page requires a workspace administrator. Sign in with an admin account or API key.";

export const FORBIDDEN_WORKSPACE_ADMIN_ACCESS_MESSAGE_SHORT =
  "This page requires a workspace administrator.";

/** Compact early-adopter banner — one-line summary above expandable full terms on /pricing. */
export const BUYER_EARLY_ADOPTER_PRICING_BANNER_SUMMARY =
  "Current pricing is discounted during the early-access period and locked for the life of your initial subscription.";

/** Early-access pricing transparency — expanded detail on public /pricing. */
export const BUYER_EARLY_ADOPTER_PRICING_NOTE =
  "Early adopter pricing. Current prices reflect ArchLucid's early-access period. List prices are intentionally set at approximately 50% of fair value to reward early adopters who help us build our first reference cases. Prices will increase as we publish independent security attestations and customer case studies — your rate is locked for the life of your initial subscription.";

/** Outcome-led value proposition for marketing/demo surfaces (one problem, one proof export). */
export const BUYER_OUTCOME_LED_VALUE_PROPOSITION =
  "Cut architecture review cycle time with an evidence-backed proof export — signed review record, findings, audit trail, and sponsor-ready readout — not a chat transcript.";

export const BUYER_ASK_UNSTRUCTURED_EXECUTIVE_FALLBACK_LEAD =
  "The answer below is scoped to this review's indexed evidence.";

/** Residual-risk monitoring metadata for the Claims Intake showcase review. */
export const BUYER_SHOWCASE_RESIDUAL_RISK_OWNER = "Request owner";

export const BUYER_SHOWCASE_RESIDUAL_RISK_MONITORING_CADENCE = "Weekly exception-volume sampling";

export const BUYER_SHOWCASE_RESIDUAL_RISK_NEXT_REVIEW = "2026-02-14";

export const BUYER_SHOWCASE_APPROVER_ROLE = "Architecture approver";

export const BUYER_SHOWCASE_REQUEST_OWNER_ROLE = "Request owner";

export const BUYER_SHOWCASE_POLICY_PACK_LABEL = "Healthcare Claims Policy Pack v3.4.1";

export const BUYER_SHOWCASE_APPROVAL_UTC = "2026-01-14T22:05:00.000Z";

/** Post-approval finding lead when the parent review is finalized. */
export const BUYER_FINDING_POST_APPROVAL_LEAD =
  "Residual PHI minimization risk accepted with monitoring as part of the finalized Claims Intake review.";

export const BUYER_FINDING_POST_APPROVAL_VALIDATION =
  "Recorded acceptance: ingress classification validated, adapter boundaries bounded, OCR bypass monitoring active, and weekly exception-volume review assigned to the residual-risk owner.";

export const BUYER_AUDIT_TIMELINE_INTRO = "Recorded timeline for this review.";

export const BUYER_AUDIT_TRAIL_COMPLETE_HEADING = "Audit trail for this review";

/** Buyer completion card on audit results — scope framing without "complete" overclaim (BDA-008). */
export const BUYER_AUDIT_PACKAGE_READY_LEAD =
  "Decisions, signed review record, evidence trail, governance approval, and audit events are available for this review.";

export const BUYER_AUDIT_SYSTEM_EVENTS_EXPLANATION =
  "System-recorded events capture automated lifecycle steps.";

export const BUYER_AUDIT_DOWNLOAD_CTA = "Download governance evidence bundle";

export const BUYER_EVIDENCE_CHAIN_SOURCE_LINE =
  "Persisted evidence chain pointers for this finding (review record version, snapshots, and trace ids).";

export const BUYER_COMPARE_REVIEW_RECORD_DIFF_INTRO =
  "Pretty-printed review record JSON for each review. Red and green lines are removed or added; unchanged lines provide context around edits.";

export const BUYER_COMPARE_REVIEW_RECORD_DIFF_LOADING_HEADING = "Loading review record documents.";

export const BUYER_COMPARE_REVIEW_RECORD_DIFF_LOADING_BODY = "Fetching both review records for diff…";

export const BUYER_WHY_ARCHLUCID_SOURCES_LINE =
  "Aggregated sponsor-facing proof from measured ROI, sponsor evidence pack, value report, and aggregate explanation services.";

/** Default matches Retail baseline seed wired by `/why-archlucid` (TB-1306 Contoso-labeled-live). */
export const BUYER_WHY_ARCHLUCID_SPONSOR_PACK_SOURCE_LINE =
  "Aggregated proof from the evidence pack service — paired with the example Retail baseline review below.";

export const BUYER_AUDIT_ENTERPRISE_WORKSPACE_LEAD =
  "When your team is ready for tenant-backed governed reviews, procurement and workspace onboarding use a separate request flow.";

export const BUYER_AUDIT_ENTERPRISE_WORKSPACE_FOLLOWUP =
  "Use this section when you are ready to discuss tenant-backed workspaces and production onboarding.";

export const BUYER_VIEWING_AS_DEMO_ROLE = "Role: Architecture reviewer";

export const BUYER_SCOPE_SAMPLE_WORKSPACE_LABEL = "Sample workspace";

export const BUYER_WORKSPACE_SHORT_NAME = "Claims Intake";

/** Compact top-bar label for the dev/sample workspace selector button. */
export const BUYER_SCOPE_SAMPLE_WORKSPACE_COMPACT_LABEL = "Claims Intake Demo";

/** Full sample workspace name shown in the scope dropdown and accessible labels. */
export const BUYER_SCOPE_SAMPLE_WORKSPACE_FULL_NAME = "Claims Intake Modernization";

export const BUYER_SCOPE_SAMPLE_WORKSPACE_DEMO_HINT = "Demo data only. Your workspace is unchanged.";

export const BUYER_SCOPE_SAMPLE_WORKSPACE_TITLE = "Sample workspace";

export const BUYER_SCOPE_SAMPLE_WORKSPACE_BODY =
  "Workspace switching is disabled in this local demo. In a connected tenant, this menu lets you switch between workspaces and projects.";

export const BUYER_SCOPE_SAMPLE_WORKSPACE_CONNECTED_HINT =
  "In a connected tenant, this menu lets you switch between workspaces and projects.";

export const BUYER_SCOPE_SAMPLE_WORKSPACE_DETAILS = "Workspace details";

/** Shown only inside the sample-workspace popover workspace-details disclosure. */
export const BUYER_SCOPE_SAMPLE_WORKSPACE_TECHNICAL_DETAILS =
  "Scope headers (tenant, workspace, project) route API requests. The workspace directory API is not available in this local demo, so the sample workspace stays active.";

/** Closes the workspace scope popover (`role="dialog"`); not a workflow advance or permanent hide. */
export const BUYER_SCOPE_SWITCHER_CLOSE = "Close";

export const BUYER_SCOPE_SWITCHER_LEARN_ABOUT_WORKSPACES = "Workspace guide";

export const BUYER_SCOPE_SWITCHER_CONNECTED_INTRO = "Choose a workspace and project.";

export const BUYER_SCOPE_CURRENT_WORKSPACE_TITLE = "Current workspace";

export const BUYER_SCOPE_CURRENT_WORKSPACE_BODY =
  "You are viewing the active workspace and project for this tenant.";

export const BUYER_SCOPE_SWITCHER_LOAD_ERROR =
  "We couldn't load workspaces for this tenant. Try again or contact support if the problem continues.";

/** Legacy intro — prefer {@link BUYER_SCOPE_SAMPLE_WORKSPACE_BODY} in sample popovers. */
export const BUYER_SCOPE_SWITCHER_INTRO =
  "This walkthrough uses the Claims Intake sample workspace. Switching live tenant scope is not required.";

/** Legacy list-unavailable copy — keep for technical disclosures only. */
export const BUYER_SCOPE_LIST_UNAVAILABLE =
  "Workspace directory is unavailable in this environment. The sample workspace remains active for this session.";

export const BUYER_APPROVED_WITH_MONITORING_DEFINITION =
  "Approved for implementation planning; one residual risk accepted with active monitoring; no blocking issues.";

export const BUYER_FINDING_EVALUATION_CONFIDENCE_EXPLANATION =
  "Finding evaluation confidence — how strongly cited policy rules and evidence support this specific finding (not overall product accuracy).";

export const BUYER_GRAPH_WHAT_THIS_PROVES =
  "Trace any accepted risk to its supporting evidence — from source context through policy basis, decision, approval, signed review record, and audit record.";

export const BUYER_VALUE_REPORT_PAGE_TITLE = "Executive value report";

export const BUYER_VALUE_REPORT_PAGE_SUBTITLE =
  "Generate sponsor-ready summaries of finalized reviews, findings, governance activity, and estimated ROI.";

export const BUYER_VALUE_REPORT_OUTCOME_LEAD =
  "Choose a reporting period, preview what the sponsor report will include, and export when finalized reviews exist in that window.";

export const BUYER_VALUE_REPORT_HOW_IT_WORKS_TITLE = "How value reports work";

export const BUYER_VALUE_REPORT_HOW_IT_WORKS_DETAILS =
  "Value reports aggregate finalized reviews, governance activity, and ROI estimates for the selected UTC period. Exports unlock after at least one finalized review falls in the window. Use Pilot outcomes, ROI summary, or Review scorecard for deeper drill-downs.";

export const BUYER_VALUE_REPORT_PERIOD_UTC_HELP = "Times are in UTC for consistent reporting.";

export const BUYER_VALUE_REPORT_PERIOD_EXPORTS_TITLE = "Report period and exports";

export const BUYER_VALUE_REPORT_EXPORT_DISABLED_HELP =
  "Exports are available after at least one finalized review exists in this period.";

export const BUYER_VALUE_REPORT_INCLUDES_TITLE = "Sponsor report includes";

export const BUYER_VALUE_REPORT_INCLUDES_ITEMS = [
  "Finalized reviews",
  "Key findings",
  "Governance activity",
  "Decision summary",
  "ROI estimate",
  "Recommended next actions",
] as const;

export const BUYER_VALUE_REPORT_EMPTY_TITLE = "No finalized reviews in this report period";

export const BUYER_VALUE_REPORT_EMPTY_DESCRIPTION =
  "Finalize at least one review in the selected period to generate a sponsor value report.";

export const BUYER_VIEW_SAMPLE_VALUE_REPORT_CTA = "View sample value report";

export const BUYER_VALUE_REPORT_DEMO_SAMPLE_NOTE = "Demo workspace: sample report output is available.";

export const BUYER_VALUE_REPORT_PREVIEW_TITLE = "Report preview";

export const BUYER_FINDING_SUMMARY_DECISION_IMPACT_LABEL = "Decision impact";

export const BUYER_FINDING_SUMMARY_NEXT_STEP_LABEL = "What to do next";

export const BUYER_GRAPH_TECHNICAL_CONTROLS_DISCLOSURE = "Graph options and filters";

export const BUYER_EXECUTIVE_DATA_SOURCE_NOTE = "Source: finalized reviews in this workspace.";

export const BUYER_EXECUTIVE_SUMMARY_LOAD_ERROR =
  "We couldn't load the executive summary. Try again or contact support with the reference below.";

export const BUYER_EXECUTIVE_SCORECARD_WINDOW_HELP = "Showing the selected time range.";

export const BUYER_EXECUTIVE_COMPLIANCE_DRIFT_TREND_DESCRIPTION =
  "Daily trend of findings opened when reviews capture snapshots versus findings resolved through governance review.";

export const BUYER_EXECUTIVE_ENVIRONMENT_SAVINGS_DESCRIPTION =
  "Estimated savings grouped by environment tag from finalized reviews in this workspace.";

export const BUYER_EXECUTIVE_SCORECARD_DRIFT_TREND_INSUFFICIENT =
  "Not enough data in this range yet.";

export const BUYER_EXECUTIVE_SCORECARD_NO_ACTIONS_HEALTHY =
  "No actions needed for the current period.";

export const BUYER_EXECUTIVE_SCORECARD_NO_ACTIONS_NOT_READY =
  "No actions yet. Finalize a review to generate scorecard signals.";

export const BUYER_EXECUTIVE_SCORECARD_LINK_REVIEW_PACKAGES = "Open reviews";

export const BUYER_EXECUTIVE_SCORECARD_RECOMMENDED_ACTION_LINK = "Review this action →";

export const BUYER_EXECUTIVE_OPERATOR_HANDOFF_LINK = "Open in Operator →";

export const BUYER_EXECUTIVE_SCORECARD_COMMITTED_LABEL = "Finalized reviews";

export const BUYER_GRAPH_FILTER_SUMMARY = "Filter by evidence type, decision, or risk";

export const BUYER_RUNS_DASHBOARD_SECTION_HEADING = "Reviews";

export const BUYER_RUNS_DASHBOARD_TAB_APPROVED = "Approved";

export const BUYER_RUNS_DASHBOARD_TAB_UNDER_MONITORING = "Approved with monitoring";

export const BUYER_RUNS_DASHBOARD_TAB_NEEDS_ATTENTION = "Action needed";

export const BUYER_RUNS_DASHBOARD_FILTER_ALL = "All";

/** TB-740: compact origin badge on workspace/architecture/reviews list rows (buyer-polished shell only). */
export const BUYER_ARCHITECTURE_PACKAGE_ORIGIN_CREATED_BADGE = "Created";

export const BUYER_ARCHITECTURE_PACKAGE_ORIGIN_REVIEWED_BADGE = "Reviewed";

/**
 * Axis label used when package origin renders as a metadata line instead of a pill.
 * Origin is provenance (who authored the architecture), not a governance verdict — surfaces that
 * show both must label it, or `Reviewed` reads as a second, conflicting outcome next to the status tag.
 */
export const BUYER_ARCHITECTURE_PACKAGE_ORIGIN_METADATA_LABEL = "Package origin";

/** Footer navigation on home reviews card — distinct from the All status filter pill. */
export const BUYER_RUNS_DASHBOARD_OPEN_REVIEW_PACKAGES_CTA = "Open all reviews";

/** @deprecated Use {@link BUYER_RUNS_DASHBOARD_OPEN_REVIEW_PACKAGES_CTA}. */
export const BUYER_RUNS_DASHBOARD_VIEW_ALL_REVIEW_PACKAGES_CTA = BUYER_RUNS_DASHBOARD_OPEN_REVIEW_PACKAGES_CTA;

export const BUYER_RUNS_DASHBOARD_NO_APPROVED_PACKAGES =
  "No finalized reviews match this filter yet.";

export const BUYER_RUNS_DASHBOARD_OPEN_ALL_REVIEWS_CTA = "Open all reviews";

export const BUYER_ASK_INPUT_PLACEHOLDER =
  "Ask about risks, findings, evidence, mitigations, executive summary, or approval blockers…";

export const BUYER_ASK_GROUNDING_SOURCES_LABEL = "cited evidence";

/**
 * @deprecated Prefer {@link SIGNED_MANIFEST_LABEL} / `BUYER_SURFACE_VOCABULARY.signedReviewRecord`.
 * Kept so older imports resolve to the canonical package noun (not a Decision register row).
 */
export const BUYER_SIGNED_DECISION_RECORD_LABEL = "Signed review record";

export const BUYER_MANIFEST_SECTION_DECISION = "Decision";

/** Run detail manifest summary definition list — buyer-polished reviewer shell. */
export const BUYER_RUN_DETAIL_MANIFEST_DECISIONS_LABEL = "Decisions recorded";

export const BUYER_MANIFEST_SECTION_EVIDENCE = "Evidence";

export const BUYER_MANIFEST_SECTION_DOWNLOADS = "Downloads";

export const BUYER_MANIFEST_SECTION_DILIGENCE = "Diligence";

export const BUYER_EXECUTIVE_BRIEFING_PACKAGE_LABEL = "Executive briefing export";

export const BUYER_ASK_GROUNDING_PRIMARY_SOURCE_LIMIT = 4;

export const BUYER_TECHNICAL_APPENDIX_LABEL = "Technical appendix";

export const BUYER_DOWNLOAD_REVIEW_RECORD_JSON = "Download review record (JSON)";

export const BUYER_COPY_REVIEW_RECORD_JSON = "Copy review record JSON";

export const BUYER_DEMO_GOVERNANCE_WORKFLOW_UNAVAILABLE =
  "Governance workflow is not configured in this demo workspace.";

export const BUYER_DEMO_ITSM_LINKAGE_UNAVAILABLE =
  "ITSM integration is not connected in this demo workspace.";

export const BUYER_VIEW_SIGNED_RECORD_CTA = "View signed record";

export const BUYER_OPEN_SIGNED_RECORD_CTA = "Open signed record";

export const BUYER_VIEW_SIGNED_REVIEW_RECORD_CTA = "View signed review record";

export const BUYER_DEMO_EVALUATION_WORKSPACE_BADGE = "Evaluation workspace";

export const BUYER_DEMO_EVALUATION_WORKSPACE_STATUS = "Claims Intake Demo · Buyer evaluation workspace";

export const BUYER_SEED_SAMPLE_WORKSPACE_CTA = "Load sample workspace";

/** Toast after demo seed succeeds — dashboard may stay on executive dashboard while caches refresh. */
export const BUYER_SEED_SAMPLE_WORKSPACE_SUCCESS = "Sample workspace loaded.";

export const BUYER_TRY_SAMPLE_REVIEW_CTA = "Try sample review";

export const BUYER_SEE_COMPLETED_OUTPUT_CTA = "See completed output";

export const BUYER_REVIEW_DETAIL_EVIDENCE_BASIS_LINE =
  "Blocking issues: 0 · Evidence basis: signed review record, evidence trail, audit trail";

export const BUYER_DEMO_CAPABILITY_UNAVAILABLE_TITLE =
  "This capability is not enabled in the Claims Intake Demo workspace.";

export const BUYER_DEMO_CAPABILITY_UNAVAILABLE_BODY =
  "In a connected tenant, administrators configure users, support routing, digest subscriptions, and system health here.";

export const BUYER_DEMO_CAPABILITY_TROUBLESHOOTING_CTA = "Open troubleshooting";

/** @deprecated Prefer {@link BUYER_DEMO_CAPABILITY_UNAVAILABLE_TITLE} — title is workspace-scoped, not capability-scoped. */
export function buyerDemoCapabilityUnavailableTitle(): string {
  return BUYER_DEMO_CAPABILITY_UNAVAILABLE_TITLE;
}

export const BUYER_DECISION_KEY_SUMMARY = "Decision key";

export const BUYER_MANIFEST_HEADLINE_SUFFIX = "architecture review";

export const BUYER_MANIFEST_AUTHORITY_SUMMARY =
  "This signed review record is the authoritative record for this review — decisions, findings, and downloadable deliverables.";

export const BUYER_MANIFEST_TOP_RISK_CTA = "View top risk and evidence";

export const BUYER_MANIFEST_NO_DELIVERABLES_YET = "No deliverables listed yet.";

export const BUYER_MANIFEST_DOWNLOAD_PREPARING = "Download is being prepared when your workspace publishes a bundle for this review.";

export const BUYER_MANIFEST_DOWNLOAD_REVIEW_PACKAGE_ZIP = "Download review (ZIP)";

export const BUYER_EVIDENCE_TRAIL_PAGE_TITLE = "Evidence graph";

export const BUYER_EVIDENCE_TRAIL_PAGE_SUBTITLE =
  "Trace how evidence supports findings, decisions, approvals, and the final review.";

export const BUYER_EVIDENCE_TRAIL_LAYER_DISCLOSURE = "What is the evidence graph?";

export const BUYER_EVIDENCE_TRAIL_LAYER_DISCLOSURE_LEAD =
  "Use this page to trace review evidence — see how architecture inputs, findings, decisions, approvals, and audit records connect for a finalized review.";

export const BUYER_EVIDENCE_TRAIL_REVIEWS_LOAD_PLACEHOLDER = "Reviews unavailable";

export const BUYER_EVIDENCE_TRAIL_REVIEWS_LOAD_HINT =
  "Reviews could not be loaded right now. Start a new review or explore the illustrative Claims Intake sample graph (not your tenant data).";

export const BUYER_EVIDENCE_TRAIL_LOAD_BUTTON = "Load evidence graph";

export const BUYER_EVIDENCE_TRAIL_SAMPLE_BUTTON = "Open Claims Intake sample graph";

export const BUYER_EVIDENCE_TRAIL_OPEN_PACKAGE = "Open review";

export const BUYER_EVIDENCE_TRAIL_EMPTY_TITLE = "No review selected";

export const BUYER_EVIDENCE_TRAIL_EMPTY_BODY =
  "Choose a finalized review from your workspace, or explore the illustrative Claims Intake sample graph (not your tenant data).";

export const BUYER_EVIDENCE_TRAIL_NO_REVIEWS_TITLE = "No completed reviews yet";

export const BUYER_EVIDENCE_TRAIL_NO_REVIEWS_BODY =
  "Start a new review, or explore the illustrative Claims Intake sample graph (not your tenant data) to see how findings link to evidence, decisions, and audit records.";

export const BUYER_EVIDENCE_TRAIL_ERROR_HEADING = "Workspace data unavailable";

export const BUYER_EVIDENCE_TRAIL_ERROR_BODY =
  "ArchLucid could not load review data for this workspace.";

export const BUYER_EVIDENCE_TRAIL_ERROR_TRY_NEXT =
  "Try again, open troubleshooting, or explore the illustrative Claims Intake sample graph (not your tenant data) while you set up your first review.";

export const BUYER_EVIDENCE_TRAIL_VIEW_TRACE = "Trace table";

export const BUYER_EVIDENCE_TRAIL_VIEW_GRAPH = "Graph view";

export const BUYER_EVIDENCE_TRAIL_GRAPH_MODE_FINDING = "Evidence provenance";

export const BUYER_EVIDENCE_TRAIL_GRAPH_MODE_DECISION = "Decision traceability";

export const BUYER_EVIDENCE_TRAIL_GRAPH_MODE_ARCHITECTURE = "Architecture context";

export const BUYER_EVIDENCE_GRAPH_SAMPLE_BANNER_TITLE = "Claims Intake sample (not your workspace)";

export const BUYER_EVIDENCE_GRAPH_SAMPLE_BANNER_BODY =
  "This is the illustrative Healthcare Claims Intake demo package — not a review from your tenant. Use it to see how findings link to evidence, decisions, and audit records, then load one of your finalized reviews.";

/** Short link label for CTAs that open the showcase evidence graph (TB-1363). */
export const BUYER_EVIDENCE_GRAPH_SAMPLE_LINK_LABEL = "Claims Intake sample graph";

export const BUYER_EVIDENCE_GRAPH_USE_MY_REVIEW_CTA = "Use my review";

export const BUYER_EVIDENCE_GRAPH_UPLOAD_EVIDENCE_CTA = "Upload evidence";

export const BUYER_EVIDENCE_GRAPH_PICKER_LOADING = "Loading reviews…";

export const BUYER_EVIDENCE_GRAPH_PICKER_NO_PACKAGES =
  "No completed reviews in this workspace yet.";

export const BUYER_EVIDENCE_GRAPH_PICKER_NO_SELECTION = "Select a review to load its evidence graph.";

export const BUYER_EVIDENCE_GRAPH_PICKER_SAMPLE_REVIEW =
  "Showing Claims Intake sample (not your workspace)";

export const BUYER_EVIDENCE_GRAPH_PICKER_REAL_REVIEW = "Selected review";

export const BUYER_EVIDENCE_GRAPH_SYNTHETIC_SAMPLE_HINT = "Sample review";

export const BUYER_EVIDENCE_GRAPH_SYNTHETIC_LOAD_ERROR_HINT =
  "Reviews could not be loaded. Showing the Claims Intake sample (not your workspace).";

export const BUYER_EVIDENCE_GRAPH_EMPTY_LIST_PLACEHOLDER = "No completed reviews yet";

export const BUYER_EVIDENCE_GRAPH_EMPTY_LIST_HINT =
  "No completed reviews yet. Start a new review or open the Claims Intake sample graph (not your tenant data).";

export const BUYER_EVIDENCE_GRAPH_FIT_GRAPH_CTA = "Fit";

export const BUYER_EVIDENCE_GRAPH_ZOOM_100_CTA = "100%";

export const BUYER_EVIDENCE_GRAPH_RESET_VIEW_CTA = "Reset";

export const BUYER_EVIDENCE_GRAPH_TRACE_PATH_CTA = "Highlight path";

export const BUYER_EVIDENCE_GRAPH_SHOW_SELECTED_PATH_CTA = "Focus selection";

export const BUYER_EVIDENCE_GRAPH_SHOW_ALL_NODES_CTA = "Show all";

export const BUYER_EVIDENCE_GRAPH_SELECTED_NODE_PANEL_LABEL = "Selected graph node";

export const BUYER_EVIDENCE_GRAPH_OPEN_FINDING_DETAIL_CTA = "Open finding detail";

export const BUYER_EVIDENCE_GRAPH_OPEN_DECISION_RECORD_CTA = "Open decision";

export const BUYER_EVIDENCE_GRAPH_VIEW_EVIDENCE_CHAIN_CTA = "View evidence chain";

/** Opens the Trace table presentation (`presentation=trace`) — not a file download. */
export const BUYER_EVIDENCE_GRAPH_EXPORT_EVIDENCE_TRAIL_CTA = "Export trace table";

export const BUYER_GRAPH_PAGE_LEAD = BUYER_EVIDENCE_TRAIL_PAGE_SUBTITLE;

export const BUYER_GRAPH_LOAD_ERROR = BUYER_EVIDENCE_TRAIL_ERROR_BODY;

export const BUYER_GRAPH_IDLE_DESCRIPTION = BUYER_EVIDENCE_TRAIL_EMPTY_BODY;

/** Operator evidence graph page — IA pass (progressive disclosure, not buyer-polished shell). */
export const OPERATOR_GRAPH_PAGE_SUBTITLE =
  "Trace architecture inputs, findings, decisions, and audit records for a finalized review.";

export const OPERATOR_GRAPH_SCOPE_LABEL = "Graph scope";

export const OPERATOR_GRAPH_SELECT_REVIEW_FIRST_HINT = "Select a review first.";

export const OPERATOR_GRAPH_LOAD_ERROR_HEADING = "Graph could not be loaded";

export const OPERATOR_GRAPH_LOAD_ERROR_BODY =
  "ArchLucid could not load the evidence graph for this review.";

export const OPERATOR_GRAPH_LOAD_ERROR_TRY_NEXT =
  "Try retrying, or open the review to confirm it is finalized.";

export const OPERATOR_GRAPH_IDLE_TITLE = "No completed reviews yet";

export const OPERATOR_GRAPH_IDLE_BODY =
  "Create a review or open the Claims Intake sample graph (not your tenant workspace) to explore how evidence connects to findings and decisions.";

export const OPERATOR_GRAPH_WHAT_YOU_WILL_SEE =
  "The graph connects review inputs, evidence, policy references, findings, decisions, and signed review records.";

export const BUYER_GOVERNANCE_GOVERNED_USE_NOTES =
  "Governed-use record aligned with this architecture review.";

export const BUYER_GOVERNANCE_WORKFLOW_LIVE_INTRO =
  "Authorized roles submit approval requests, record decisions, and attach evidence before changes move to implementation planning.";

export const BUYER_GOVERNANCE_SEGREGATION_OF_DUTIES =
  "Requesters cannot approve their own reviews (segregation of duties).";

export const BUYER_GOVERNANCE_QUICK_APPROVE_LABEL = "Approve (no critical/high findings)";

export const BUYER_GOVERNANCE_FINDINGS_EMPTY = "Start from a review.";

export const BUYER_GOVERNANCE_WORKFLOW_CTA = "Open governance workflow";

export const BUYER_POLICY_PACK_LEAD =
  "This pack encodes PHI minimization, audit-friendly artifact retention, and segregation expectations for regulated intake paths.";

export const BUYER_ASK_THREAD_EXAMPLE_TITLE = "Review briefing thread";

export const BUYER_ASK_REVIEW_ANCHORS_SUMMARY = "Review anchors";

export const BUYER_FINDING_EVIDENCE_TRACE_LABEL = "Evidence trace";

export const BUYER_FINDING_SUPPORTING_EVIDENCE_TRACE = "Supporting evidence trace";

export const BUYER_AUDIT_REFERENCE_ID_LABEL = "Reference ID";

export const AUDIT_TRAIL_INTEGRITY_NOTE =
  "Append-only audit trail — every create, finalize, governance decision, and export is recorded with actor, action type, and timestamp. Filter or sort below to inspect the complete event timeline.";

export const BUYER_GRAPH_GOVERNANCE_NEXT_APPROVED = "View governance workflow";
export const BUYER_GRAPH_GOVERNANCE_NEXT_PENDING = "Continue to governance approval";

export const BUYER_EXAMPLE_COUNT_SUFFIX = "(example)";

export const BUYER_CTO_DEMO_AUDIT_CLOSING_HEADING = "Your diligence bundle is ready.";

export const BUYER_CTO_DEMO_AUDIT_CLOSING_SUBTEXT =
  "Download the board packet — a PDF summary of findings, decisions, and the governance record — to share with your sponsor or procurement team.";

export const BUYER_CTO_DEMO_NEXT_STEPS_HEADING = "Next steps";

export const BUYER_CTO_DEMO_NEXT_STEPS_SUBTEXT =
  "Continue diligence with your team — start a pilot, book a security review, or download the trust pack for procurement.";

export const BUYER_CTO_DEMO_NEXT_STEPS_PILOT_CTA = "Start a pilot";

export const BUYER_CTO_DEMO_NEXT_STEPS_SECURITY_REVIEW_CTA = "Book a security review";

export const BUYER_CTO_DEMO_NEXT_STEPS_TRUST_PACK_CTA = "Get the trust pack";

export const BUYER_CTO_DEMO_STORY_GATED_NOTE =
  "Healthcare data shown in this demo — other verticals are talk-track only until a pilot is provisioned.";

export const BUYER_CTO_DEMO_PREFLIGHT_HEADING = "Before you begin";

export const BUYER_CTO_DEMO_PREFLIGHT_BEGIN_CTA = "Begin demo";

export const BUYER_CTO_DEMO_AGENDA_HEADING = "Your 30-minute review journey";

export const BUYER_CTO_DEMO_AGENDA_SUBTEXT =
  "Five stops from executive outcomes through signed review record, evidence, governance, and audit trail.";

export const BUYER_CTO_DEMO_AUDIT_VERIFY_CTA = "Verify integrity";

export const BUYER_CTO_DEMO_AUDIT_VERIFY_BUSY = "Verifying…";

export const BUYER_CTO_DEMO_AUDIT_VERIFY_SUCCESS = "Chain intact";

export const BUYER_CTO_DEMO_AUDIT_VERIFY_FAIL = "Chain broken";

export const BUYER_CTO_DEMO_ISOLATION_PROOF_HEADING = "Tenant isolation evidence";

export const BUYER_CTO_DEMO_ISOLATION_PROOF_BODY =
  "Each customer receives a dedicated database catalog. The showcase below is isolated from all other tenants.";

export const BUYER_CTO_DEMO_GOVERNANCE_PREVIEW_BADGE = "Demo preview — read-only view";

export const BUYER_CTO_DEMO_GOVERNANCE_PREVIEW_NOTE =
  "In production, an architect with Execute authority approves here. This view shows the post-approval state from the example review.";

export const BUYER_CTO_DEMO_VALUE_STRIP_LABELS: readonly string[] = [
  "This executive summary gives your sponsor a one-page risk and outcome verdict — no engineering context required.",
  "This signed review record is the verifiable record of every decision made in this review — your auditors' starting point.",
  "Every finding traces back to the exact evidence that produced it — no black-box AI.",
  "This approval gate enforces separation-of-duties before any architecture change is promoted to production.",
  "Every event in this timeline is immutable and exportable — the compliance trail your auditors need on day one.",
] as const;

export const REVIEWS_NEW_OTHER_PATHS_DISCLOSURE = "Other ways to start a review";
