import { describe, expect, it } from "vitest";

import { ACCELERATOR_CHOOSER_ENTRIES } from "@/lib/accelerator-chooser";

describe("accelerator chooser start copy (TB-2136)", () => {
  it("uses buyer-noun expected outputs on every job row", () => {
    for (const entry of ACCELERATOR_CHOOSER_ENTRIES) {
      expect(entry.expectedOutputs.toLowerCase()).toMatch(/Finalized review record|findings|sponsor/);
    }
  });
});
