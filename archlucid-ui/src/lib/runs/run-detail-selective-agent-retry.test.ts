import { describe, expect, it } from "vitest";

import { resolveFailedAgentTypesForSelectiveRetry } from "@/lib/runs/run-detail-selective-agent-retry";

describe("resolveFailedAgentTypesForSelectiveRetry (TB-938)", () => {
  it("returns empty when all succeeded", () => {
    expect(
      resolveFailedAgentTypesForSelectiveRetry([
        { agentType: "Topology", outcome: "Succeeded" },
        { agentType: "Cost", outcome: "Succeeded" },
      ]),
    ).toEqual([]);
  });

  it("returns incomplete agent types only", () => {
    expect(
      resolveFailedAgentTypesForSelectiveRetry([
        { agentType: "Topology", outcome: "Succeeded" },
        { agentType: "Cost", outcome: "Missing" },
        { agentType: "Critic", outcome: "Failed" },
      ]),
    ).toEqual(["Cost", "Critic"]);
  });
});
