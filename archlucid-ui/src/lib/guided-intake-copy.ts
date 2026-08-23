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

export const GUIDED_INTAKE_ARCHITECTURE_INTENT_LABEL = "Architecture Intent";

export const GUIDED_INTAKE_CREATION_ARCHITECTURE_OVERVIEW_LABEL = "Architecture Overview";

export const GUIDED_INTAKE_CREATION_BUSINESS_OUTCOME_LABEL = "Business Outcome";

export const GUIDED_INTAKE_CREATION_SYSTEM_NAME_LABEL = "System Name";

export const GUIDED_INTAKE_ARCHITECTURE_CONTEXT_LABEL = "Architecture Context";

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
  "Example: Reduce intake cycle time, improve auditability, and give operations teams a single structured workflow for claims submissions.";

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

/** Start review guided intake — field label is Architecture Intent. */
export const GUIDED_INTAKE_SUGGEST_ACTORS_BUTTON = "Suggest from architecture intent";

export const GUIDED_INTAKE_SUGGEST_ACTORS_DISABLED_HINT =
  "Enter an architecture intent to generate suggestions.";

/** Create-architecture guided intake — field label is Architecture Overview. */
export const GUIDED_INTAKE_CREATION_SUGGEST_ACTORS_BUTTON = "Suggest from architecture overview";

export const GUIDED_INTAKE_CREATION_SUGGEST_ACTORS_DISABLED_HINT =
  "Enter an architecture overview to generate suggestions.";

export const GUIDED_INTAKE_STRUCTURED_BRIEF_SUGGEST_HEADING =
  "Suggested — confirm before review uses them.";

export const GUIDED_INTAKE_DENY_SUGGESTION_BUTTON = "Deny";

export const GUIDED_INTAKE_EXPLAIN_SUGGESTION_BUTTON = "Explain";

export const GUIDED_INTAKE_EXPLAIN_SUGGESTION_LOADING = "Loading explanation…";

export const GUIDED_INTAKE_EXPLAIN_SUGGESTION_RETRY_BUTTON = "Retry";

export const GUIDED_INTAKE_STRUCTURED_BRIEF_SUGGEST_EMPTY =
  "No new suggestions were returned. Add constraints and assumptions manually, or refine the architecture overview and try again.";

export const GUIDED_INTAKE_STRUCTURED_BRIEF_SUGGEST_EDITOR_LOCKED_HINT =
  'This draft is locked while a linked review is open. Choose "Edit draft anyway" above to suggest structured brief items.';

export function guidedIntakeStructuredBriefSuggestSuccess(addedCount: number): string {
  const label = addedCount === 1 ? "suggestion" : "suggestions";

  return `Added ${addedCount} ${label} below — confirm each one before review uses them.`;
}

export function guidedIntakeStructuredBriefSuggestDisabledHint(trimmedOverviewLength: number): string {
  if (trimmedOverviewLength === 0) {
    return "Enter an architecture overview before suggesting structured brief items.";
  }

  return `${GUIDED_INTAKE_CREATION_ARCHITECTURE_OVERVIEW_LABEL} needs at least ${ARCHITECTURE_REQUEST_DRAFT_MIN_DESCRIPTION_CHARS} characters before suggestions can run.`;
}

export const GUIDED_INTAKE_STRUCTURED_BRIEF_SECTION_LABEL = "Structured Brief";

export const GUIDED_INTAKE_STRUCTURED_BRIEF_REQUIRED_CAPABILITIES_LABEL = "Required Capabilities";

export const GUIDED_INTAKE_STRUCTURED_BRIEF_REQUIRED_CAPABILITIES_HINT =
  "Traits the design must support — for example HTTPS ingress, managed database, or observability.";

export const GUIDED_INTAKE_STRUCTURED_BRIEF_QUALITY_ATTRIBUTES_LABEL = "Quality Attributes";

export const GUIDED_INTAKE_TRUST_ORIGIN_LABEL = "Trust Origin";

export const GUIDED_INTAKE_ADVANCED_OPTIONS_LABEL = "Advanced Options";

export const GUIDED_INTAKE_STRUCTURED_BRIEF_QUALITY_ATTRIBUTES_PLACEHOLDER =
  "e.g. p95 latency 200ms or defense in depth";

export const GUIDED_INTAKE_STRUCTURED_BRIEF_QUALITY_ATTRIBUTES_HINT =
  "Add one target at a time. Numeric targets (latency, RTO, throughput) and qualitative ones (defense in depth, zero trust) are both valid.";

export const GUIDED_INTAKE_STRUCTURED_BRIEF_FAILURE_MODE_LABEL = "Failure mode and recovery";

export const GUIDED_INTAKE_STRUCTURED_BRIEF_FAILURE_MODE_INLINE_PREFIX =
  GUIDED_INTAKE_STRUCTURED_BRIEF_FAILURE_MODE_LABEL;

export const GUIDED_INTAKE_STRUCTURED_BRIEF_FAILURE_MODE_HINT =
  "What breaks first in the design and how operators recover — not org-wide business continuity.";

export const GUIDED_INTAKE_STRUCTURED_BRIEF_FAILURE_MODE_PLACEHOLDER =
  "e.g. API outage; failover to secondary region";

export const GUIDED_INTAKE_STRUCTURED_BRIEF_FAILURE_MODE_SUGGEST_BUTTON = "Suggest from context";

export const GUIDED_INTAKE_STRUCTURED_BRIEF_FAILURE_MODE_SUGGEST_SUCCESS =
  "Filled failure mode and recovery from architecture context.";

export const GUIDED_INTAKE_STRUCTURED_BRIEF_FAILURE_MODE_SUGGEST_EMPTY =
  "No failure mode suggestion found. Confirm constraints or refine the overview and try again.";

export const GUIDED_INTAKE_STRUCTURED_BRIEF_OPERATIONAL_OWNER_LABEL = "Operational Owner";

export const GUIDED_INTAKE_STRUCTURED_BRIEF_OPERATIONAL_OWNER_HINT =
  "Team or role accountable for runbooks and on-call.";

export const GUIDED_INTAKE_STRUCTURED_BRIEF_OPERATIONAL_OWNER_PLACEHOLDER = "e.g. Platform SRE";

export const GUIDED_INTAKE_OVERVIEW_REWRITE_BUTTON = "Rewrite architecture overview from the confirmed brief";

export const GUIDED_INTAKE_OVERVIEW_REWRITE_DISABLED_HINT =
  "Confirm or deny at least one structured-brief suggestion, then rewrite the overview from those facts.";

export const GUIDED_INTAKE_OVERVIEW_REWRITE_PREVIEW_HEADING = "Proposed architecture overview";

export const GUIDED_INTAKE_OVERVIEW_REWRITE_ACCEPT_BUTTON = "Accept overview";

export const GUIDED_INTAKE_OVERVIEW_REWRITE_DISCARD_BUTTON = "Discard";

export const GUIDED_INTAKE_OVERVIEW_REWRITE_RESUGGEST_BUTTON = "Suggest from overview again";

export const GUIDED_INTAKE_OVERVIEW_REWRITE_RESUGGEST_HINT =
  "After accepting the rewritten overview, run one more suggest pass to surface new gaps from the grounded text.";

export const GUIDED_INTAKE_SUGGESTED_ACTORS_HEADING = "Suggested people and systems";

export const GUIDED_INTAKE_ADD_SELECTED_ACTORS_BUTTON = "Add selected";

export const GUIDED_INTAKE_ADD_ACTOR_BUTTON = "Add person or system";

export const GUIDED_INTAKE_ADD_ANOTHER_ACTOR_BUTTON = "Add another person or system";

export const GUIDED_INTAKE_CONFIRM_ACTOR_BUTTON = "Confirm";

export const GUIDED_INTAKE_CONTINUE_TO_CLARIFICATIONS = "Continue to clarifications";

export const GUIDED_INTAKE_CONTINUE_TO_DISCOVERY = "Continue to clarifying questions";

export const GUIDED_INTAKE_CREATION_STEP1_CARD_DESCRIPTION =
  "Answer the guided questions about reliability, security, cost, operations, performance, and deployment.";

/** Shown when the cloud-target clarification uses a select while earlier prompts used free text. */
export const GUIDED_INTAKE_CLOUD_TARGET_CONTROL_HINT =
  "This clarification uses a fixed provider list so policy packs and cloud-scoped rules can align with your target.";

export const GUIDED_INTAKE_SAVE_ANSWER_LABEL = "Save answer";

export const GUIDED_INTAKE_SAVE_AND_CONTINUE_LABEL = "Save and continue";

export function guidedIntakeClarificationsAnsweredCounter(
  answeredCount: number,
  totalCount: number,
): string {
  return `${answeredCount} of ${totalCount} answered`;
}

export const GUIDED_INTAKE_REVIEW_ANSWERS_DISABLED_HINT =
  "Handle all required clarifications before reviewing answers.";

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

export const GUIDED_INTAKE_ALREADY_SUBMITTED_LEAD = "This architecture already started a review.";

export const GUIDED_INTAKE_ALREADY_SUBMITTED_BODY =
  "Submit is not available again for this saved architecture draft. Open the existing review to continue, or start a new architecture draft if you need a separate review.";

export const GUIDED_INTAKE_ALREADY_SUBMITTED_STUCK_BODY =
  "Submit already ran for this draft and is still finishing on the server. Open the review if one exists, or retry later with the correlation id from troubleshooting if no review appears.";

export const GUIDED_INTAKE_ALREADY_SUBMITTED_OPEN_REVIEW_CTA = "Open review";

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

  return `Complete ${blockers.slice(0, -1).join(", ")} and ${blockers[blockers.length - 1]} to continue.`;
}
