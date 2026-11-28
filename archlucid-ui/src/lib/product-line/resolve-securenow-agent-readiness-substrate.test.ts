import { describe, expect, it } from "vitest";

import { resolveSecureNowAgentReadinessSubstrate } from "@/lib/product-line/resolve-securenow-agent-readiness-substrate";

describe("resolve-securenow-agent-readiness-substrate", () => {
  it("names simulator discipline", () => {
    const substrate = resolveSecureNowAgentReadinessSubstrate("Simulator");
    expect(substrate?.modeLabel).toContain("Simulator");
    expect(substrate?.explanationLead).toContain("deterministic simulator");
    expect(substrate?.rankDisciplineLine).toContain("SA-09");
  });

  it("names real mode citation bounds", () => {
    const substrate = resolveSecureNowAgentReadinessSubstrate("Real");
    expect(substrate?.modeLabel).toContain("Real");
    expect(substrate?.citationLine).toContain("hop evidence");
    expect(substrate?.notAutonomousLine).toContain("autonomous agent");
  });
});
