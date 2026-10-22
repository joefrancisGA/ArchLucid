import { describe, expect, it } from "vitest";

import {
  INLINE_GUIDANCE_LABELS,
  parseLeadingInlineGuidanceLabel,
} from "@/lib/inline-guidance-labels";

describe("parseLeadingInlineGuidanceLabel", () => {
  it("matches longest multi-word labels first", () => {
    expect(parseLeadingInlineGuidanceLabel("What to do next: Open exports.")).toEqual({
      label: "What to do next:",
      body: "Open exports.",
    });
  });

  it("returns null when no known label prefix is present", () => {
    expect(parseLeadingInlineGuidanceLabel("Finish architecture reviews first.")).toBeNull();
  });

  it("covers every canonical label", () => {
    for (const label of INLINE_GUIDANCE_LABELS) {
      const parsed = parseLeadingInlineGuidanceLabel(`${label} body copy.`);

      expect(parsed).toEqual({ label, body: "body copy." });
    }
  });
});
