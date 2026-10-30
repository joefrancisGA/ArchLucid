import type { SecureNowQuestion } from "@/lib/infra-evidence/securenow-question-queue-api";
import { secureNowQuestionAnswerLabel } from "@/lib/infra-evidence/securenow-question-answer-label";

function inferredConnectionIdFromQuestionKey(questionKey: string | null | undefined): string | null {
  const normalized = questionKey?.trim() ?? "";
  if (normalized.length === 0) {
    return null;
  }

  const versionIndex = normalized.toLowerCase().lastIndexOf("@v");
  const base = versionIndex >= 0 ? normalized.slice(0, versionIndex) : normalized;
  const suffix = base.split("-").pop() ?? "";

  if (!/^[0-9a-f]{32}$/i.test(suffix)) {
    return null;
  }

  return suffix.replace(/-/g, "").toLowerCase();
}

/** Whether the listed question key suffix encodes an inferred-connection identity. */
export function secureNowQuestionDispositionQuestionKeyImpliesInferredConnection(
  questionKey: string | null | undefined,
): boolean {
  return inferredConnectionIdFromQuestionKey(questionKey) !== null;
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
export function secureNowQuestionPackScopeKindFromPrompt(
  questionText: string | null | undefined,
): "Subscription" | "ResourceGroup" {
  // Listed prompts are OpenAPI-nullable; missing text matches the C# resolver's subscription default.
  const prompt = questionText ?? "";

  if (prompt.toLowerCase().includes("resource group")) {
    return "ResourceGroup";
  }

  return "Subscription";
}

/**
 * Resource id sent on disposition mutations. Pack elicitation rows may list a null resource id while the API accepts an empty string.
 */
export function secureNowQuestionDispositionMutationEvidenceFingerprint(
  evidenceFingerprint: string | null | undefined,
): string | null {
  if (evidenceFingerprint === null || evidenceFingerprint === undefined) {
    return null;
  }

  const trimmed = evidenceFingerprint.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function secureNowQuestionDispositionMutationQuestionKey(
  questionKey: string | null | undefined,
): string | null {
  if (questionKey === null || questionKey === undefined) {
    return null;
  }

  const trimmed = questionKey.trim();
  return trimmed.length > 0 ? trimmed : null;
}

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
    const trimmed = question.resourceId.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }

    if (secureNowQuestionIsPolicyPackDispositionRow(question)) {
      return "";
    }

    return null;
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
export function secureNowQuestionShowsInferredConnectionReviewerCopy(
  question: Pick<SecureNowQuestion, "source">,
  matchesInferredConnection: boolean,
): boolean {
  if (question.source?.trim() === "InferredConnection") {
    return true;
  }

  return matchesInferredConnection;
}

function secureNowQuestionReviewerScopeLabelFromKind(scopeKind: string): string | null {
  if (scopeKind === "Resource") {
    return "This resource.";
  }

  if (scopeKind === "Subscription") {
    return "This subscription.";
  }

  if (scopeKind === "ResourceGroup") {
    return "This resource group.";
  }

  return null;
}

export function secureNowQuestionPackAnswerChoiceLabel(
  question: Pick<SecureNowQuestion, "source" | "scopeKind" | "questionKey" | "questionText">,
  answerCode: string,
): string {
  const label = secureNowQuestionAnswerLabel(answerCode);
  const trimmedCode = answerCode.trim();

  if (!secureNowQuestionIsPolicyPackDispositionRow(question) || trimmedCode.length === 0) {
    return label;
  }

  if (label.startsWith("Answer code ")) {
    return label;
  }

  return `${label} (${trimmedCode})`;
}

export function secureNowQuestionReviewerScopeLabel(
  question: Pick<SecureNowQuestion, "source" | "scopeKind" | "questionKey" | "questionText">,
  _matchesInferredConnection: boolean,
): string {
  const trimmedScope = question.scopeKind?.trim() ?? "";
  if (trimmedScope.length > 0) {
    const knownLabel = secureNowQuestionReviewerScopeLabelFromKind(trimmedScope);
    return knownLabel ?? `Question scope code ${trimmedScope} has no reviewer label.`;
  }

  if (secureNowQuestionIsPolicyPackDispositionRow(question)) {
    const inferredScope = secureNowQuestionDispositionMutationScopeKind(question);
    if (inferredScope !== null) {
      const inferredLabel = secureNowQuestionReviewerScopeLabelFromKind(inferredScope);
      if (inferredLabel !== null) {
        return `${inferredLabel} Scope kind was not stored; inferred from pack prompt.`;
      }
    }
  }

  return "Question scope was not stored.";
}

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

  return null;
}

export function secureNowQuestionReviewerSubscriptionLabel(
  subscriptionId: string | null | undefined,
): string {
  const mutationSubscriptionId =
    secureNowQuestionDispositionMutationSubscriptionId(subscriptionId);
  if (mutationSubscriptionId !== null) {
    return mutationSubscriptionId;
  }

  if (subscriptionId === null || subscriptionId === undefined) {
    return "Subscription id was not stored.";
  }

  return "Subscription id was stored empty.";
}

export function secureNowQuestionReviewerEvidenceFingerprintLine(
  evidenceFingerprint: string | null | undefined,
): string {
  const mutationFingerprint =
    secureNowQuestionDispositionMutationEvidenceFingerprint(evidenceFingerprint);
  if (mutationFingerprint === null) {
    return "Evidence fingerprint was not stored.";
  }

  return `Evidence fingerprint: ${mutationFingerprint}`;
}

export function secureNowQuestionReviewerSourceLabel(
  question: Pick<SecureNowQuestion, "source" | "scopeKind" | "questionKey">,
  _matchesInferredConnection: boolean,
): string {
  const source = question.source;

  if (source === null || source === undefined) {
    return "Question source was not stored.";
  }

  const trimmed = source.trim();

  if (trimmed.length === 0) {
    return "Question source was stored empty.";
  }

  if (trimmed === "InventoryEvidence") {
    return "Asked from inventory evidence.";
  }

  if (trimmed === "InferredConnection") {
    return "Asked because a connection was inferred. Answering does not store a link.";
  }

  if (trimmed === "PolicyPack") {
    return "Asked from an assigned policy pack.";
  }

  return `Question source code ${trimmed} has no reviewer label.`;
}
