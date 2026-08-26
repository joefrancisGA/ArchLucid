import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useAgentExecutionMode } from "@/hooks/use-agent-execution-mode";

const healthState = vi.hoisted(() => ({
  agentExecutionMode: undefined as string | undefined,
  isPending: false,
}));

vi.mock("@/hooks/use-health-ready-summary-query", () => ({
  useHealthReadySummaryQuery: () => ({
    data:
      healthState.agentExecutionMode === undefined
        ? null
        : { status: "Healthy", agentExecutionMode: healthState.agentExecutionMode, entries: [] },
    isPending: healthState.isPending,
  }),
}));

vi.mock("@/lib/dev-testing-overrides", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/dev-testing-overrides")>();

  return {
    ...actual,
    isDevTestingOverridesEnabled: () => false,
  };
});

describe("useAgentExecutionMode", () => {
  it("reads simulator mode from health ready summary", () => {
    healthState.agentExecutionMode = "Simulator";
    healthState.isPending = false;

    const { result } = renderHook(() => useAgentExecutionMode());

    expect(result.current.mode).toBe("Simulator");
    expect(result.current.isSimulator).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it("reports loading until health resolves", () => {
    healthState.agentExecutionMode = undefined;
    healthState.isPending = true;

    const { result } = renderHook(() => useAgentExecutionMode());

    expect(result.current.mode).toBeNull();
    expect(result.current.isLoading).toBe(true);
  });
});
