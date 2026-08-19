import { describe, expect, it } from "vitest";

import { splitBuyerAskSponsorLead } from "@/lib/ask-sponsor-lead";

describe("splitBuyerAskSponsorLead", () => {
  it("splits on the first sentence terminator when present", () => {
    const out = splitBuyerAskSponsorLead("First idea. Second idea.");

    expect(out.sentence).toBe("First idea.");
    expect(out.rest).toBe("Second idea.");
  });

  it("returns the full trimmed span when no terminator exists", () => {
    const out = splitBuyerAskSponsorLead("  No terminator here ");

    expect(out.sentence).toBe("No terminator here");
    expect(out.rest).toBe("");
  });
});
