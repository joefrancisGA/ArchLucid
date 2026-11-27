import { describe, expect, it } from "vitest";

import { SECURENOW_ACCELERATOR_BROWSER_MEMORY_LINE } from "@/lib/product-line/securenow-accelerator-wave-b-honesty-copy";
import { SECURENOW_ACCELERATOR_STARTER_PACKS_HEADING } from "@/lib/product-line/securenow-accelerator-starter-packs";

describe("score lift round143 batch honesty", () => {
  it("stickiness browser memory is not a usage claim", () => {
    expect(SECURENOW_ACCELERATOR_BROWSER_MEMORY_LINE).toContain("not a usage score");
    expect(SECURENOW_ACCELERATOR_STARTER_PACKS_HEADING).toContain("fixture");
  });
});
