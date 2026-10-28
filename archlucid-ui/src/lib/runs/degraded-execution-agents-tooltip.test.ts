import { describe, expect, it } from "vitest";

import { ARCHITECTURE_STRUCTURE_BUYER_LABEL } from "@/lib/usability/canonical-product-terms";

import { degradedExecutionAgentsTooltip } from "./degraded-execution-agents-tooltip";

describe("degradedExecutionAgentsTooltip", () => {
  it("explains missing agent detail when the list is absent or blank", () => {
    expect(degradedExecutionAgentsTooltip(undefined)).toBe(
      "Degraded execution was recorded without agent detail.",
    );
    expect(degradedExecutionAgentsTooltip([])).toBe(
      "Degraded execution was recorded without agent detail.",
    );
    expect(degradedExecutionAgentsTooltip(["", "  "])).toBe(
      "Degraded execution was recorded without agent detail.",
    );
  });

  it("joins buyer labels for named degraded agents", () => {
    expect(degradedExecutionAgentsTooltip(["Topology", "Cost"])).toBe(
      `Resource-level LLM fallback on: ${ARCHITECTURE_STRUCTURE_BUYER_LABEL}, Cost`,
    );
  });
});
