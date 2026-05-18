import { describe, expect, it } from "vitest";

import { splitBuyerAskExecutiveLead } from "@/lib/ask-executive-lead";

describe("splitBuyerAskExecutiveLead", () => {
  it("splits on the first sentence terminator when present", () => {
    const out = splitBuyerAskExecutiveLead("First idea. Second idea.");

    expect(out.sentence).toBe("First idea.");
    expect(out.rest).toBe("Second idea.");
  });

  it("returns the full trimmed span when no terminator exists", () => {
    const out = splitBuyerAskExecutiveLead("  No terminator here ");

    expect(out.sentence).toBe("No terminator here");
    expect(out.rest).toBe("");
  });
});
