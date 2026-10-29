import { describe, expect, it } from "vitest";

import { formatDecisionDeltaOmittedOpenFindingsLine } from "./run-detail-decision-delta-panel-copy";

describe("run-detail-decision-delta-panel-copy", () => {
  it("names omitted open findings beyond severity-sort cap", () => {
    expect(formatDecisionDeltaOmittedOpenFindingsLine(2)).toContain("2 more open findings are stored");
    expect(formatDecisionDeltaOmittedOpenFindingsLine(2)).toContain("severity sort");
  });
});
