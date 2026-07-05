import { describe, expect, it } from "vitest";

import { emphasizeInlineGuidanceLabels } from "@/lib/help-markdown-presentation";

describe("emphasizeInlineGuidanceLabels", () => {
  it("bolds metadata labels at line start when not already emphasized", () => {
    const input = "Audience: principal architects\n**Last reviewed:** 2026-06-15\nNote: illustrative dates only.";

    expect(emphasizeInlineGuidanceLabels(input)).toBe(
      "**Audience:** principal architects\n**Last reviewed:** 2026-06-15\n**Note:** illustrative dates only.",
    );
  });

  it("bolds guidance labels inside list items", () => {
    const input = "- Optional: configure routing after your first rule.";

    expect(emphasizeInlineGuidanceLabels(input)).toBe(
      "- **Optional:** configure routing after your first rule.",
    );
  });

  it("does not change fenced code blocks", () => {
    const input = "```\nStatus: Pending\n```";

    expect(emphasizeInlineGuidanceLabels(input)).toBe(input);
  });
});
