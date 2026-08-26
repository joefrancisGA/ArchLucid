import { describe, expect, it } from "vitest";

import {
  isSimulatorAgentExecutionMode,
  parseAgentExecutionModeWire,
  resolveClientAgentExecutionMode,
} from "@/lib/agent-execution-mode";

describe("agent-execution-mode", () => {
  it("parses simulator and real wire values", () => {
    expect(parseAgentExecutionModeWire("Simulator")).toBe("Simulator");
    expect(parseAgentExecutionModeWire("simulator")).toBe("Simulator");
    expect(parseAgentExecutionModeWire("Real")).toBe("Real");
    expect(parseAgentExecutionModeWire("live")).toBe("Real");
    expect(parseAgentExecutionModeWire("")).toBeNull();
    expect(parseAgentExecutionModeWire(undefined)).toBeNull();
  });

  it("detects simulator mode", () => {
    expect(isSimulatorAgentExecutionMode("Simulator")).toBe(true);
    expect(isSimulatorAgentExecutionMode("Real")).toBe(false);
    expect(isSimulatorAgentExecutionMode(null)).toBe(false);
  });

  it("prefers health agentExecutionMode outside dev overrides", () => {
    expect(
      resolveClientAgentExecutionMode({
        healthAgentExecutionMode: "Simulator",
        devOverride: null,
      }),
    ).toBe("Simulator");

    expect(
      resolveClientAgentExecutionMode({
        healthAgentExecutionMode: "Real",
        devOverride: null,
      }),
    ).toBe("Real");
  });
});
