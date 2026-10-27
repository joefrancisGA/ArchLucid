import { describe, expect, it } from "vitest";

import { RUN_DETAIL_STATIC_DEMO_EXPLANATION_BANNER } from "@/lib/runs/run-detail-static-demo-explanation-copy";

describe("run-detail-static-demo-explanation-copy (P-02)", () => {
  it("states that static demo payloads are not stored explanation responses", () => {
    expect(RUN_DETAIL_STATIC_DEMO_EXPLANATION_BANNER).toContain("static demo");
    expect(RUN_DETAIL_STATIC_DEMO_EXPLANATION_BANNER).toContain("not a stored explanation response");
  });
});
