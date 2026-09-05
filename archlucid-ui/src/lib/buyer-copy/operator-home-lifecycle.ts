/**
 * Operator home lifecycle, setup, and workspace copy.
 */

import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture/architecture-workflow-labels";

export const OPERATOR_HOME_LIFECYCLE_RECOMMENDED_BADGE = "Recommended next";

export const OPERATOR_HOME_CONTACT_WORKSPACE_OWNER_HINT = "Contact the workspace owner.";

export const OPERATOR_HOME_COMPACT_STARTING_ACTIONS_HEADING = "Start something";

/** Heading when resume and new-review actions are both visible on home. */
export const OPERATOR_HOME_START_OR_RESUME_REVIEW_HEADING = "Start or resume a review";

/** Outline CTA beside resume when desk work already exists. */
export const OPERATOR_HOME_START_NEW_ARCHITECTURE_REVIEW_CTA = "Start a new architecture review";

/** Collapsed lifecycle entry when a draft/resume primary already owns the first viewport. */
export const OPERATOR_HOME_LIFECYCLE_ALTERNATIVES_DISCLOSURE_TITLE = "Start something else";

export const OPERATOR_HOME_LIFECYCLE_ALTERNATIVES_COLLAPSED_SUMMARY =
  "Create architecture, start a review, or explore a completed sample.";

/** Buyer-polished Home subtitle — action-oriented, not lifecycle documentation. */
export const BUYER_OPERATOR_HOME_PAGE_SUBTITLE = "Your architecture workspace";

/** Bold prefix on Home header freshness line — qualifies the clock timestamp after refresh. */
export const OPERATOR_HOME_DATA_CURRENCY_PREFIX = "Refreshed";

export const OPERATOR_HOME_WORKSPACE_EMPTY_TITLE = "No reviews yet";

export const OPERATOR_HOME_WORKSPACE_EMPTY_BODY =
  "Your in-progress and completed architecture reviews will appear here.";

export const OPERATOR_HOME_LEARN_HOW_REVIEWS_WORK_CTA = "Learn how reviews work";

/** Bridge when setup readiness still blocks the first review. */
export const OPERATOR_HOME_DO_THIS_NEXT_SETUP_BRIDGE =
  "Finish the remaining required setup item, then start or open a sample review.";

export const OPERATOR_HOME_WORKSPACE_ACTIVITY_LEAD =
  "Continue active reviews or open completed results.";

export const OPERATOR_HOME_WORKSPACE_ARCHIVED_EMPTY_TITLE = "No archived reviews yet.";

export const OPERATOR_HOME_WORKSPACE_ARCHIVED_EMPTY_BODY = "Archived reviews will appear here.";

export const PILOT_COMMAND_CENTER_HEADING = "Architecture review lifecycle";

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

/** Primary CTA on home Step 1 for the cloud-as-architecture path. */
export const OPERATOR_HOME_CONNECT_CLOUD_CTA = OPERATOR_HOME_CONNECT_CLOUD_TITLE;

/** @deprecated Use {@link OPERATOR_HOME_CONNECT_CLOUD_CTA} — retained for legacy imports. */
export const OPERATOR_HOME_CLOUD_EVIDENCE_LINK = OPERATOR_HOME_CONNECT_CLOUD_CTA;

export const OPERATOR_HOME_CLOUD_CONNECT_ADMIN_HINT =
  "Cloud connection requires workspace administrator access.";

export const OPERATOR_HOME_INVITE_COLLABORATORS_BODY =
  "Invite collaborators when you are ready to share or review work.";

export const OPERATOR_HOME_SETUP_NEXT_OPEN_GUIDE = "Open the first review guide.";

export const OPERATOR_HOME_SETUP_NEXT_CHOOSE_PATH = "Create an architecture or start a review.";

export const OPERATOR_HOME_EXAMPLES_AND_LEARNING_HEADING = "Examples and learning";

export const OPERATOR_HOME_LEARNING_RESOURCES_HEADING = "Learning resources";

export const OPERATOR_HOME_LEARNING_RESOURCES_LEAD =
  "Walk through creation and review examples without starting a live review.";

export const OPERATOR_HOME_SETUP_NEXT_CONNECT_CLOUD = "Connect cloud";

export const OPERATOR_HOME_SETUP_NEXT_INVITE_REVIEWER = "Invite reviewer";

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

/** Canonical home reviews zone heading — both operator shells (TB-347). */
export const OPERATOR_HOME_RECENT_REVIEWS_HEADING = "Recent reviews";

export const BUYER_HOME_REVIEWS_SECTION_HEADING = OPERATOR_HOME_RECENT_REVIEWS_HEADING;

export const BUYER_HOME_SECONDARY_CTA = "Create from evidence";

export const BUYER_HOME_SETUP_SECTION_HEADING = "Start a new review";

export const OPERATOR_HOME_OPEN_FIRST_REVIEW_GUIDE_CTA = "Open guide";
