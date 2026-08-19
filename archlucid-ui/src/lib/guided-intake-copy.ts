/** Guided intake step 0 — buyer-facing placeholders and helper copy. */

import { ARCHITECTURE_REQUEST_DRAFT_MIN_DESCRIPTION_CHARS } from "@/lib/api/architecture-request-draft-api";
export const GUIDED_INTAKE_STEP0_PROGRESS_LABEL = "Describe the system";

export const GUIDED_INTAKE_STEP0_CARD_TITLE = "Describe the architecture intent";

export const GUIDED_INTAKE_STEP0_CARD_DESCRIPTION =
  "Describe the system, the business outcome, and the users or systems that interact with it.";

/** Create-architecture guided intake — calmer step 0 framing. */
export const GUIDED_INTAKE_CREATION_STEP0_CARD_TITLE = "Describe the architecture";

export const GUIDED_INTAKE_CREATION_STEP0_CARD_DESCRIPTION =
  "Explain what the system does, why it exists, who or what interacts with it, and any important constraints or risks.";

export const GUIDED_INTAKE_CREATION_INTRO =
  "Describe your architecture, then answer a short set of guided questions.";

export const GUIDED_INTAKE_ARCHITECTURE_INTENT_LABEL = "Architecture intent";

export const GUIDED_INTAKE_CREATION_ARCHITECTURE_OVERVIEW_LABEL = "Architecture overview";

export const GUIDED_INTAKE_CREATION_BUSINESS_OUTCOME_LABEL = "Business outcome";

export const GUIDED_INTAKE_CREATION_SYSTEM_NAME_LABEL = "System name";

export const GUIDED_INTAKE_CREATION_SYSTEM_NAME_PLACEHOLDER = "Example: Claims intake platform";

export const GUIDED_INTAKE_ARCHITECTURE_INTENT_MIN_CHARS = 100;

export const GUIDED_INTAKE_ARCHITECTURE_INTENT_MIN_HELPER =
  "Provide at least 100 characters so ArchLucid can understand the system, outcome, and review focus.";

export const GUIDED_INTAKE_CREATION_ARCHITECTURE_OVERVIEW_MIN_HELPER =
  "Enter at least 100 characters describing what the system does, who uses it, and important constraints.";

export const GUIDED_INTAKE_ARCHITECTURE_INTENT_PLACEHOLDER =
  "Describe the system, business outcome, users, integrations, constraints, risks, and what you want ArchLucid to evaluate.";

export const GUIDED_INTAKE_CREATION_ARCHITECTURE_OVERVIEW_PLACEHOLDER =
  "Example: Customer-facing API with private networking, managed database, cache tier, and EU data residency goals.";

export function guidedIntakeArchitectureIntentHelperText(trimmedLength: number): string {
  if (trimmedLength === 0) {
    return GUIDED_INTAKE_ARCHITECTURE_INTENT_MIN_HELPER;
  }

  if (trimmedLength < GUIDED_INTAKE_ARCHITECTURE_INTENT_MIN_CHARS) {
    return `${trimmedLength} / ${GUIDED_INTAKE_ARCHITECTURE_INTENT_MIN_CHARS} characters. ${GUIDED_INTAKE_ARCHITECTURE_INTENT_MIN_HELPER}`;
  }

  return `${trimmedLength} characters.`;
}

export function guidedIntakeCreationArchitectureOverviewHelperText(trimmedLength: number): string {
  if (trimmedLength === 0) {
    return GUIDED_INTAKE_CREATION_ARCHITECTURE_OVERVIEW_MIN_HELPER;
  }

  if (trimmedLength < GUIDED_INTAKE_ARCHITECTURE_INTENT_MIN_CHARS) {
    return `${trimmedLength} / ${GUIDED_INTAKE_ARCHITECTURE_INTENT_MIN_CHARS} characters. ${GUIDED_INTAKE_CREATION_ARCHITECTURE_OVERVIEW_MIN_HELPER}`;
  }

  return `${trimmedLength} characters.`;
}

export const GUIDED_INTAKE_BUSINESS_OUTCOME_PLACEHOLDER =
  "Example: Reduce intake cycle time, improve auditability, and give operations teams a single governed workflow for claims submissions.";

export const GUIDED_INTAKE_CREATION_BUSINESS_OUTCOME_MIN_HELPER =
  "Enter at least 10 characters describing the business outcome you expect.";

export const GUIDED_INTAKE_ACTORS_SECTION_HEADING = "People, systems, and integrations";

export const GUIDED_INTAKE_TRUST_BOUNDARY_HINT =
  "Add the people, systems, services, tenants, jobs, or APIs that interact with this architecture. Missing one can hide trust boundaries.";

export const GUIDED_INTAKE_CREATION_PEOPLE_SYSTEMS_HINT =
  "Add people and systems manually, or enter an architecture overview to generate suggestions.";

export const GUIDED_INTAKE_ACTORS_EMPTY_STATE = "No people or systems added yet.";

/**
 *     Interaction is a timing axis, but its first option is named after a channel
 *     ("Interactive UI"), so a person uploading a batch from a screen can pick it by mistake.
 *     The wrong choice sends the review after response-time requirements instead of job
 *     durability and resumability.
 */
export const GUIDED_INTAKE_INTERACTION_TIMING_HINT =
  "Choose Async batch if work is submitted now and the result arrives later.";

/** Start review guided intake — field label is Architecture intent. */
export const GUIDED_INTAKE_SUGGEST_ACTORS_BUTTON = "Suggest from architecture intent";

export const GUIDED_INTAKE_SUGGEST_ACTORS_DISABLED_HINT =
  "Enter an architecture intent to generate suggestions.";

/** Create-architecture guided intake — field label is Architecture overview. */
export const GUIDED_INTAKE_CREATION_SUGGEST_ACTORS_BUTTON = "Suggest from architecture overview";

export const GUIDED_INTAKE_CREATION_SUGGEST_ACTORS_DISABLED_HINT =
  "Enter an architecture overview to generate suggestions.";

export const GUIDED_INTAKE_STRUCTURED_BRIEF_SUGGEST_EMPTY =
  "No new suggestions were returned. Add constraints and assumptions manually, or refine the architecture overview and try again.";

export function guidedIntakeStructuredBriefSuggestDisabledHint(trimmedOverviewLength: number): string {
  if (trimmedOverviewLength === 0) {
    return "Enter an architecture overview before suggesting structured brief items.";
  }

  return `Architecture overview needs at least ${20} characters before suggestions can run.`;
}

export const GUIDED_INTAKE_SUGGESTED_ACTORS_HEADING = "Suggested people and systems";

export const GUIDED_INTAKE_ADD_SELECTED_ACTORS_BUTTON = "Add selected";

export const GUIDED_INTAKE_ADD_ACTOR_BUTTON = "Add person or system";

export const GUIDED_INTAKE_ADD_ANOTHER_ACTOR_BUTTON = "Add another person or system";

export const GUIDED_INTAKE_CONFIRM_ACTOR_BUTTON = "Confirm";

export const GUIDED_INTAKE_CONTINUE_TO_CLARIFICATIONS = "Continue to clarifications";

export const GUIDED_INTAKE_CONTINUE_TO_DISCOVERY = "Continue to clarifying questions";

export const GUIDED_INTAKE_CREATION_STEP1_CARD_DESCRIPTION =
  "Answer the guided questions about reliability, security, cost, operations, performance, and deployment.";

export const GUIDED_INTAKE_CREATION_DRAFT_GUIDANCE_CALLOUT =
  "Architecture draft only. Nothing is submitted for review until you explicitly create a review.";

export const GUIDED_INTAKE_DRAFT_GUIDANCE_CALLOUT =
  "Draft guidance only. Nothing is added to review evidence until you submit.";

export const GUIDED_INTAKE_STEP2_CARD_DESCRIPTION =
  "Submit your answers to start the architecture review.";

export const GUIDED_INTAKE_STEP2_SUBMIT_DESCRIPTION =
  "Submit uses the same review-start path as Quick start and Templates and imports.";

export const GUIDED_INTAKE_READINESS_SUCCESS_TOAST =
  "Readiness checks passed — answer the required clarifications to continue.";

export const GUIDED_INTAKE_READY_DRAFT_CLAIM_LABEL =
  "Ready to submit — confirm execution mode on review detail before sponsor export";

export const GUIDED_INTAKE_NOT_READY_RECEIPT_TITLE = "Decision receipt — review not started";

export const GUIDED_INTAKE_SOURCE_ARCHITECTURE_HINT_LEAD = "Reviewing saved architecture.";

export const GUIDED_INTAKE_SOURCE_ARCHITECTURE_HINT_TAIL =
  "Later edits to the architecture draft will not change this review's evidence basis.";

export const GUIDED_INTAKE_WHAT_IF_BRANCH_HINT_LEAD = "What-if branch.";

/** Blocker phrase for the in-scope confirmation gate on step 0, listed with the missing fields. */
export const GUIDED_INTAKE_SCOPE_CONFIRMATION_BLOCKER = "the in-scope confirmation";

export const GUIDED_INTAKE_REQUEST_FAILED_FALLBACK = "Guided questions request failed.";

/** Heading for the read-only confirmed-scope recap on the submit step. */
export const GUIDED_INTAKE_CONFIRMED_SCOPE_SUMMARY_HEADING = "Confirmed in-scope items";

export function buildGuidedIntakeCreationAdvanceBlockerMessage(blockers: readonly string[]): string {
  if (blockers.length === 0) {
    return "";
  }

  if (blockers.length === 1) {
    return `Complete ${blockers[0]} to continue.`;
  }
