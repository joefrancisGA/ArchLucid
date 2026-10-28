import { coerceArchitectureFindingSeverity } from "@/lib/quick-decision-severity-labels";

export const QUICK_DECISION_FINDING_TITLE_NOT_STORED = "Finding title was not stored" as const;
export const QUICK_DECISION_FINDING_TITLE_STORED_EMPTY = "Finding title was stored empty." as const;

export const QUICK_DECISION_FINDING_RECOMMENDATION_NOT_STORED = "Recommended action was not stored." as const;

export function resolveQuickDecisionFindingTitleAndMessage(fr: Record<string, unknown>): {
  readonly title: string;
  readonly messageBody: string;
} {
  const rawTitle = typeof fr.title === "string" ? fr.title : null;
  const message = typeof fr.message === "string" ? fr.message.trim() : "";

  if (rawTitle !== null) {
    const trimmedTitle = rawTitle.trim();

    if (trimmedTitle.length > 0) {
      return {
        title: trimmedTitle,
        messageBody: message,
      };
    }

    if (rawTitle.length > 0) {
      return {
        title: QUICK_DECISION_FINDING_TITLE_STORED_EMPTY,
        messageBody: message,
      };
    }
  }

  return {
    title: QUICK_DECISION_FINDING_TITLE_NOT_STORED,
    messageBody: message,
  };
}

/** Prefer stored recommended actions, then rationale, then reasoning trace — no invented remediation. */
export function resolveQuickDecisionFindingRecommendation(fr: Record<string, unknown>): string {
  const recommendedActionsRaw = fr.recommendedActions;

  if (Array.isArray(recommendedActionsRaw)) {
    for (const action of recommendedActionsRaw) {
      if (typeof action === "string" && action.trim().length > 0) {
        return action.trim();
      }
    }
  }

  const rationale = typeof fr.rationale === "string" ? fr.rationale.trim() : "";

  if (rationale.length > 0) {
    return rationale;
  }

  const reasoningTrace = typeof fr.reasoningTrace === "string" ? fr.reasoningTrace.trim() : "";

  if (reasoningTrace.length > 0) {
    return reasoningTrace;
  }

  return QUICK_DECISION_FINDING_RECOMMENDATION_NOT_STORED;
}

export function resolveQuickDecisionFindingPresentation(fr: Record<string, unknown>): {
  readonly title: string;
  readonly recommendation: string;
} {
  const { title, messageBody } = resolveQuickDecisionFindingTitleAndMessage(fr);
  const recommendation =
    messageBody.length > 0 ? messageBody : resolveQuickDecisionFindingRecommendation(fr);

  return { title, recommendation };
}

export function coerceQuickDecisionFindingSeverityFromWire(raw: unknown): number | null {
  return coerceArchitectureFindingSeverity(raw);
}
