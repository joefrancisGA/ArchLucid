import { describe, expect, it } from "vitest";

import { resolveSecureNowCuttingEdgeSubstrate } from "@/lib/product-line/resolve-securenow-cutting-edge-substrate";

describe("resolve-securenow-cutting-edge-substrate", () => {
  it("names simulator stored-rank substrate", () => {
    const substrate = resolveSecureNowCuttingEdgeSubstrate("Simulator");
    expect(substrate?.substrateLabel).toContain("simulator");
    expect(substrate?.rankDisciplineLine).toContain("SA-09");
    expect(substrate?.notFrontierLine).toContain("frontier AI");
  });

  it("names Real mode Azure OpenAI substrate", () => {
    const substrate = resolveSecureNowCuttingEdgeSubstrate("Real");
    expect(substrate?.explanationSubstrateLine).toContain("Azure OpenAI");
    expect(substrate?.askBoundedLine).toContain("stored path bundle");
  });
});
