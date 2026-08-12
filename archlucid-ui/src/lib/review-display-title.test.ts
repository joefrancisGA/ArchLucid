import { describe, expect, it } from "vitest";

import {
  extractGeneratedIntakeBriefTitle,
  isGeneratedIntakeBrief,
  toReviewDisplayTitle,
} from "@/lib/review-display-title";

/** Shape produced by `buildEvidenceBackedIntakeBrief` and stored as the run description. */
const GENERATED_BRIEF = [
  'Architecture review intake for "Claims Intake Modernization".',
  "Evaluate the attached materials for architecture structure, cost, compliance, security, and policy-pack violations.",
  "Treat each upload as architecture evidence unless a more specific category was supplied.",
].join(" ") + "\n\nAttached architecture evidence:\n- HANDBOOK.docx (Architecture evidence)";

/** Briefs written before the sentence separator was fixed run the first two sentences together. */
const LEGACY_UNSPACED_BRIEF =
  'Architecture review intake for "ArchLucid".Evaluate the attached materials for topology, cost, compliance, security, and policy-pack violations.';

describe("isGeneratedIntakeBrief", () => {
  it("recognizes the generated brief", () => {
    expect(isGeneratedIntakeBrief(GENERATED_BRIEF)).toBe(true);
  });

  it("recognizes the legacy brief written without a sentence separator", () => {
    expect(isGeneratedIntakeBrief(LEGACY_UNSPACED_BRIEF)).toBe(true);
  });

  it("does not claim operator-authored text", () => {
    expect(isGeneratedIntakeBrief("We are modernizing the claims intake platform.")).toBe(false);
  });

  it("tolerates null and empty input", () => {
    expect(isGeneratedIntakeBrief(null)).toBe(false);
    expect(isGeneratedIntakeBrief(undefined)).toBe(false);
    expect(isGeneratedIntakeBrief("")).toBe(false);
  });
});

describe("extractGeneratedIntakeBriefTitle", () => {
  it("recovers the operator-entered title", () => {
    expect(extractGeneratedIntakeBriefTitle(GENERATED_BRIEF)).toBe("Claims Intake Modernization");
  });

  it("recovers the title from a legacy unspaced brief", () => {
    expect(extractGeneratedIntakeBriefTitle(LEGACY_UNSPACED_BRIEF)).toBe("ArchLucid");
  });

  it("returns null for text that is not a generated brief", () => {
    expect(extractGeneratedIntakeBriefTitle("Claims intake review")).toBeNull();
  });
});

describe("toReviewDisplayTitle", () => {
  it("returns the quoted title instead of the whole intake prompt", () => {
    expect(toReviewDisplayTitle(GENERATED_BRIEF)).toBe("Claims Intake Modernization");
  });

  it("returns the quoted title for a legacy unspaced brief", () => {
    expect(toReviewDisplayTitle(LEGACY_UNSPACED_BRIEF)).toBe("ArchLucid");
  });

  it("keeps a short operator-authored title unchanged", () => {
    expect(toReviewDisplayTitle("Claims intake modernization")).toBe("Claims intake modernization");
  });

  it("uses only the first line of a multi-line description", () => {
    expect(toReviewDisplayTitle("Payments platform\n\nDetailed background follows.")).toBe("Payments platform");
  });

  it("uses only the first sentence of a long single-line description", () => {
    expect(toReviewDisplayTitle("Payments platform. Detailed background follows.")).toBe("Payments platform.");
  });

  it("clamps a title that exceeds the single-line budget", () => {
    const title = toReviewDisplayTitle("x".repeat(200));

    expect(title).toHaveLength(80);
    expect(title.endsWith("…")).toBe(true);
  });

  it("strips inline markdown syntax from title candidates", () => {
    expect(toReviewDisplayTitle("**Reviewed** 2026-07-26 # Architecture Review Packet")).toBe(
      "Reviewed 2026-07-26 # Architecture Review Packet",
    );
  });

  it("returns an empty string for blank input", () => {
    expect(toReviewDisplayTitle(null)).toBe("");
    expect(toReviewDisplayTitle("   ")).toBe("");
  });
});
