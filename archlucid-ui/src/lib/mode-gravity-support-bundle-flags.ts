/** MG-023 — support bundle lists flags without implying Career. */
export const MODE_GRAVITY_SUPPORT_BUNDLE_FLAG_FIELDS = [
  "workspaceMode",
  "workingCareerRehearsalDoor",
  "structuralExecutionMode",
  "executePostureCapturedUtc",
  "demoMode",
  "staticDemoOperator",
  "operatorExperience",
] as const;

export const MODE_GRAVITY_SUPPORT_BUNDLE_RUNBOOK_LINE =
  "Read workspaceMode and door stamp before inferring Career — density flags alone do not prove Career (MG-023 / CG-092)." as const;
