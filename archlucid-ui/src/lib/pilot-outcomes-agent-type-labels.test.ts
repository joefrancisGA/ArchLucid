import { describe, expect, it } from "vitest";

import {
  formatPilotOutcomesAgentTypeLabel,
  formatPilotOutcomesAnalysisCoverage,
} from "@/lib/pilot-outcomes-agent-type-labels";

describe("pilot-outcomes-agent-type-labels", () => {
  it("labels missing analysis coverage and blank agent types", () => {
    expect(formatPilotOutcomesAnalysisCoverage([])).toBe("Analysis coverage was not stored.");
    expect(formatPilotOutcomesAgentTypeLabel("  ")).toBe("Analysis type was not stored.");
  });

  it("keeps mapped agent type labels", () => {
    expect(formatPilotOutcomesAgentTypeLabel("SecurityReviewer")).toBe("Security analysis");
  });
});
