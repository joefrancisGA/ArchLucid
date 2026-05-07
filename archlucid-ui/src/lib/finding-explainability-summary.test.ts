import { describe, expect, it } from "vitest";

import {
  findingEvidenceCountPlainLine,
  findingSeverityAudienceCopy,
  findingTraceCompletenessPlainEnglish,
} from "./finding-explainability-summary";

describe("finding-explainability-summary", () => {
  it("maps common severities to inspect-first posture", () => {
    expect(findingSeverityAudienceCopy("Critical").meaningForOperators.length).toBeGreaterThan(20);
    expect(findingSeverityAudienceCopy("High").suggestedNext.length).toBeGreaterThan(20);
    expect(findingSeverityAudienceCopy("Medium").meaningForOperators).toContain("planning");
    expect(findingSeverityAudienceCopy("Low").meaningForOperators).toContain("urgency");

    expect(findingSeverityAudienceCopy("CustomSeverity").meaningForOperators).toContain("CustomSeverity");
  });

  it("converts completeness ratios into operator-facing guardrails", () => {
    expect(findingTraceCompletenessPlainEnglish(95)).toContain("strong");
    expect(findingTraceCompletenessPlainEnglish(72)).toContain("mixed");
    expect(findingTraceCompletenessPlainEnglish(42)).toContain("thin");
    expect(findingTraceCompletenessPlainEnglish(15)).toContain("minimal");
    expect(findingTraceCompletenessPlainEnglish(NaN)).toContain("unavailable");
  });

  it("summarizes evidence ref counts deterministically", () => {
    expect(findingEvidenceCountPlainLine(undefined)).toContain("No structured");
    expect(findingEvidenceCountPlainLine([])).toContain("No structured");
    expect(findingEvidenceCountPlainLine(["a"])).toContain("1 structured");
    expect(findingEvidenceCountPlainLine(["a", "b"])).toContain("2 structured");
  });
});
