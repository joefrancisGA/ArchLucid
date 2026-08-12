import { describe, expect, it } from "vitest";

import {
  clampReviewWorkspaceH1Title,
  extractGeneratedIntakeBriefTitle,
  isGeneratedIntakeBrief,
  stripInlineMarkdownFromReviewText,
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

  it("returns an empty string for blank input", () => {
    expect(toReviewDisplayTitle(null)).toBe("");
    expect(toReviewDisplayTitle("   ")).toBe("");
  });

  it("strips inline markdown from display titles", () => {
    expect(toReviewDisplayTitle("**Reviewed** classification for payments")).toBe("Reviewed classification for payments");
    expect(toReviewDisplayTitle("# Heading title")).toBe("Heading title");
  });
});

describe("clampReviewWorkspaceH1Title", () => {
  it("clamps multi-thousand-character markdown blobs to a single markup-free line", () => {
    const blob = `**Reviewed** ${"classification ".repeat(400)}`;
    const title = clampReviewWorkspaceH1Title(blob);

    expect(title.length).toBeLessThanOrEqual(120);
    expect(title).not.toContain("**");
    expect(title).not.toContain("#");
  });
});

describe("stripInlineMarkdownFromReviewText", () => {
  it("removes common inline markdown tokens", () => {
    expect(stripInlineMarkdownFromReviewText("**bold** and `code`")).toBe("bold and code");
  });

  it("strips underscore emphasis only at word boundaries", () => {
    expect(stripInlineMarkdownFromReviewText("an _emphasised_ phrase")).toBe("an emphasized phrase");
    expect(stripInlineMarkdownFromReviewText("__strong__ opener")).toBe("strong opener");
  });

  it("keeps underscored identifiers intact", () => {
    expect(stripInlineMarkdownFromReviewText("my_api_gateway routes traffic")).toBe("my_api_gateway routes traffic");
    expect(toReviewDisplayTitle("Migration of my_api_gateway")).toBe("Migration of my_api_gateway");
  });
});
