import { describe, expect, it } from "vitest";

import { ARCHITECTURE_INTELLIGENCE_PATH } from "@/lib/architecture-intelligence-route";
import { buildArchitectureIntelligenceRunHref } from "./architecture-intelligence-run-href";

describe("buildArchitectureIntelligenceRunHref", () => {
  it("returns the bare route when no run or from is supplied", () => {
    expect(buildArchitectureIntelligenceRunHref()).toBe(ARCHITECTURE_INTELLIGENCE_PATH);
  });

  it("includes runId and from for review deep links", () => {
    expect(
      buildArchitectureIntelligenceRunHref({
        runId: "run-abc",
        from: "reviews",
      }),
    ).toBe("/architecture-intelligence?runId=run-abc&from=reviews");
  });

  it("includes runId and from for findings deep links", () => {
    expect(
      buildArchitectureIntelligenceRunHref({
        runId: "run-xyz",
        from: "findings",
      }),
    ).toBe("/architecture-intelligence?runId=run-xyz&from=findings");
  });

  it("omits from when direct", () => {
    expect(
      buildArchitectureIntelligenceRunHref({
        runId: "run-1",
        from: "direct",
      }),
    ).toBe("/architecture-intelligence?runId=run-1");
  });
});
