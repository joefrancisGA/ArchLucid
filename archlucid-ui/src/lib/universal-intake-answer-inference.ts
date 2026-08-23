import { CLOUD_TARGET_QUESTION_KEY } from "@/lib/architecture/architecture-creation-question-definition";
import { deriveStatedConstraintContextFromTexts } from "@/lib/review-quality/stated-constraint-context";
import { UNIVERSAL_INTAKE_MUST_QUESTION_KEYS } from "@/lib/universal-intake-must-completeness";

export const UNIVERSAL_INTAKE_INFERENCE_MIN_CORPUS_CHARS = 40;

export const UNIVERSAL_INTAKE_INFERRED_CLARIFICATION_HELPER =
  "Suggested from your architecture context — review each answer before you continue.";

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

function truncateSentence(sentence: string, maxLength = 320): string {
  if (sentence.length <= maxLength) {
    return sentence;
  }

  return `${sentence.slice(0, maxLength - 3)}...`;
}

function findSentenceMatching(corpus: string, patterns: readonly RegExp[]): string | null {
  for (const sentence of splitSentences(corpus)) {
    if (patterns.some((pattern) => pattern.test(sentence))) {
      return truncateSentence(sentence);
    }
  }

  for (const pattern of patterns) {
    const match = pattern.exec(corpus);

    if (match !== null && match[0] !== undefined) {
      const start = Math.max(0, match.index - 80);
      const end = Math.min(corpus.length, match.index + match[0].length + 120);
      const snippet = corpus.slice(start, end).trim();

      if (snippet.length > 0) {
        return truncateSentence(snippet);
      }
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
  const normalized = corpus.replace(/\s+/g, " ").trim();

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

    if (answer.length > 0) {
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
