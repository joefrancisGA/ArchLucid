import { describe, expect, it } from "vitest";

import { isReadableInferredClarificationAnswer } from "@/lib/inferred-clarification-answer-quality";
import { repairUtf8MojibakeOptional } from "@/lib/utf8-mojibake-repair";
import { HANDBOOK_INTAKE_INFERENCE_FIXTURE } from "@/lib/universal-intake-handbook-fixture";
import {
  canSuggestUniversalIntakeAnswersFromEvidence,
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

const SCREENSHOT_ACTOR_DUMP =
  "Actors Actor How they touch the system Operators / architects Browser — Architect workspace (Next.js) Sponsors / evaluators Same UI; sponsor-oriented views and packages CLI / CI automation HTTPS — API (API key or JWT), optionally via Front Door / APIM Diagram — system overview ArchLucid system overview Diagram —";

describe("repairUtf8MojibakeOptional", () => {
  it("repairs common punctuation mojibake", () => {
    expect(repairUtf8MojibakeOptional("Demo â€\u201D Retail baseline manifest.")).toBe(
      "Demo — Retail baseline manifest.",
    );
  });
});

describe("isReadableInferredClarificationAnswer", () => {
  it("rejects truncated ellipsis snippets and mojibake", () => {
    expect(isReadableInferredClarificationAnswer("Readable sentence about PCI-DSS scope.")).toBe(true);
    expect(isReadableInferredClarificationAnswer("Truncated mid thought...")).toBe(false);
    expect(isReadableInferredClarificationAnswer("Demo â€\u201D unreadable mojibake blob")).toBe(false);
    expect(isReadableInferredClarificationAnswer(SCREENSHOT_ACTOR_DUMP)).toBe(false);
  });
});

describe("canSuggestUniversalIntakeAnswersFromEvidence", () => {
  it("requires evidence files or a long enough architecture context", () => {
    expect(
      canSuggestUniversalIntakeAnswersFromEvidence({
        briefText: "short",
        evidenceFiles: [],
      }),
    ).toBe(false);

    expect(
      canSuggestUniversalIntakeAnswersFromEvidence({
        briefText: "x".repeat(UNIVERSAL_INTAKE_INFERENCE_MIN_CORPUS_CHARS),
        evidenceFiles: [],
      }),
    ).toBe(true);

    expect(
      canSuggestUniversalIntakeAnswersFromEvidence({
        briefText: "",
        evidenceFiles: [new File(["diagram"], "network-topology.pdf", { type: "application/pdf" })],
      }),
    ).toBe(true);
  });
});

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

  it("does not prefill the flattened actors table dump", () => {
    const inferred = inferUniversalIntakeAnswersFromCorpus(SCREENSHOT_ACTOR_DUMP);

    expect(inferred["l0.actor.additional-kinds"]).toBeUndefined();
  });

  it("does not treat business-outcome integration prose as additional actors", () => {
    const inferred = inferUniversalIntakeAnswersFromCorpus(
      "System name: ArchLucid\n\nBusiness outcome: Additional actor kinds: Azure OpenAI, Service Bus, and Blob are optional for live models, integration fan-out, and large artifacts.",
    );

    expect(inferred["l0.actor.additional-kinds"]).toBeUndefined();
  });

  it("infers handbook-shaped answers without table dumps", () => {
    const inferred = inferUniversalIntakeAnswersFromCorpus(HANDBOOK_INTAKE_INFERENCE_FIXTURE);
    const actorAnswer = inferred["l0.actor.additional-kinds"] ?? "";

    expect(actorAnswer).toMatch(/^Yes\b/i);
    expect(actorAnswer).toMatch(/operators|architects/i);
    expect(actorAnswer).toMatch(/sponsors|evaluators/i);
    expect(actorAnswer).not.toMatch(/Actors Actor/i);
    expect(actorAnswer).not.toMatch(/Diagram —/i);
    expect(inferred["l0.pillar.cloud-target"]).toBe("Azure");
    expect(inferred["l0.pillar.reliability"]).toMatch(/RTO/i);
    expect(inferred["l0.pillar.security"]).toMatch(/Entra|JWT/i);
    expect(inferred["l0.pillar.cost"]).toMatch(/budget|FinOps/i);
    expect(inferred["l0.pillar.operations"]).toMatch(/observability|monitoring|OpenTelemetry/i);
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
