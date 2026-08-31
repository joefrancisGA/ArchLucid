import { describe, expect, it } from "vitest";

import {
  buildClarificationRephraseItems,
  buildClarificationRephraseItemsForEmptyKeys,
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

const SPARSE_ARCHLUCID_BRIEF = [
  "System name: ArchLucid",
  "Business outcome: Additional actor kinds: Azure OpenAI, Service Bus, and Blob are optional for live models, integration fan-out, and large artifacts.",
].join("\n\n");

describe("buildClarificationRephraseItemsForEmptyKeys", () => {
  it("does not attach the full brief blob to every empty clarification", () => {
    const inferred = inferUniversalIntakeAnswersFromCorpus(SPARSE_ARCHLUCID_BRIEF);
    const items = buildClarificationRephraseItemsForEmptyKeys({
      corpus: SPARSE_ARCHLUCID_BRIEF,
      inferredAnswers: inferred,
      questions: ARCHITECTURE_CREATION_UNIVERSAL_QUESTIONS,
      currentAnswers: {},
      lockedQuestionKeys: new Set(),
    });

    expect(items).toHaveLength(0);
  });

  it("uses question-specific snippets instead of the Evidence excerpt wrapper", () => {
    const inferred = inferUniversalIntakeAnswersFromCorpus(SAMPLE_BRIEF);
    const partialInferred = { ...inferred };
    delete partialInferred["l0.pillar.cost"];
    delete partialInferred["l0.pillar.performance"];

    const items = buildClarificationRephraseItemsForEmptyKeys({
      corpus: SAMPLE_BRIEF,
      inferredAnswers: partialInferred,
      questions: ARCHITECTURE_CREATION_UNIVERSAL_QUESTIONS,
      currentAnswers: {},
      lockedQuestionKeys: new Set(),
    });

    expect(items.length).toBeGreaterThan(0);
    expect(items.every((item) => !item.extractedAnswer.startsWith("Evidence excerpt"))).toBe(true);
    expect(new Set(items.map((item) => item.extractedAnswer)).size).toBeGreaterThan(1);
  });
});

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

    expect(merged.mergedAnswers["l0.actor.additional-kinds"]).toBe(
      "Yes — partner integrations and service accounts also call the API.",
    );
    expect(merged.mergedAnswers["l0.pillar.cloud-target"]).toBe("Azure");
    expect(merged.rephrasedQuestionKeys).toContain("l0.actor.additional-kinds");
  });

  it("does not reinstate a dump when rephrase omits the key", () => {
    const dump =
      "Actors Actor How they touch the system Operators / architects Browser — workspace Diagram —";

    const merged = mergeRephrasedClarificationAnswers({
      currentAnswers: {},
      inferredAnswers: {
        "l0.actor.additional-kinds": dump,
      },
      rephrasedAnswers: {},
      lockedQuestionKeys: new Set(),
    });

    expect(merged.mergedAnswers["l0.actor.additional-kinds"]).toBeUndefined();
  });
});
