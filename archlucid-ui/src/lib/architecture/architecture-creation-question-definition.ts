import type { DraftElicitationQuestion } from "@/types/draft-intake";

/**
 * Versioned L0 architecture-discovery questions mirrored from `UniversalIntakeQuestions.cs`.
 * Loaded synchronously — no model or review-service call required for initial page entry.
 */
export const ARCHITECTURE_CREATION_QUESTION_DEFINITION_VERSION = "l0-universal-v1" as const;

/** L0 MUST question key — answers are exact CloudProvider enum names. */
export const CLOUD_TARGET_QUESTION_KEY = "l0.pillar.cloud-target" as const;

export const ARCHITECTURE_CREATION_DISCOVERY_TOPICS = [
  "Business goal and intended users",
  "Scope and functional requirements",
  "Reliability, availability, and recovery",
  "Security, data sensitivity, and trust boundaries",
  "Cost constraints and operational ownership",
  "Performance and scale expectations",
  "Cloud or deployment target",
] as const;

export const ARCHITECTURE_CREATION_UNIVERSAL_QUESTIONS: readonly DraftElicitationQuestion[] = [
  {
    questionKey: "l0.actor.additional-kinds",
    prompt:
      "Are there other kinds of users (human or machine) that interact with this system besides those already identified?",
    tier: "Must",
    answerKind: "Text",
    source: "L0Universal",
    ruleKeys: [],
  },
  {
    questionKey: "l0.pillar.reliability",
    prompt:
      "What availability or recovery expectations does this system need (RTO/RPO, uptime target, or best effort)?",
    tier: "Must",
    answerKind: "Text",
    source: "L0Universal",
    ruleKeys: [],
  },
  {
    questionKey: "l0.pillar.security",
    prompt:
      "What data sensitivity, regulatory scope, or trust boundaries apply (for example PII, PHI, PCI, or internal-only)?",
    tier: "Must",
    answerKind: "Text",
    source: "L0Universal",
    ruleKeys: [],
  },
  {
    questionKey: "l0.pillar.cost",
    prompt: "What cost constraints or budgets should the architecture respect?",
    tier: "Must",
    answerKind: "Text",
    source: "L0Universal",
    ruleKeys: [],
  },
  {
    questionKey: "l0.pillar.operations",
    prompt: "Who operates this system day-to-day and what observability or incident response is expected?",
    tier: "Must",
    answerKind: "Text",
    source: "L0Universal",
    ruleKeys: [],
  },
  {
    questionKey: "l0.pillar.performance",
    prompt: "What performance or scale expectations matter (users, throughput, latency)?",
    tier: "Must",
    answerKind: "Text",
    source: "L0Universal",
    ruleKeys: [],
  },
  {
    questionKey: CLOUD_TARGET_QUESTION_KEY,
    prompt: "Which cloud provider is this architecture targeting — or is it intentionally cloud-neutral?",
    tier: "Must",
    answerKind: "Enum",
    source: "L0Universal",
    ruleKeys: [],
  },
] as const;

export function buildArchitectureCreationQuestionSelection(): {
  readonly allQuestions: readonly DraftElicitationQuestion[];
  readonly requiredMustQuestionKeys: readonly string[];
  readonly pendingMustQuestions: readonly DraftElicitationQuestion[];
} {
  const requiredMustQuestionKeys = ARCHITECTURE_CREATION_UNIVERSAL_QUESTIONS.map((question) => question.questionKey);

  return {
    allQuestions: ARCHITECTURE_CREATION_UNIVERSAL_QUESTIONS,
    requiredMustQuestionKeys,
    pendingMustQuestions: ARCHITECTURE_CREATION_UNIVERSAL_QUESTIONS,
  };
}
