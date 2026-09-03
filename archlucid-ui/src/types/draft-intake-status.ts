/** Lifecycle state for a draft request (ADR 0048). */
export type DraftRequestStatus =
  | "Drafting"
  | "Admitted"
  | "Submitted"
  | "RunSpawned"
  | "Redirected"
  | "Abandoned";

export type DraftBranchOverrideKind =
  | "QuestionAnswer"
  | "BusinessOutcome"
  | "FreeTextIntent"
  | "SystemName";
