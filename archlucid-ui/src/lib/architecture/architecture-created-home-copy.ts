export const ARCHITECTURE_CREATED_CONFIRMATION =
  "Architecture draft created from your brief." as const;

export const ARCHITECTURE_CREATED_SUMMARY_HEADING = "Architecture summary" as const;

export const ARCHITECTURE_CREATED_DEFINITION_STATUS_HEADING = "Architecture definition" as const;

export const ARCHITECTURE_CREATED_MISSING_HEADING = "Still needed" as const;

export const ARCHITECTURE_CREATED_NEXT_STEP_HEADING = "Recommended next step" as const;

export const ARCHITECTURE_DEFINITION_STATUS_LABELS = {
  "strong-foundation": "Strong foundation",
  "needs-clarification": "Needs clarification",
  "insufficient-context": "Insufficient system context",
} as const;

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
