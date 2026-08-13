/** Explicit workflow intent carried from homepage actions through creation and review surfaces. */
export type ArchitectureWorkflowIntent = "create-architecture" | "start-review";

export const CREATE_ARCHITECTURE_INTENT = "create-architecture" as const;

export const START_REVIEW_INTENT = "start-review" as const;

export const ARCHITECTURE_WORKFLOW_INTENT_QUERY_PARAM = "intent";

export function resolveArchitectureWorkflowIntent(
  readParam: (key: string) => string | null,
): ArchitectureWorkflowIntent | null {
  const raw = readParam(ARCHITECTURE_WORKFLOW_INTENT_QUERY_PARAM)?.trim().toLowerCase() ?? "";

  if (raw === CREATE_ARCHITECTURE_INTENT) {
    return CREATE_ARCHITECTURE_INTENT;
  }

  if (raw === START_REVIEW_INTENT) {
    return START_REVIEW_INTENT;
  }

  return null;
}

export function isCreateArchitectureIntent(
  intent: ArchitectureWorkflowIntent | null,
): intent is typeof CREATE_ARCHITECTURE_INTENT {
  return intent === CREATE_ARCHITECTURE_INTENT;
}
