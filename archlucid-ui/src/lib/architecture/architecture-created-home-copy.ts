export const ARCHITECTURE_CREATED_CONFIRMATION_FROM_BRIEF =
  "Architecture draft created from your brief." as const;

export const ARCHITECTURE_CREATED_CONFIRMATION_BRIEF_NOT_STORED =
  "Architecture draft created. Brief text was not stored." as const;

export function resolveArchitectureCreatedConfirmation(submittedBriefStored: boolean): string {
  return submittedBriefStored
    ? ARCHITECTURE_CREATED_CONFIRMATION_FROM_BRIEF
    : ARCHITECTURE_CREATED_CONFIRMATION_BRIEF_NOT_STORED;
}

export const ARCHITECTURE_CREATED_SUMMARY_HEADING = "Architecture summary" as const;

export const ARCHITECTURE_CREATED_DEFINITION_STATUS_HEADING = "Architecture definition" as const;

export const ARCHITECTURE_CREATED_MISSING_HEADING = "Still needed" as const;

export const ARCHITECTURE_CREATED_NEXT_STEP_HEADING = "Recommended next step" as const;

export const ARCHITECTURE_DEFINITION_STATUS_LABELS = {
  "strong-foundation": "Brief meets minimum length checks",
  "needs-clarification": "Brief needs more detail",
  "insufficient-context": "Brief below minimum length",
} as const;

export const ARCHITECTURE_DEFINITION_STATUS_HELPER =
  "Status reflects stored brief length and fields, not a quality grade." as const;

export const ARCHITECTURE_CREATED_PRIMARY_ACTIONS = {
  continueClarifying: "Continue clarifying",
  generateDiagram: "Generate architecture diagram",
  runAssessment: "Run initial assessment",
  viewAssessmentProgress: "View assessment progress",
} as const;

export const ARCHITECTURE_CREATED_OVERFLOW_LABEL = "More actions" as const;

export const ARCHITECTURE_SUMMARY_LABELS = {
  businessPurpose: "Business purpose",
  primaryUsers: "Primary users",
  majorSystems: "Major systems",
  keyIntegrations: "Key integrations",
  constraints: "Important constraints",
} as const;
