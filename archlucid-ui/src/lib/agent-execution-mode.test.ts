import { describe, expect, it, vi } from "vitest";

import {
  isSimulatorAgentExecutionMode,
  parseAgentExecutionModeWire,
  resolveClientAgentExecutionMode,
} from "@/lib/agent-execution-mode";

const devOverridesEnabled = vi.hoisted(() => ({ value: false }));

vi.mock("@/lib/dev-testing-overrides", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/dev-testing-overrides")>();

  return {
    ...actual,
    isDevTestingOverridesEnabled: () => devOverridesEnabled.value,
  };
});

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
    devOverridesEnabled.value = false;

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

  it("prefers health when dev override cookie is unset in development", () => {
    devOverridesEnabled.value = true;

    expect(
      resolveClientAgentExecutionMode({
        healthAgentExecutionMode: "Simulator",
        devOverride: null,
      }),
    ).toBe("Simulator");
  });

  it("prefers explicit dev override over health in development", () => {
    devOverridesEnabled.value = true;

    expect(
      resolveClientAgentExecutionMode({
        healthAgentExecutionMode: "Simulator",
        devOverride: "Real",
      }),
    ).toBe("Real");
  });
});
