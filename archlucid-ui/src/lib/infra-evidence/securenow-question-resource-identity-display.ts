import type { SecureNowQuestion } from "@/lib/infra-evidence/securenow-question-queue-api";
import { formatDiagramArmTypeFriendlyName } from "@/lib/infra-evidence/format-diagram-arm-type-friendly-name";
import { normalizeSecureNowResourceNameForDisplay } from "@/lib/infra-evidence/format-azure-resource-display";

import { secureNowQuestionHasPackStyleDispositionScope } from "@/lib/infra-evidence/securenow-question-mutation-resource-id";

function isPolicyPackQuestion(question: SecureNowQuestion): boolean {
  return question.source?.trim() === "PolicyPack"
    && secureNowQuestionHasPackStyleDispositionScope(question.scopeKind);
}

export function secureNowQuestionResourceTypeLabel(question: SecureNowQuestion): string | null {
  if (isPolicyPackQuestion(question)) {
    return null;
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

    return "Subscription question";
  }

  if (question.resourceName === null || question.resourceName === undefined) {
    return "Resource name was not stored.";
  }

  if (question.resourceName.trim().length === 0) {
    return "Resource name was stored empty.";
  }

  return normalizeSecureNowResourceNameForDisplay(question.resourceName);
}
