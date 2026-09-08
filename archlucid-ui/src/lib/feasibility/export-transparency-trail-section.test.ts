import { describe, expect, it } from "vitest";

import { formatTransparencyTrailMarkdownSection } from "./export-transparency-trail-section";

describe("formatTransparencyTrailMarkdownSection", () => {
  it("renders asserted, inferred, and skipped MUST sections", () => {
    const markdown = formatTransparencyTrailMarkdownSection({
      asserted: [{ key: "businessOutcome", value: "Reduce triage time" }],
      inferred: [{ key: "restEncryption", value: "Encrypt data at rest", confidence: 85 }],
      skipped: [{ questionKey: "l0.pillar.security", tier: "Must" }],
    });

    expect(markdown).toContain("## Transparency trail");
    expect(markdown).toContain("### Asserted (1)");
    expect(markdown).toContain("### Skipped MUST questions (1)");
    expect(markdown).toContain("l0.pillar.security");
  });

  it("returns career export banner when trail is absent", () => {
    expect(formatTransparencyTrailMarkdownSection(null)).toContain("Career export blocked");
  });

  it("routes open-questions trail rows to a working-document bucket (LP-16)", () => {
    const markdown = formatTransparencyTrailMarkdownSection({
      asserted: [
        { key: "businessOutcome", value: "Reduce triage time" },
        { key: "openQuestions", value: "Who owns retention policy?" },
      ],
      inferred: [],
      skipped: [{ questionKey: "must.cloud.target", tier: "Must" }],
    });

    expect(markdown).toContain("### Asserted (1)");
    const assertedSection = markdown.split("### Inferred")[0] ?? "";
    expect(assertedSection).not.toContain("openQuestions:");
    expect(markdown).toContain("Open questions (working document — not sealed)");
    expect(markdown).toContain("Working document — not sealed");
    expect(markdown).toContain("- openQuestions: Who owns retention policy?");
  });
});
