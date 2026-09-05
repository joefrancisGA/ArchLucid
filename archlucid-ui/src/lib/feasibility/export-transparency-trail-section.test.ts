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
});
