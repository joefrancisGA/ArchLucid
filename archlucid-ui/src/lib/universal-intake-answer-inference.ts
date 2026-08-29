import { CLOUD_TARGET_QUESTION_KEY } from "@/lib/architecture/architecture-creation-question-definition";
import {
  filterQualityGatedInferredAnswers,
  isReadableInferredClarificationAnswer,
  normalizeClarificationInferenceCorpus,
} from "@/lib/inferred-clarification-answer-quality";
import { deriveStatedConstraintContextFromTexts } from "@/lib/review-quality/stated-constraint-context";
import { synthesizeAdditionalActorsAnswer } from "@/lib/universal-intake-actor-synthesis";
import {
  isHeadingOnlyChunk,
  splitInferenceChunks,
  truncateAtWordBoundary,
} from "@/lib/universal-intake-inference-chunks";
import { UNIVERSAL_INTAKE_MUST_QUESTION_KEYS } from "@/lib/universal-intake-must-completeness";

export const UNIVERSAL_INTAKE_INFERENCE_MIN_CORPUS_CHARS = 40;

export const UNIVERSAL_INTAKE_INFERRED_CLARIFICATION_HELPER =
  "Suggested from your architecture context and rewritten in plain language — review each answer before you continue.";

export const UNIVERSAL_INTAKE_INFERRED_CLARIFICATION_SYNTHESIS_HELPER =
  "Suggested from your evidence — review each answer before you continue.";

export const UNIVERSAL_INTAKE_CLARIFICATION_SUGGESTIONS_UNAVAILABLE_HELPER =
  "We could not suggest clarification answers from your document text. Answer each question in your own words.";

export const UNIVERSAL_INTAKE_CLARIFICATION_SUGGESTIONS_REQUIRE_REAL_LLM_HELPER =
  "Clarification answer suggestions from uploaded documents require Real agent execution with Azure OpenAI connected. Answer each required clarification manually while Simulator mode is active.";

export const UNIVERSAL_INTAKE_SUGGEST_FROM_EVIDENCE_LABEL = "Suggest answers from evidence";

export const UNIVERSAL_INTAKE_SUGGEST_FROM_EVIDENCE_HELPER =
  "Reads attached PDF or DOCX files and your architecture context to fill empty clarifications. Review each suggestion before you continue.";

export function canSuggestUniversalIntakeAnswersFromEvidence(input: {
  readonly briefText: string;
  readonly evidenceFiles: readonly File[];
}): boolean {
  return (
    input.evidenceFiles.length > 0
    || input.briefText.trim().length >= UNIVERSAL_INTAKE_INFERENCE_MIN_CORPUS_CHARS
  );
}

const QUESTION_KEY = {
  additionalActors: "l0.actor.additional-kinds",
  reliability: "l0.pillar.reliability",
  security: "l0.pillar.security",
  cost: "l0.pillar.cost",
  operations: "l0.pillar.operations",
  performance: "l0.pillar.performance",
  sustainability: "l0.pillar.sustainability",
  cloudTarget: CLOUD_TARGET_QUESTION_KEY,
} as const;

function findChunkMatching(corpus: string, patterns: readonly RegExp[]): string | null {
  for (const chunk of splitInferenceChunks(corpus)) {
    if (isHeadingOnlyChunk(chunk)) {
      continue;
    }

    if (patterns.some((pattern) => pattern.test(chunk))) {
      return truncateAtWordBoundary(chunk);
    }
  }

  return null;
}

function findProseAfterHeading(corpus: string, headingPattern: RegExp): string | null {
  const lines = corpus.split(/\r?\n/).map((line) => line.trim()).filter((line) => line.length > 0);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";

    if (!headingPattern.test(line)) {
      continue;
    }

    for (let nextIndex = index + 1; nextIndex < lines.length; nextIndex += 1) {
      const candidate = lines[nextIndex] ?? "";

      if (isHeadingOnlyChunk(candidate) || isDiagramCaptionLine(candidate)) {
        continue;
      }

      if (candidate.length > 0) {
        return truncateAtWordBoundary(candidate);
      }
    }
  }

  return null;
}

function isDiagramCaptionLine(line: string): boolean {
  return /^Diagram\s*[—\-]/i.test(line.trim()) || /\bDiagram\s*[—\-]/i.test(line);
}

function formatMinutesLabel(minutes: number): string {
  if (minutes % 60 === 0 && minutes >= 60) {
    const hours = minutes / 60;

    return `${hours} hour${hours === 1 ? "" : "s"}`;
  }

  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}

function inferReliabilityAnswer(corpus: string): string | null {
  const stated = deriveStatedConstraintContextFromTexts([corpus]);
  const parts: string[] = [];

  if (stated.rtoMinutes !== null) {
    parts.push(`RTO ${formatMinutesLabel(stated.rtoMinutes)}`);
  }

  if (stated.rpoMinutes !== null) {
    parts.push(`RPO ${formatMinutesLabel(stated.rpoMinutes)}`);
  }

  const uptimeMatch = /\b99(?:\.\d+)?%\s*(?:uptime|availability)\b/i.exec(corpus);

  if (uptimeMatch !== null) {
    parts.push(uptimeMatch[0]);
  }

  if (parts.length > 0) {
    return parts.join("; ");
  }

  const explicitRecovery = findChunkMatching(corpus, [
    /record actual RTO/i,
    /\bRTO\b/i,
    /\bRPO\b/i,
  ]);

  if (explicitRecovery !== null) {
    return explicitRecovery;
  }

  return findChunkMatching(corpus, [
    /\b(?:uptime|availability|recovery|disaster recovery|high availability|geo failover|failover group|paired region|zone redundant)\b/i,
  ]);
}

function inferSecurityAnswer(corpus: string): string | null {
  return findChunkMatching(corpus, [
    /\b(?:PII|PHI|PCI(?:-DSS)?|HIPAA|GDPR|SOC\s*2|FedRAMP|trust boundary|trust edge|data sensitivity|regulated|confidential)\b/i,
    /\b(?:Entra(?:\s+ID)?|managed identity|private endpoint|Key Vault)\b/i,
  ]);
}

function inferCostAnswer(corpus: string): string | null {
  const stated = deriveStatedConstraintContextFromTexts([corpus]);

  if (stated.monthlyCostCeilingUsd !== null) {
    return `Monthly cost ceiling about $${stated.monthlyCostCeilingUsd.toLocaleString("en-US")}.`;
  }

  const proseAfterFinOps = findProseAfterHeading(corpus, /^FinOps and capacity drivers$/i);

  if (proseAfterFinOps !== null) {
    return proseAfterFinOps;
  }

  return findChunkMatching(corpus, [
    /\b(?:budget|cost constraint|cost ceiling|finops|monthly spend|operating cost|capacity drivers|budget gate|spend kill)\b/i,
    /\$\s*[\d,]+(?:\.\d+)?\s*(?:\/\s*month|per month|monthly)\b/i,
  ]);
}

function inferOperationsAnswer(corpus: string): string | null {
  const observabilityProse = findProseAfterHeading(corpus, /^Observability map$/i);

  if (observabilityProse !== null) {
    return observabilityProse;
  }

  return findChunkMatching(corpus, [
    /\b(?:on[- ]call|observability|monitoring|incident response|runbook|SRE|DevOps|day[- ]to[- ]day operations|OpenTelemetry|OTel|Application Insights)\b/i,
  ]);
}

function inferPerformanceAnswer(corpus: string): string | null {
  return findChunkMatching(corpus, [
    /\b(?:latency|throughput|transactions per second|TPS|QPS|concurrent users|requests per second|autoscale|capacity)\b/i,
  ]);
}

function inferSustainabilityAnswer(corpus: string): string | null {
  const hasEfficiencyLanguage = /\b(?:sustainability|utilization|idle capacity|retention|carbon|energy efficiency)\b/i.test(
    corpus,
  );

  if (hasEfficiencyLanguage) {
    return findChunkMatching(corpus, [
      /\b(?:sustainability|utilization|idle capacity|retention|carbon|energy efficiency)\b/i,
    ]);
  }

  const explicitNone = /\b(?:no sustainability|none for this lifecycle|not a sustainability focus)\b/i.test(corpus);

  if (explicitNone) {
    return "None for this lifecycle stage.";
  }

  return null;
}

function inferAdditionalActorsAnswer(corpus: string): string | null {
  return synthesizeAdditionalActorsAnswer(corpus);
}

function inferCloudTargetAnswer(corpus: string): string | null {
  const lower = corpus.toLowerCase();

  if (/\b(?:cloud[- ]neutral|cloud[- ]agnostic|provider[- ]agnostic|multi[- ]cloud)\b/.test(lower)) {
    return "None";
  }

  const scores = {
    Azure: 0,
    Aws: 0,
    Gcp: 0,
  };

  if (/\bazure-first\b/.test(lower)) {
    scores.Azure += 2;
  }

  if (/\bmicrosoft azure\b/.test(lower) || /\bazure\b/.test(lower)) {
    scores.Azure += 1;
  }

  if (/\bfront door\b/.test(lower) || /\bapim\b/.test(lower) || /\bazure sql\b/.test(lower)) {
    scores.Azure += 1;
  }

  if (/\bamazon web services\b/.test(lower) || /\baws\b/.test(lower)) {
    scores.Aws += 1;
  }

  if (/\bgoogle cloud\b/.test(lower) || /\bgcp\b/.test(lower)) {
    scores.Gcp += 1;
  }

  const ranked = Object.entries(scores)
    .filter(([, score]) => score > 0)
    .sort((left, right) => right[1] - left[1]);

  if (ranked.length === 0) {
    return null;
  }

  if (ranked.length > 1 && ranked[0]?.[1] === ranked[1]?.[1]) {
    return null;
  }

  return ranked[0]?.[0] ?? null;
}

const INFERENCE_BY_QUESTION_KEY: Record<string, (corpus: string) => string | null> = {
  [QUESTION_KEY.additionalActors]: inferAdditionalActorsAnswer,
  [QUESTION_KEY.reliability]: inferReliabilityAnswer,
  [QUESTION_KEY.security]: inferSecurityAnswer,
  [QUESTION_KEY.cost]: inferCostAnswer,
  [QUESTION_KEY.operations]: inferOperationsAnswer,
  [QUESTION_KEY.performance]: inferPerformanceAnswer,
  [QUESTION_KEY.sustainability]: inferSustainabilityAnswer,
  [QUESTION_KEY.cloudTarget]: inferCloudTargetAnswer,
};

/** Deterministic, buyer-safe extraction from brief/evidence text — never invents facts beyond the corpus. */
export function inferUniversalIntakeAnswersFromCorpus(corpus: string): Readonly<Record<string, string>> {
  const normalized = normalizeClarificationInferenceCorpus(corpus);

  if (normalized.length < UNIVERSAL_INTAKE_INFERENCE_MIN_CORPUS_CHARS) {
    return {};
  }

  const inferred: Record<string, string> = {};

  for (const questionKey of UNIVERSAL_INTAKE_MUST_QUESTION_KEYS) {
    const inferAnswer = INFERENCE_BY_QUESTION_KEY[questionKey];

    if (inferAnswer === undefined) {
      continue;
    }

    const answer = inferAnswer(normalized)?.trim() ?? "";

    if (answer.length > 0 && isReadableInferredClarificationAnswer(answer)) {
      inferred[questionKey] = answer;
    }
  }

  return filterQualityGatedInferredAnswers(inferred);
}

export function mergeInferredUniversalIntakeAnswers(input: {
  readonly currentAnswers: Readonly<Record<string, string>>;
  readonly inferredAnswers: Readonly<Record<string, string>>;
  readonly lockedQuestionKeys: ReadonlySet<string>;
}): {
  readonly mergedAnswers: Readonly<Record<string, string>>;
  readonly newlyInferredQuestionKeys: readonly string[];
} {
  const gatedInferred = filterQualityGatedInferredAnswers(input.inferredAnswers);
  const mergedAnswers: Record<string, string> = { ...input.currentAnswers };
  const newlyInferredQuestionKeys: string[] = [];

  for (const [questionKey, inferredAnswer] of Object.entries(gatedInferred)) {
    if (input.lockedQuestionKeys.has(questionKey)) {
      continue;
    }

    const existingAnswer = input.currentAnswers[questionKey]?.trim() ?? "";

    if (existingAnswer.length > 0) {
      continue;
    }

    mergedAnswers[questionKey] = inferredAnswer;
    newlyInferredQuestionKeys.push(questionKey);
  }

  return {
    mergedAnswers,
    newlyInferredQuestionKeys,
  };
}

export { filterQualityGatedInferredAnswers, isReadableInferredClarificationAnswer };
