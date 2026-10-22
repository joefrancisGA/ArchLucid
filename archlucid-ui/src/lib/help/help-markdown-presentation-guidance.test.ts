import { describe, expect, it } from "vitest";

import { emphasizeInlineGuidanceLabels } from "@/lib/help/help-markdown-presentation";

describe("emphasizeInlineGuidanceLabels", () => {
  it("bolds metadata labels at line start when not already emphasized", () => {
    const input = "Audience: principal architects\n**Last reviewed:** 2026-06-15\nNote: illustrative dates only.";

    expect(emphasizeInlineGuidanceLabels(input)).toBe(
      "**Audience:** principal architects\n**Last reviewed:** 2026-06-15\n**Note:** Illustrative dates only.",
    );
  });

  it("bolds optional setup labels inside list items", () => {
    const input = "- Optional setup: connect cloud and invite a reviewer.";

    expect(emphasizeInlineGuidanceLabels(input)).toBe(
      "- **Optional setup:** Connect cloud and invite a reviewer.",
    );
  });

  it("bolds guidance labels inside list items", () => {
    const input = "- Optional: configure routing after your first rule.";

    expect(emphasizeInlineGuidanceLabels(input)).toBe(
      "- **Optional:** Configure routing after your first rule.",
    );
  });

  it("bolds quick start scan labels in help markdown", () => {
    const input = "Quick start: First Real Value (`archlucid try --real`, `ARCHLUCID_REAL_AOAI=1`).";

    expect(emphasizeInlineGuidanceLabels(input)).toBe(
      "**Quick start:** First Real Value (`archlucid try --real`, `ARCHLUCID_REAL_AOAI=1`).",
    );
  });

  it("does not change fenced code blocks", () => {
    const input = "```\nStatus: Pending\n```";

    expect(emphasizeInlineGuidanceLabels(input)).toBe(input);
  });
});
