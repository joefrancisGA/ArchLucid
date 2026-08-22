import { describe, expect, it } from "vitest";

import {
  inferUniversalIntakeAnswersFromCorpus,
  mergeInferredUniversalIntakeAnswers,
  UNIVERSAL_INTAKE_INFERENCE_MIN_CORPUS_CHARS,
} from "@/lib/universal-intake-answer-inference";

const SAMPLE_BRIEF =
  "Customer-facing API on Microsoft Azure with private endpoints, Entra ID authentication, and PCI-DSS scope for cardholder data. " +
  "Operations expects on-call paging, centralized monitoring, and incident runbooks. " +
  "Target 99.9% uptime with RPO 15 minutes and RTO 4 hours. " +
  "Budget is about $25,000 per month. " +
  "Peak load is 2,000 concurrent users with p95 latency under 300 ms. " +
  "Partner integrations and service accounts also call the API.";

describe("inferUniversalIntakeAnswersFromCorpus", () => {
  it("returns no answers when the corpus is too short", () => {
    expect(inferUniversalIntakeAnswersFromCorpus("short brief")).toEqual({});
    expect(SAMPLE_BRIEF.length).toBeGreaterThan(UNIVERSAL_INTAKE_INFERENCE_MIN_CORPUS_CHARS);
  });

  it("infers multiple L0 answers from a rich architecture brief", () => {
    const inferred = inferUniversalIntakeAnswersFromCorpus(SAMPLE_BRIEF);

    expect(inferred["l0.pillar.cloud-target"]).toBe("Azure");
    expect(inferred["l0.pillar.security"]).toMatch(/PCI-DSS/i);
    expect(inferred["l0.pillar.reliability"]).toMatch(/RPO 15 minutes/i);
    expect(inferred["l0.pillar.cost"]).toMatch(/\$25,000/i);
    expect(inferred["l0.pillar.operations"]).toMatch(/on-call|monitoring|runbook/i);
    expect(inferred["l0.pillar.performance"]).toMatch(/concurrent users|latency/i);
    expect(inferred["l0.actor.additional-kinds"]).toMatch(/service accounts|Partner integrations/i);
  });
});

describe("mergeInferredUniversalIntakeAnswers", () => {
  it("fills only empty answers and respects locked question keys", () => {
    const inferred = inferUniversalIntakeAnswersFromCorpus(SAMPLE_BRIEF);
    const merged = mergeInferredUniversalIntakeAnswers({
      currentAnswers: {
        "l0.pillar.security": "Custom security answer",
      },
      inferredAnswers: inferred,
      lockedQuestionKeys: new Set(["l0.pillar.cloud-target"]),
    });

    expect(merged.mergedAnswers["l0.pillar.security"]).toBe("Custom security answer");
    expect(merged.mergedAnswers["l0.pillar.cloud-target"]).toBeUndefined();
    expect(merged.mergedAnswers["l0.pillar.reliability"]).toMatch(/RPO 15 minutes/i);
    expect(merged.newlyInferredQuestionKeys).not.toContain("l0.pillar.security");
    expect(merged.newlyInferredQuestionKeys).not.toContain("l0.pillar.cloud-target");
  });
});
