/**
 * Operator home / overview copy — hero, lifecycle steps, readiness, and sample panels.
 *
 * Re-exported by `./index.ts`; import from `@/lib/buyer/buyer-polish-copy` or `@/lib/buyer-copy`.
 */

import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture/architecture-workflow-labels";

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

export function formatOperatorHomeContinueDraftHeading(displayName: string): string {
  const trimmedName = displayName.trim();

  if (trimmedName.length > 0) {
    return trimmedName;
  }

  return OPERATOR_HOME_CONTINUE_ARCHITECTURE_HEADING;
}

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
  "Start from a description, uploaded evidence, or live cloud inventory—then run a governed review. The review is the durable work item.";

export const OPERATOR_HOME_ARCHITECTURE_LIFECYCLE_INTRO =
  `${OPERATOR_HOME_ARCHITECTURE_LIFECYCLE_INTRO_LABEL} ${OPERATOR_HOME_ARCHITECTURE_LIFECYCLE_INTRO_BODY}`;

export const OPERATOR_HOME_CREATE_ARCHITECTURE_CARD_TITLE = "Step 1 — Describe, import, or connect";

export const OPERATOR_HOME_CREATE_ARCHITECTURE_CARD_BODY =
  "Start from an architecture draft, uploaded briefs and diagrams, or read-only cloud inventory from Azure, AWS, or Google Cloud. Saving a draft does not start a review.";

export const OPERATOR_HOME_REVIEW_ARCHITECTURE_CARD_TITLE = "Step 2 — Run a governed review";

export const OPERATOR_HOME_REVIEW_ARCHITECTURE_CARD_BODY =
  "Attach architecture information you already have—diagrams, documents, inventory exports, or connected cloud evidence—then start the governed review.";

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

/** Primary CTA on home Step 1 for the cloud-as-architecture path. */
export const OPERATOR_HOME_CONNECT_CLOUD_CTA = OPERATOR_HOME_CONNECT_CLOUD_TITLE;

/** @deprecated Use {@link OPERATOR_HOME_CONNECT_CLOUD_CTA} — retained for legacy imports. */
export const OPERATOR_HOME_CLOUD_EVIDENCE_LINK = OPERATOR_HOME_CONNECT_CLOUD_CTA;

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

export const BUYER_HOME_SETUP_SECTION_HEADING = "Start a new review";

export const OPERATOR_HOME_OPEN_FIRST_REVIEW_GUIDE_CTA = "Open guide";
