import type { SecureNowQuestion } from "@/lib/infra-evidence/securenow-question-queue-api";

function isSubscriptionOrResourceGroupScope(scopeKind: string | null | undefined): boolean {
  const normalized = scopeKind?.trim().toLowerCase() ?? "";

  return normalized === "subscription" || normalized === "resourcegroup";
}

/**
 * Resource id sent on disposition mutations. Pack elicitation rows may list a null resource id while the API accepts an empty string.
 */
export function secureNowQuestionDispositionMutationResourceId(
  question: SecureNowQuestion,
): string | null {
  if (question.resourceId !== null && question.resourceId !== undefined) {
    return question.resourceId;
  }

  return isSubscriptionOrResourceGroupScope(question.scopeKind) ? "" : null;
}
