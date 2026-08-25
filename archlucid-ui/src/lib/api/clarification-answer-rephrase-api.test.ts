import { describe, expect, it } from "vitest";

import {
  buildClarificationRephraseItems,
  mergeRephrasedClarificationAnswers,
} from "@/lib/api/clarification-answer-rephrase-api";
import { ARCHITECTURE_CREATION_UNIVERSAL_QUESTIONS } from "@/lib/architecture/architecture-creation-question-definition";
import { inferUniversalIntakeAnswersFromCorpus } from "@/lib/universal-intake-answer-inference";

const SAMPLE_BRIEF =
  "Customer-facing API on Microsoft Azure with private endpoints, Entra ID authentication, and PCI-DSS scope for cardholder data. " +
  "Operations expects on-call paging, centralized monitoring, and incident runbooks. " +
  "Target 99.9% uptime with RPO 15 minutes and RTO 4 hours. " +
  "Budget is about $25,000 per month. " +
  "Peak load is 2,000 concurrent users with p95 latency under 300 ms. " +
  "Partner integrations and service accounts also call the API.";

describe("buildClarificationRephraseItems", () => {
  it("skips cloud-target enum answers and empty values", () => {
    const inferred = inferUniversalIntakeAnswersFromCorpus(SAMPLE_BRIEF);
    const items = buildClarificationRephraseItems({
      inferredAnswers: inferred,
      questions: ARCHITECTURE_CREATION_UNIVERSAL_QUESTIONS,
    });

    expect(items.some((item) => item.questionKey === "l0.pillar.cloud-target")).toBe(false);
    expect(items.some((item) => item.questionKey === "l0.actor.additional-kinds")).toBe(true);
    expect(items.every((item) => item.extractedAnswer.trim().length > 0)).toBe(true);
    expect(items.every((item) => item.questionPrompt.trim().length > 0)).toBe(true);
  });
});

describe("mergeRephrasedClarificationAnswers", () => {
  it("prefers rephrased answers over extracted text for empty fields", () => {
    const inferred = inferUniversalIntakeAnswersFromCorpus(SAMPLE_BRIEF);
    const merged = mergeRephrasedClarificationAnswers({
      currentAnswers: {},
      inferredAnswers: inferred,
      rephrasedAnswers: {
        "l0.actor.additional-kinds":
          "Yes — partner integrations and service accounts also call the API.",
      },
      lockedQuestionKeys: new Set(),
    });

    expect(merged["l0.actor.additional-kinds"]).toBe(
      "Yes — partner integrations and service accounts also call the API.",
    );
    expect(merged["l0.pillar.cloud-target"]).toBe("Azure");
  });
});
