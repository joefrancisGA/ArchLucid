/** Working nested architecture tool chrome — resume, wayfinding, keyboard (ADR 0079 / AO-34). */

export const WORKING_ARCHITECTURE_NESTED_BREADCRUMB_ARCHITECTURES_LABEL = "Architectures" as const;

export const WORKING_ARCHITECTURE_NESTED_BREADCRUMB_DESK_LABEL = "Architecture desk" as const;

export const WORKING_ARCHITECTURE_NESTED_ARCHITECTURE_SLUG_LABEL = "Architecture slug" as const;

export const WORKING_ARCHITECTURE_NESTED_KEYBOARD_HINT =
  "Ctrl+K jump · F1 shortcuts · Back to desk link above" as const;

export const WORKING_ARCHITECTURE_NESTED_RESUME_DRAFT_HEADING = "Continue open draft" as const;

export const WORKING_ARCHITECTURE_NESTED_RESUME_REVIEW_HEADING = "Continue in-progress review" as const;

export const WORKING_ARCHITECTURE_NESTED_IDENTITY_LOADING_LABEL = "Loading architecture" as const;

export const WORKING_ARCHITECTURE_NESTED_IDENTITY_UNAVAILABLE_LABEL = "Architecture unavailable" as const;

export type WorkingArchitectureNestedToolLabel =
  | "Ask"
  | "Compare"
  | "Draft"
  | "Findings"
  | "Graph"
  | "Impact preview"
  | "Review"
  | "Start review"
  | "Search";

export function workingArchitectureNestedDocumentTitleSuffix(
  toolLabel: WorkingArchitectureNestedToolLabel,
): string {
  return ` · ${toolLabel}`;
}
