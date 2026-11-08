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
    expect(formatTransparencyTrailMarkdownSection(null)).toContain("Record export blocked");
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

  it("reports missing asserted metadata while preserving stored empty strings", () => {
    const missing = formatTransparencyTrailMarkdownSection({
      asserted: [{ key: "businessOutcome", value: "Reduce triage time" }],
      inferred: [],
      skipped: [],
    });
    const storedEmpty = formatTransparencyTrailMarkdownSection({
      asserted: [
        {
          key: "businessOutcome",
          value: "Reduce triage time",
          responderLabel: "",
          questionId: "",
          recordedUtc: "",
        },
      ],
      inferred: [],
      skipped: [],
    });

    expect(missing).toContain("Responder was not stored.");
    expect(missing).toContain("Question id was not stored.");
    expect(missing).toContain("Answer recorded time was not stored.");
    expect(storedEmpty).toContain("Responder was stored empty.");
    expect(storedEmpty).not.toContain("Responder was not stored.");
  });

  it("states when skipped questions were not recorded on a complete trail", () => {
    const markdown = formatTransparencyTrailMarkdownSection({
      asserted: [{ key: "businessOutcome", value: "Reduce triage time" }],
      inferred: [],
      skipped: [],
    });

    expect(markdown).toContain("Skipped MUST questions were stored empty.");
    expect(markdown).toContain("Skipped questions were not recorded on this transparency trail.");
    expect(markdown).not.toContain("_None recorded._");
  });

  it("labels stored-empty asserted and inferred lists on a complete trail", () => {
    const markdown = formatTransparencyTrailMarkdownSection({
      asserted: [],
      inferred: [],
      skipped: [{ questionKey: "must.cloud.target", tier: "Must" }],
    });

    expect(markdown).toContain("Asserted entries were stored empty.");
    expect(markdown).toContain("Inferred entries were stored empty.");
  });
});
