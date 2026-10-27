import type { SecureNowQuestion } from "@/lib/infra-evidence/securenow-question-queue-api";
import { formatDiagramArmTypeFriendlyName } from "@/lib/infra-evidence/format-diagram-arm-type-friendly-name";
import { normalizeSecureNowResourceNameForDisplay } from "@/lib/infra-evidence/format-azure-resource-display";

import {
  secureNowQuestionIsPolicyPackDispositionRow,
  secureNowQuestionPackScopeKindFromPrompt,
} from "@/lib/infra-evidence/securenow-question-mutation-resource-id";

function isPolicyPackQuestion(question: SecureNowQuestion): boolean {
  return secureNowQuestionIsPolicyPackDispositionRow(question);
}

export function secureNowQuestionResourceTypeLabel(question: SecureNowQuestion): string | null {
  if (isPolicyPackQuestion(question)) {
    return null;
  }

  if (question.resourceType === null || question.resourceType === undefined) {
    return "Resource type was not stored";
  }

  if (question.resourceType.trim().length === 0) {
    return "Resource type was not stored";
  }

  return formatDiagramArmTypeFriendlyName(question.resourceType) ?? "Resource type was not stored";
}

export function secureNowQuestionResourceDisplayName(question: SecureNowQuestion): string {
  if (isPolicyPackQuestion(question)) {
    const normalizedScope = question.scopeKind?.trim().toLowerCase() ?? "";

    if (normalizedScope === "resourcegroup") {
      return "Resource group question";
    }

    if (normalizedScope === "resource") {
      return "Resource-scoped question";
    }

    if (normalizedScope === "subscription") {
      return "Subscription question";
    }

    const inferredScope = secureNowQuestionPackScopeKindFromPrompt(question.questionText ?? "");
    return inferredScope === "ResourceGroup"
      ? "Resource group question"
      : "Subscription question";
  }

  const scope = question.scopeKind?.trim().toLowerCase() ?? "";

  if (scope === "resource" && (question.resourceName === null || question.resourceName === undefined)) {
    return "Resource-scoped question (resource name was not stored).";
  }

  if (question.resourceName === null || question.resourceName === undefined) {
    return "Resource name was not stored.";
  }

  if (question.resourceName.trim().length === 0) {
    return "Resource name was stored empty.";
  }

  return normalizeSecureNowResourceNameForDisplay(question.resourceName);
}
