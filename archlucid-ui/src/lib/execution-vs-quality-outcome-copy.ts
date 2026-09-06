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

/** Buyer-visible one-line cause — not raw failureClass labels like "Invalid operation". */
const FAILURE_CLASS_CAUSE_SENTENCES: Record<string, string> = {
  timeout: "An agent or LLM call timed out before finishing.",
  canceled: "The review was canceled before it finished.",
  parse: "Agent output could not be parsed or did not match the expected schema.",
  circuitBreaker: "The AI circuit breaker is open — live model calls are temporarily blocked.",
  quota: "The review hit a token quota limit.",
  costBudget: "The review hit a run cost budget cutoff.",
  invalidOperation: "The review invoked an operation that is not valid for this workspace or configuration.",
  dependency: "A required dependency failed during review execution.",
  missingCredentials: "Azure OpenAI credentials or deployment configuration is missing.",
  contentSafety: "Content safety blocked the prompt or model output.",
  qualityGate: "Output failed the quality gate — enrich evidence and re-execute.",
  pipelineDeadLetter: "The review pipeline stopped and could not schedule further work.",
  unknown: "The review failed for a reason that was not classified.",
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

/** Plain-language sentence for "What failed" — prefer triage title, then failure-class cause. */
export function plainLanguageFailureCauseSentence(args: {
  readonly failureClass?: string | null;
  readonly triageScenarioId?: string | null;
  readonly reasonCode?: string | null;
  readonly completedStages?: number;
}): string {
  const triageTitle = plainLanguageTriageTitle(args.triageScenarioId);

  if (triageTitle !== null) {
    const stagePrefix = resolveFailureStageReachedPhrase(args.completedStages ?? 0);
    const resolutionHint = resolveFailureResolutionHint(args.failureClass, args.reasonCode);

    return `${stagePrefix} ${triageTitle}${resolutionHint.length > 0 ? ` (${resolutionHint})` : ""}`;
  }

  const failureClass = (args.failureClass ?? "").trim();
  const completedStages = args.completedStages ?? 0;
  const likelyCause = resolveLikelyCauseFromArgs(args);

  if (likelyCause !== null) {
    const stagePrefix = resolveFailureStageReachedPhrase(completedStages);

    return `${stagePrefix} ${likelyCause}`;
  }

  if (failureClass.length > 0 && FAILURE_CLASS_CAUSE_SENTENCES[failureClass] !== undefined) {
    const stagePrefix = resolveFailureStageReachedPhrase(completedStages);
    const cause = FAILURE_CLASS_CAUSE_SENTENCES[failureClass];
    const resolutionHint = resolveFailureResolutionHint(failureClass, args.reasonCode);

    return `${stagePrefix} ${cause}${resolutionHint.length > 0 ? ` — ${resolutionHint}` : ""}`;
  }

  if (failureClass.length > 0) {
    const label = plainLanguageFailureClassLabel(failureClass).toLowerCase();

    if (label === "invalid operation") {
      const stagePrefix = resolveFailureStageReachedPhrase(completedStages);

      return `${stagePrefix} Processing stopped for a configuration or scheduling issue — re-run after your workspace AI setup is confirmed, or share the review ID with support.`;
    }

    return `The review failed (${label}).`;
  }

  const reasonCode = (args.reasonCode ?? "").trim();

  if (reasonCode.length > 0) {
    return `The review failed (reason code ${reasonCode}).`;
  }

  return FAILURE_CLASS_CAUSE_SENTENCES.unknown;
}

function resolveFailureStageReachedPhrase(completedStages: number): string {
  switch (completedStages) {
    case 0:
      return "Processing stopped before the first assessment stage.";
    case 1:
      return "Processing stopped after source context was captured.";
    case 2:
      return "Processing stopped after the evidence graph was built.";
    case 3:
      return "Processing stopped after findings were produced.";
    default:
      return "Processing stopped before the review finished.";
  }
}

const TRANSIENT_FAILURE_CLASSES = new Set(["timeout", "canceled", "circuitBreaker", "dependency"]);
const CONFIGURATION_FAILURE_CLASSES = new Set([
  "missingCredentials",
  "invalidOperation",
  "parse",
  "quota",
  "costBudget",
]);

function resolveFailureResolutionHint(
  failureClass: string | null | undefined,
  reasonCode: string | null | undefined,
): string {
  const failureKey = (failureClass ?? "").trim();
  const reason = (reasonCode ?? "").trim();

  if (reason === "NoScheduledAgentTasks" || reason === "MissingArchitectureRequest") {
    return "configuration issue — re-run after scheduling is restored, or contact support with the review ID";
  }

  if (reason === "ExecuteOwnershipLeaseExpired") {
    return "worker lost — reopen or retry execute; any unpersisted LLM spend may rebill on retry";
  }

  if (CONFIGURATION_FAILURE_CLASSES.has(failureKey)) {
    return "configuration issue — your workspace administrator can adjust AI settings, then re-run";
  }

  if (TRANSIENT_FAILURE_CLASSES.has(failureKey)) {
    return "transient issue — wait briefly, then re-run";
  }

  if (failureKey === "qualityGate") {
    return "enrich evidence and re-run";
  }

  return "";
}

function resolveLikelyCauseFromArgs(args: {
  readonly failureClass?: string | null;
  readonly reasonCode?: string | null;
  readonly completedStages?: number;
}): string | null {
  const failureClass = (args.failureClass ?? "").trim();
  const reasonCode = (args.reasonCode ?? "").trim();
  const completedStages = args.completedStages ?? 0;

  if (reasonCode === "NoScheduledAgentTasks") {
    return "Execute ran before any agent tasks were scheduled — typical deferred scheduling miss. Re-run should resume the queued work on current builds.";
  }

  if (reasonCode === "MissingArchitectureRequest") {
    return "Re-run could not load the architecture request needed to resume — data repair or support may be required.";
  }

  if (reasonCode === "ExecuteOwnershipLeaseExpired") {
    return "The execute worker lost its ownership lease before finishing. Reopen this review or retry execute; persisted agent results are kept and retry skips them, but unpersisted in-flight LLM spend may rebill.";
  }

  if (failureClass === "invalidOperation" && completedStages === 0) {
    return "Pre-stage invalid operation — processing stopped before assessments began. Often the same deferred scheduling miss when reason codes are absent on older failure records.";
  }

  if (failureClass === "pipelineDeadLetter") {
    return "Work dead-lettered after repeated failures — inspect worker health and outbox depth.";
  }

  return null;
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
  readonly reasonCode?: string | null;
  readonly hasRecoverySteps?: boolean;
}): LastFailureCardCopy {
  const axis = resolveExecutionVsQualityAxis(args);
  const failureClassLabel = plainLanguageFailureClassLabel(args.failureClass);
  const triageTitle = plainLanguageTriageTitle(args.triageScenarioId);
  const rejectCategoryLabel = plainLanguageRejectCategoryLabel(args.rejectReasonCategory);
  const reasonCode = (args.reasonCode ?? "").trim();
  const deferredPipeline =
    reasonCode === "NoScheduledAgentTasks" || reasonCode === "MissingArchitectureRequest";
  const hasRecoverySteps = args.hasRecoverySteps === true;

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
    title: "Failure details",
    failureClassLabel,
    remediation: deferredPipeline
      ? hasRecoverySteps
        ? "Processing stopped before assessments were scheduled. Follow Do this next above, then re-run the review."
        : "Processing stopped before assessments were scheduled. Use Do this next above, then re-run the review."
      : hasRecoverySteps
        ? "Follow Do this next above, then inspect agent traces below if you need technical detail."
        : "Use Do this next above, then inspect agent traces below if you need technical detail.",
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
