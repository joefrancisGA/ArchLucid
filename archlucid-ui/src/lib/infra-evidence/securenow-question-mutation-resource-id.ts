import type { SecureNowQuestion } from "@/lib/infra-evidence/securenow-question-queue-api";

function inferredConnectionIdFromQuestionKey(questionKey: string): string | null {
  const versionIndex = questionKey.toLowerCase().lastIndexOf("@v");
  const base = versionIndex >= 0 ? questionKey.slice(0, versionIndex) : questionKey;
  const suffix = base.split("-").pop() ?? "";

  if (!/^[0-9a-f]{32}$/i.test(suffix)) {
    return null;
  }

  return suffix.replace(/-/g, "").toLowerCase();
}

export function secureNowQuestionHasPackStyleDispositionScope(
  scopeKind: string | null | undefined,
): boolean {
  const normalized = scopeKind?.trim().toLowerCase() ?? "";

  return normalized === "subscription" || normalized === "resourcegroup";
}

export function secureNowQuestionIsPolicyPackDispositionRow(
  question: Pick<SecureNowQuestion, "source" | "scopeKind">,
): boolean {
  if (secureNowQuestionHasPackStyleDispositionScope(question.scopeKind)) {
    return true;
  }

  return question.source?.trim() === "PolicyPack";
}

/** Mirrors `SecureNowPackQuestionScopeKindResolver.ResolveFromPrompt` on the API. */
export function secureNowQuestionPackScopeKindFromPrompt(questionText: string): "Subscription" | "ResourceGroup" {
  if (questionText.toLowerCase().includes("resource group")) {
    return "ResourceGroup";
  }

  return "Subscription";
}

/**
 * Resource id sent on disposition mutations. Pack elicitation rows may list a null resource id while the API accepts an empty string.
 */
export function secureNowQuestionDispositionMutationSubscriptionId(
  subscriptionId: string | null | undefined,
): string | null {
  if (subscriptionId === null || subscriptionId === undefined) {
    return null;
  }

  const trimmed = subscriptionId.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function secureNowQuestionDispositionMutationResourceId(
  question: SecureNowQuestion,
): string | null {
  if (question.resourceId !== null && question.resourceId !== undefined) {
    return question.resourceId;
  }

  if (secureNowQuestionIsPolicyPackDispositionRow(question)) {
    return "";
  }

  return null;
}

/**
 * Source sent on disposition mutations. Pack rows may omit `source` in list JSON while mutations require `PolicyPack`.
 */
export function secureNowQuestionDispositionMutationSource(
  question: Pick<SecureNowQuestion, "source" | "scopeKind" | "questionKey">,
): string | null {
  const trimmed = question.source?.trim();
  if (trimmed && trimmed.length > 0) {
    return trimmed;
  }

  if (secureNowQuestionHasPackStyleDispositionScope(question.scopeKind)) {
    return "PolicyPack";
  }

  const normalizedScope = question.scopeKind?.trim().toLowerCase() ?? "";
  if (normalizedScope === "resource") {
    if (inferredConnectionIdFromQuestionKey(question.questionKey) !== null) {
      return "InferredConnection";
    }

    return "InventoryEvidence";
  }

  return null;
}

/**
 * Scope sent on disposition mutations when list JSON omitted `scopeKind` but the row is still a pack elicitation question.
 */
export function secureNowQuestionDispositionMutationScopeKind(
  question: Pick<SecureNowQuestion, "source" | "scopeKind" | "questionKey" | "questionText">,
): string | null {
  const trimmed = question.scopeKind?.trim();
  if (trimmed && trimmed.length > 0) {
    return trimmed;
  }

  const mutationSource = secureNowQuestionDispositionMutationSource(question);
  if (mutationSource === "PolicyPack") {
    return secureNowQuestionPackScopeKindFromPrompt(question.questionText);
  }

  if (mutationSource === "InventoryEvidence" || mutationSource === "InferredConnection") {
    return "Resource";
  }

  return null;
}
