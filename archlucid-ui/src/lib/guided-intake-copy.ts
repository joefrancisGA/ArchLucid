/** Guided intake step 0 — buyer-facing placeholders and helper copy. */
export const GUIDED_INTAKE_STEP0_PROGRESS_LABEL = "Describe the system";

export const GUIDED_INTAKE_STEP0_CARD_TITLE = "Describe the architecture intent";

export const GUIDED_INTAKE_STEP0_CARD_DESCRIPTION =
  "Describe the system, the business outcome, and the users or systems that interact with it.";

export const GUIDED_INTAKE_ARCHITECTURE_INTENT_MIN_CHARS = 100;

export const GUIDED_INTAKE_ARCHITECTURE_INTENT_MIN_HELPER =
  "Provide at least 100 characters so ArchLucid can understand the system, outcome, and review focus.";

export const GUIDED_INTAKE_ARCHITECTURE_INTENT_PLACEHOLDER =
  "Describe the system, business outcome, users, integrations, constraints, risks, and what you want ArchLucid to evaluate.";

export function guidedIntakeArchitectureIntentHelperText(trimmedLength: number): string {
  if (trimmedLength === 0) {
    return GUIDED_INTAKE_ARCHITECTURE_INTENT_MIN_HELPER;
  }

  if (trimmedLength < GUIDED_INTAKE_ARCHITECTURE_INTENT_MIN_CHARS) {
    return `${trimmedLength} / ${GUIDED_INTAKE_ARCHITECTURE_INTENT_MIN_CHARS} characters. ${GUIDED_INTAKE_ARCHITECTURE_INTENT_MIN_HELPER}`;
  }

  return `${trimmedLength} characters.`;
}

export const GUIDED_INTAKE_BUSINESS_OUTCOME_PLACEHOLDER =
  "Example: Reduce intake cycle time, improve auditability, and give operations teams a single governed workflow for claims submissions.";

export const GUIDED_INTAKE_ACTORS_SECTION_HEADING = "Actors and integrations";

export const GUIDED_INTAKE_TRUST_BOUNDARY_HINT =
  "Add the people, systems, services, tenants, jobs, or APIs that interact with this architecture. Missing one can hide trust boundaries.";

export const GUIDED_INTAKE_ACTORS_EMPTY_STATE = "No actors added yet.";

export const GUIDED_INTAKE_SUGGEST_ACTORS_BUTTON = "Suggest actors from intent";

export const GUIDED_INTAKE_SUGGEST_ACTORS_DISABLED_HINT = "Enter architecture intent first.";

export const GUIDED_INTAKE_SUGGESTED_ACTORS_HEADING = "Suggested actors";

export const GUIDED_INTAKE_ADD_SELECTED_ACTORS_BUTTON = "Add selected actors";

export const GUIDED_INTAKE_ADD_ACTOR_BUTTON = "Add actor";

export const GUIDED_INTAKE_CONFIRM_ACTOR_BUTTON = "Confirm actor";

export const GUIDED_INTAKE_CONTINUE_TO_CLARIFICATIONS = "Continue to clarifications";

export const GUIDED_INTAKE_DRAFT_GUIDANCE_CALLOUT =
  "Draft guidance only. Nothing is added to review evidence until you submit.";
