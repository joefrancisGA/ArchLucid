import { CLOUD_TARGET_QUESTION_KEY } from "@/lib/architecture/architecture-creation-question-definition";
import {
  isReadableInferredClarificationAnswer,
  normalizeClarificationInferenceCorpus,
} from "@/lib/inferred-clarification-answer-quality";
import { deriveStatedConstraintContextFromTexts } from "@/lib/review-quality/stated-constraint-context";
import { UNIVERSAL_INTAKE_MUST_QUESTION_KEYS } from "@/lib/universal-intake-must-completeness";

export const UNIVERSAL_INTAKE_INFERENCE_MIN_CORPUS_CHARS = 40;

export const UNIVERSAL_INTAKE_INFERRED_CLARIFICATION_HELPER =
  "Suggested from your architecture context and rewritten in plain language — review each answer before you continue.";

export const UNIVERSAL_INTAKE_CLARIFICATION_SUGGESTIONS_UNAVAILABLE_HELPER =
  "We could not suggest clarification answers from your document text. Answer each question in your own words.";

export const UNIVERSAL_INTAKE_CLARIFICATION_SUGGESTIONS_REQUIRE_REAL_LLM_HELPER =
  "Clarification answer suggestions from uploaded documents require Real agent execution with Azure OpenAI connected. Answer each required clarification manually while Simulator mode is active.";

const QUESTION_KEY = {
  additionalActors: "l0.actor.additional-kinds",
  reliability: "l0.pillar.reliability",
  security: "l0.pillar.security",
  cost: "l0.pillar.cost",
  operations: "l0.pillar.operations",
  performance: "l0.pillar.performance",
  cloudTarget: CLOUD_TARGET_QUESTION_KEY,
} as const;

function splitSentences(corpus: string): readonly string[] {
  return corpus
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);
}

function truncateSentenceAtWordBoundary(sentence: string, maxLength = 320): string {
  if (sentence.length <= maxLength) {
    return sentence;
  }

  const slice = sentence.slice(0, maxLength);
  const lastSpace = slice.lastIndexOf(" ");

  if (lastSpace > maxLength * 0.6) {
    return slice.slice(0, lastSpace).trimEnd();
  }

  return slice.trimEnd();
}

function findSentenceMatching(corpus: string, patterns: readonly RegExp[]): string | null {
  for (const sentence of splitSentences(corpus)) {
    if (patterns.some((pattern) => pattern.test(sentence))) {
      return truncateSentenceAtWordBoundary(sentence);
    }
  }

  return null;
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

  return findSentenceMatching(corpus, [
    /\b(?:RTO|RPO|uptime|availability|recovery|disaster recovery|high availability)\b/i,
  ]);
}

function inferSecurityAnswer(corpus: string): string | null {
  return findSentenceMatching(corpus, [
    /\b(?:PII|PHI|PCI(?:-DSS)?|HIPAA|GDPR|SOC\s*2|FedRAMP|trust boundary|data sensitivity|regulated|confidential)\b/i,
  ]);
}

function inferCostAnswer(corpus: string): string | null {
  const stated = deriveStatedConstraintContextFromTexts([corpus]);

  if (stated.monthlyCostCeilingUsd !== null) {
    return `Monthly cost ceiling about $${stated.monthlyCostCeilingUsd.toLocaleString("en-US")}.`;
  }

  return findSentenceMatching(corpus, [
    /\b(?:budget|cost constraint|cost ceiling|finops|monthly spend|operating cost)\b/i,
    /\$\s*[\d,]+(?:\.\d+)?\s*(?:\/\s*month|per month|monthly)\b/i,
  ]);
}

function inferOperationsAnswer(corpus: string): string | null {
  return findSentenceMatching(corpus, [
    /\b(?:on[- ]call|observability|monitoring|incident response|runbook|SRE|DevOps|day[- ]to[- ]day operations)\b/i,
  ]);
}

function inferPerformanceAnswer(corpus: string): string | null {
  return findSentenceMatching(corpus, [
    /\b(?:latency|throughput|transactions per second|TPS|QPS|concurrent users|requests per second|scale)\b/i,
  ]);
}

function inferAdditionalActorsAnswer(corpus: string): string | null {
  return findSentenceMatching(corpus, [
    /\b(?:API clients?|service accounts?|machine users?|partner teams?|administrators|operators|batch jobs?|integrations?)\b/i,
    /\b(?:human and machine|users and systems)\b/i,
  ]);
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

  if (/\bmicrosoft azure\b/.test(lower) || /\bazure\b/.test(lower)) {
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

  return inferred;
}

export function mergeInferredUniversalIntakeAnswers(input: {
  readonly currentAnswers: Readonly<Record<string, string>>;
  readonly inferredAnswers: Readonly<Record<string, string>>;
  readonly lockedQuestionKeys: ReadonlySet<string>;
}): {
  readonly mergedAnswers: Readonly<Record<string, string>>;
  readonly newlyInferredQuestionKeys: readonly string[];
} {
  const mergedAnswers: Record<string, string> = { ...input.currentAnswers };
  const newlyInferredQuestionKeys: string[] = [];

  for (const [questionKey, inferredAnswer] of Object.entries(input.inferredAnswers)) {
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
