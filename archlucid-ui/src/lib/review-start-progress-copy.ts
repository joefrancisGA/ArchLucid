export const REVIEW_START_LOADING_LABEL = "Starting review…";

export const CREATE_ARCHITECTURE_STARTING_LABEL = "Starting architecture…";

export const REVIEW_START_PREPARING_LABEL = "Preparing architecture review…";

export const REVIEW_START_OPENING_LABEL = "Opening review…";

export const OPERATOR_HOME_OPENING_COMPLETED_REVIEW_LABEL = "Opening review…";

export const OPERATOR_HOME_OPENING_CLOUD_CONNECTIONS_LABEL = "Opening cloud connections…";

export const OPERATOR_HOME_OPENING_WORKFLOW_LABEL = "Opening workflow…";

export const OPERATOR_HOME_PREPARING_ARCHITECTURE_WORKSPACE_LABEL = "Preparing architecture workspace…";

export const OPERATOR_HOME_OPENING_CREATION_EXAMPLE_LABEL = "Opening creation example…";

export const OPERATOR_HOME_RUNNING_GUIDED_REVIEW_LABEL = "Running guided review…";

export const CREATE_ARCHITECTURE_NAVIGATION_FAILED_MESSAGE =
  "We could not start the architecture draft. Please try again.";

export const CREATE_ARCHITECTURE_DRAFT_START_FAILED_MESSAGE =
  "Could not start a new architecture draft. Try again.";

/** Soft-nav / draft-create can stall; recover UI instead of leaving the CTA depressed. */
export const CREATE_ARCHITECTURE_BOOTSTRAP_TIMEOUT_MS = 45_000;

export const REVIEW_START_CREATION_FAILED_MESSAGE =
  "We could not start the architecture review. Your selections have been preserved. Try again.";

/** Operation label used by the escalating Tier B wait copy (TB-2078) while create is outstanding. */
export const REVIEW_START_WAIT_OPERATION_LABEL = "Starting your architecture review";

/**
 * Shown when the browser stopped waiting but the server was never told to stop.
 * Deliberately not phrased as a failure: reporting an unresolved create as failed is what
 * drives duplicate submissions.
 */
export const REVIEW_START_UNRESOLVED_HEADLINE = "Still working on it";

export const REVIEW_START_UNRESOLVED_MESSAGE =
  "We stopped waiting for a response, but your review may still be starting on the server. Nothing was canceled. Check for it below rather than submitting again — submitting again is what creates duplicates.";

/** Recovery CTA — replays the same idempotency key, so it resolves to one review either way. */
export const REVIEW_START_UNRESOLVED_RECHECK_CTA = "Check for my review";

export const REVIEW_START_UNRESOLVED_RECHECK_PENDING_LABEL = "Checking…";

export const REVIEW_START_UNRESOLVED_OPEN_REVIEWS_CTA = "Open Reviews";

export const REVIEW_START_RESUMED_EXISTING_MESSAGE =
  "Found it — your review was already created. Opening it now.";

export const REVIEW_START_CREATED_CONFIRMATION = "Architecture review created.";

export const REVIEW_START_STEP_VALIDATION_MESSAGE = "Fix the highlighted fields before continuing.";

export const REVIEW_START_SUBMIT_VALIDATION_MESSAGE =
  "Fix validation errors before creating the architecture review.";

import { POLICY_PACK_CLOUD_MISMATCH_MESSAGE } from "@/lib/review-quality/review-intake-quality-gates";

export const REVIEW_START_POLICY_CLOUD_MISMATCH_MESSAGE = POLICY_PACK_CLOUD_MISMATCH_MESSAGE;

export const REVIEW_START_LLM_BUDGET_EXCEEDED_MESSAGE =
  "LLM Execution budget exceeded for this month. You may still view previous reviews.";

export const REVIEW_START_DEMO_MODE_SUBMIT_MESSAGE =
  "Use Start simulator create or Try it live on the demo panel above for simulator/live paths.";

/** Delay before showing staged progress during navigation or creation. */
export const REVIEW_START_STAGED_PANEL_DELAY_MS = 2000;

/**
 * Ceiling for a soft navigation to the review start page before we offer a direct open.
 * Deliberately longer than the generic soft-nav budget: clearing the progress chrome while the App
 * Router is still fetching the route reads to the operator as "nothing happened".
 */
export const REVIEW_START_NAVIGATION_STALL_TIMEOUT_MS = 60_000;

/**
 * Shown when the soft navigation is still outstanding at the ceiling. Framed as slow, not failed —
 * the draft is already saved and the pending navigation is not canceled by this notice.
 */
export const REVIEW_START_NAVIGATION_STALL_MESSAGE =
  "The review start page is taking longer than usual to open. Your architecture draft is saved — nothing was lost. Keep waiting, or open the page directly.";

export const REVIEW_START_OPEN_DIRECTLY_CTA = "Open the review start page";
