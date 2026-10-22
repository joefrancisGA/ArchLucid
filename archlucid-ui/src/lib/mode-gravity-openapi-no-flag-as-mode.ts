/** MG-016 — API execute posture is AgentExecution:Mode + run stamp; UI flags are not Mode. */
export const MODE_GRAVITY_OPENAPI_SNAPSHOT_RELATIVE_PATH =
  "ArchLucid.Api.Tests/Contracts/openapi-v1.contract.snapshot.json" as const;

export const MODE_GRAVITY_FORBIDDEN_UI_FLAG_AS_MODE_FIELDS = [
  "buyerPolished",
  "operatorExperience",
  "NEXT_PUBLIC_OPERATOR_EXPERIENCE",
  "workspaceModeAsExecuteMode",
] as const;

export const MODE_GRAVITY_OPENAPI_STAMP_FIELDS = [
  "workingCareerRehearsalDoor",
  "executePostureCapturedUtc",
  "structuralExecutionMode",
] as const;
