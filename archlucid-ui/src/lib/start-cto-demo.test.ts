import { describe, expect, it } from "vitest";

import { BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS } from "@/lib/buyer/buyer-golden-journey-nav";
import { getStartCtoDemoHref } from "@/lib/start-cto-demo";

describe("getStartCtoDemoHref", () => {
  it("matches buyer golden journey step 1 href", () => {
    expect(getStartCtoDemoHref()).toBe(BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS[0].href);
  });
});
