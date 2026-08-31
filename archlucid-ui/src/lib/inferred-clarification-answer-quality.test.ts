import { describe, expect, it } from "vitest";

import {
  isInternalClarificationRephrasePayload,
  isReadableInferredClarificationAnswer,
  normalizeClarificationInferenceCorpus,
} from "@/lib/inferred-clarification-answer-quality";

const SCREENSHOT_ACTOR_DUMP =
  "Actors Actor How they touch the system Operators / architects Browser — Architect workspace (Next.js) Sponsors / evaluators Same UI; sponsor-oriented views and packages CLI / CI automation HTTPS — API (API key or JWT), optionally via Front Door / APIM Diagram — system overview ArchLucid system overview Diagram —";

const HUMAN_ACTOR_ANSWER =
  "Yes. Operators and architects use the Architect workspace in the browser (Next.js). Sponsors and evaluators use the same UI for sponsor-oriented views and packages. CLI and CI automation call the API over HTTPS (API key or JWT), optionally via Front Door / APIM.";

describe("normalizeClarificationInferenceCorpus", () => {
  it("preserves newlines between table rows", () => {
    const normalized = normalizeClarificationInferenceCorpus("Actors\nOperators / architects\nBrowser — workspace");

    expect(normalized).toContain("\n");
    expect(normalized).not.toMatch(/Actors Operators/);
  });
});

describe("isReadableInferredClarificationAnswer", () => {
  it("rejects the screenshot actor table dump", () => {
    expect(isReadableInferredClarificationAnswer(SCREENSHOT_ACTOR_DUMP)).toBe(false);
  });

  it("accepts a human yes/no actor answer", () => {
    expect(isReadableInferredClarificationAnswer(HUMAN_ACTOR_ANSWER)).toBe(true);
  });

  it("accepts prose and constraint-style pillar snippets", () => {
    expect(isReadableInferredClarificationAnswer("PCI-DSS scope for cardholder data.")).toBe(true);
    expect(isReadableInferredClarificationAnswer("Partner integrations and service accounts also call the API.")).toBe(
      true,
    );
    expect(isReadableInferredClarificationAnswer("RPO 15 minutes; RTO 4 hours")).toBe(true);
    expect(isReadableInferredClarificationAnswer("Azure")).toBe(true);
  });

  it("rejects internal Evidence excerpt rephrase payloads", () => {
    const payload =
      "Evidence excerpt (answer only from this text):\nSystem name: ArchLucid\nBusiness outcome: Additional actor kinds.";

    expect(isInternalClarificationRephrasePayload(payload)).toBe(true);
    expect(isReadableInferredClarificationAnswer(payload)).toBe(false);
  });
});
