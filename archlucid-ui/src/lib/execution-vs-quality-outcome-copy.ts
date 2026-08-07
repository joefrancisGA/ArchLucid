/**
 * TB-965 / TB-963: buyer-safe distinction between execution failure and quality reject.
 * Quality HOLD is not a platform outage — never label it as a generic LLM/transport error.
 */

export const QUALITY_GATE_FAILURE_CLASS = "qualityGate";

export const EXECUTION_COMPLETED_QUALITY_REJECTED_STATUS = "ExecutionCompletedQualityRejected";

/** Phrases that must not appear on quality-outcome buyer/operator surfaces. */
export const FORBIDDEN_QUALITY_OUTCOME_OUTAGE_PHRASES: readonly string[] = [
  "LLM error",
  "llm error",
  "model failed",
  "Model failed",
  "AI service temporarily unavailable",
  "platform outage",
  "transport error",
] as const;

export type ExecutionVsQualityAxis = "quality" | "execution";

export type LastFailureCardCopy = {
  readonly axis: ExecutionVsQualityAxis;
  readonly title: string;
  readonly failureClassLabel: string;
  readonly remediation: string;
  readonly triageTitle: string | null;
  readonly rejectCategoryLabel: string | null;
};

const FAILURE_CLASS_LABELS: Record<string, string> = {
  timeout: "Timeout",
  canceled: "Canceled",
  parse: "Parse / schema failure",
  circuitBreaker: "AI circuit open",
  quota: "Token quota",
  costBudget: "Run cost budget",
  invalidOperation: "Invalid operation",
  dependency: "Dependency failure",
  missingCredentials: "Missing credentials",
  contentSafety: "Content safety block",
  qualityGate: "Quality gate",
  pipelineDeadLetter: "Pipeline dead-letter",
  unknown: "Unknown",
};

const REJECT_CATEGORY_LABELS: Record<string, string> = {
  structural: "Structure — output shape or completeness below the bar",
  semantic: "Substance — findings or claims below the semantic bar",
  faithfulness: "Grounding — citations or evidence support below the bar",
  grounding: "Grounding — citations or evidence support below the bar",
  none: "Quality gate",
};

const TRIAGE_TITLES: Record<string, string> = {
  groundingInsufficiency: "Output failed the grounding / quality bar",
  missingCredentials: "Missing Azure OpenAI credentials or deployment config",
  contentSafetyRejection: "Content safety blocked prompt or model output",
  schemaViolation: "Agent result JSON failed schema or parse validation",
  timeout: "Agent or LLM call timed out",
  budgetCutoff: "Token quota or run cost budget cutoff",
  fallbackToSimulator: "Real-mode path fell back to simulator results",
  partialRequiredAgentsIncomplete: "Partial run — required agents incomplete",
};

export function isQualityGateFailureClass(failureClass: string | null | undefined): boolean {
  return (failureClass ?? "").trim() === QUALITY_GATE_FAILURE_CLASS;
}

export function isQualityRejectedRunStatus(legacyRunStatus: string | null | undefined): boolean {
  return (legacyRunStatus ?? "").trim() === EXECUTION_COMPLETED_QUALITY_REJECTED_STATUS;
}

export function resolveExecutionVsQualityAxis(args: {
  readonly failureClass?: string | null;
  readonly legacyRunStatus?: string | null;
}): ExecutionVsQualityAxis {
  if (isQualityGateFailureClass(args.failureClass) || isQualityRejectedRunStatus(args.legacyRunStatus)) {
    return "quality";
  }

  return "execution";
}

export function plainLanguageFailureClassLabel(failureClass: string | null | undefined): string {
  const key = (failureClass ?? "").trim();

  if (key.length === 0) {
    return FAILURE_CLASS_LABELS.unknown;
  }

  return FAILURE_CLASS_LABELS[key] ?? key;
}

export function plainLanguageRejectCategoryLabel(category: string | null | undefined): string | null {
  const key = (category ?? "").trim().toLowerCase();

  if (key.length === 0 || key === "none") {
    return null;
  }

  return REJECT_CATEGORY_LABELS[key] ?? `Quality category: ${key}`;
}

export function plainLanguageTriageTitle(triageScenarioId: string | null | undefined): string | null {
  const key = (triageScenarioId ?? "").trim();

  if (key.length === 0) {
    return null;
  }

  return TRIAGE_TITLES[key] ?? null;
}

export function resolveLastFailureCardCopy(args: {
  readonly failureClass?: string | null;
  readonly legacyRunStatus?: string | null;
  readonly triageScenarioId?: string | null;
  readonly rejectReasonCategory?: string | null;
}): LastFailureCardCopy {
  const axis = resolveExecutionVsQualityAxis(args);
  const failureClassLabel = plainLanguageFailureClassLabel(args.failureClass);
  const triageTitle = plainLanguageTriageTitle(args.triageScenarioId);
  const rejectCategoryLabel = plainLanguageRejectCategoryLabel(args.rejectReasonCategory);

  if (axis === "quality") {
    return {
      axis,
      title: "Quality gate rejected — HOLD (not an outage)",
      failureClassLabel,
      remediation:
        "Enrich architecture evidence or context, review quality scores, then re-execute. Do not treat this as a platform or LLM outage — the run completed enough to evaluate and failed the quality bar.",
      triageTitle: triageTitle ?? "Output failed the grounding / quality bar",
      rejectCategoryLabel,
    };
  }

  return {
    axis,
    title: "Agent execution failed",
    failureClassLabel,
    remediation:
      "Fix configuration, credentials, network, schema, or budget issues, then retry when stable. Inspect agent traces if needed. Raw LLM payloads are not shown here.",
    triageTitle,
    rejectCategoryLabel: null,
  };
}

export function resolveQualityRejectedWorkspaceStatusLabel(): string {
  return "Quality gate rejected";
}

export function resolveExecutionFailedWorkspaceStatusLabel(): string {
  return "Execution failed";
}

export function resolveQualityRejectedCommitBlockedReason(): string {
  return "Quality gate rejected this review — enrich evidence or context, then re-execute before finalizing. This is not a platform outage.";
}

/** Returns matching forbidden phrases found in copy (empty = honest for TB-965 guards). */
export function findForbiddenQualityOutagePhrases(copy: string): string[] {
  const haystack = copy;
  const hits: string[] = [];

  for (const phrase of FORBIDDEN_QUALITY_OUTCOME_OUTAGE_PHRASES) {
    let from = 0;

    while (from <= haystack.length) {
      const idx = haystack.indexOf(phrase, from);

      if (idx < 0) {
        break;
      }

      // Allow intentional negations such as "not a platform outage" / "not an LLM outage".
      const ahead = haystack.slice(Math.max(0, idx - 12), idx).toLowerCase();

      if (ahead.includes("not a ") || ahead.includes("not an ")) {
        from = idx + phrase.length;
        continue;
      }

      hits.push(phrase);
      break;
    }
  }

  return hits;
}
