import { describe, expect, it } from "vitest";

import {
  findingConfidenceExplanation,
  findingEvidenceCountPlainLine,
  findingRationalePreview,
  findingSeverityAudienceCopy,
  findingTraceCompletenessPlainEnglish,
  stripFindingNarrativePreamble,
} from "@/lib/findings/finding-explainability-summary";

describe("finding-explainability-summary", () => {
  it("maps common severities to inspect-first posture", () => {
    expect(findingSeverityAudienceCopy("Critical").meaningForOperators.length).toBeGreaterThan(20);
    expect(findingSeverityAudienceCopy("High").suggestedNext.length).toBeGreaterThan(20);
    expect(findingSeverityAudienceCopy("Medium").meaningForOperators).toContain("planning");
    expect(findingSeverityAudienceCopy("Low").meaningForOperators).toContain("urgency");
    expect(findingSeverityAudienceCopy("Informational").meaningForOperators).toContain("urgency");

    expect(findingSeverityAudienceCopy("CustomSeverity").meaningForOperators).toContain("CustomSeverity");
    expect(findingSeverityAudienceCopy("CustomSeverity").suggestedNext.length).toBeGreaterThan(20);
  });

  it("converts completeness ratios into plain-language guardrails", () => {
    expect(findingTraceCompletenessPlainEnglish(95)).toContain("Strong");
    expect(findingTraceCompletenessPlainEnglish(72)).toContain("Moderate");
    expect(findingTraceCompletenessPlainEnglish(42)).toContain("Thin");
    expect(findingTraceCompletenessPlainEnglish(15)).toContain("Minimal");
    expect(findingTraceCompletenessPlainEnglish(NaN)).toContain("Unavailable");
  });

  it("summarizes evidence ref counts deterministically", () => {
    expect(findingEvidenceCountPlainLine(undefined)).toContain("No structured");
    expect(findingEvidenceCountPlainLine(null)).toContain("No structured");
    expect(findingEvidenceCountPlainLine([])).toContain("No structured");
    expect(findingEvidenceCountPlainLine(["a"])).toContain("1 structured");
    expect(findingEvidenceCountPlainLine(["a", "b"])).toContain("2 structured");
  });

  describe("stripFindingNarrativePreamble", () => {
    it("removes the machine-generated finding id preamble", () => {
      expect(stripFindingNarrativePreamble("Finding f-1: Requirement detected.", "f-1")).toBe(
        "Requirement detected.",
      );
    });

    it("matches the preamble case-insensitively and tolerates dash separators", () => {
      expect(stripFindingNarrativePreamble("FINDING F-1 — Requirement detected.", "f-1")).toBe(
        "Requirement detected.",
      );
    });

    it("leaves narratives without the preamble untouched", () => {
      expect(stripFindingNarrativePreamble("  Requirement detected.  ", "f-1")).toBe("Requirement detected.");
      expect(stripFindingNarrativePreamble("Finding f-2: other.", "f-1")).toBe("Finding f-2: other.");
    });

    it("returns the trimmed narrative when no finding id is supplied", () => {
      expect(stripFindingNarrativePreamble(" Requirement detected. ", "  ")).toBe("Requirement detected.");
    });
  });

  describe("findingRationalePreview", () => {
    it("suppresses a narrative that only restates the title", () => {
      const preview = findingRationalePreview({
        narrativeText: "Finding f-1: Requirement detected.",
        conclusion: "",
        title: "Requirement detected",
        findingId: "f-1",
      });

      expect(preview).toBeNull();
    });

    it("keeps the part of the narrative that adds information", () => {
      const preview = findingRationalePreview({
        narrativeText: "Finding f-1: Requirement detected. It affects tenant isolation.",
        conclusion: "",
        title: "Requirement detected",
        findingId: "f-1",
      });

      expect(preview).toBe("It affects tenant isolation.");
    });

    it("falls back to the structured conclusion when no narrative was persisted", () => {
      const preview = findingRationalePreview({
        narrativeText: "   ",
        conclusion: "Policy breach on node n1.",
        title: "Requirement detected",
        findingId: "f-1",
      });

      expect(preview).toBe("Policy breach on node n1.");
    });

    it("returns the source unchanged when there is no title to compare against", () => {
      const preview = findingRationalePreview({
        narrativeText: "Requirement detected.",
        conclusion: "",
        title: "   ",
        findingId: "f-1",
      });

      expect(preview).toBe("Requirement detected.");
    });

    it("returns null when neither narrative nor conclusion carries text", () => {
      const preview = findingRationalePreview({
        narrativeText: "",
        conclusion: "",
        title: "Requirement detected",
        findingId: "f-1",
      });

      expect(preview).toBeNull();
    });
  });

  describe("findingConfidenceExplanation", () => {
    it("explains why a low bucket is low instead of only labelling it", () => {
      const explanation = findingConfidenceExplanation({
        level: "Low",
        evidenceRefCount: 1,
        missingTraceFieldCount: 2,
      });

      expect(explanation.label).toBe("Low");
      expect(explanation.reason).toContain("only one supporting source was identified");
      expect(explanation.reason).toContain("2 parts of the reasoning trace were left empty");
    });

    it("reports strong corroboration when evidence is plural and the trace is complete", () => {
      const explanation = findingConfidenceExplanation({
        level: "High",
        evidenceRefCount: 4,
        missingTraceFieldCount: 0,
      });

      expect(explanation.label).toBe("High");
      expect(explanation.reason).toContain("4 supporting sources were identified");
      expect(explanation.reason).toContain("every part of the reasoning trace was captured");
    });

    it("covers partial corroboration and the single-missing-dimension wording", () => {
      const explanation = findingConfidenceExplanation({
        level: "Medium",
        evidenceRefCount: 0,
        missingTraceFieldCount: 1,
      });

      expect(explanation.label).toBe("Medium");
      expect(explanation.reason).toContain("partly corroborated");
      expect(explanation.reason).toContain("no supporting source was recorded");
      expect(explanation.reason).toContain("one part of the reasoning trace was left empty");
    });

    it("states plainly when confidence was never scored", () => {
      const explanation = findingConfidenceExplanation({
        level: null,
        evidenceRefCount: 1,
        missingTraceFieldCount: 0,
      });

      expect(explanation.label).toBeNull();
      expect(explanation.reason).toContain("did not score confidence");
    });

    it("treats unrecognized levels as unscored", () => {
      expect(
        findingConfidenceExplanation({ level: "Unknown", evidenceRefCount: 0, missingTraceFieldCount: 0 }).label,
      ).toBeNull();
      expect(
        findingConfidenceExplanation({ level: undefined, evidenceRefCount: 0, missingTraceFieldCount: 0 }).label,
      ).toBeNull();
    });
  });
});
