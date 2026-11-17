import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { simulatePolicyPackAgainstRun } from "@/lib/api";
import { presentPolicyPackSimulateToast } from "@/lib/policy/policy-pack-simulate-toast";
import {
  usePolicyRuleAuthoringSimulate,
  type UsePolicyRuleAuthoringSimulateParams,
} from "./use-policy-rule-authoring-simulate";

vi.mock("@/lib/api", () => ({
  listRunsByProjectPaged: vi.fn(),
  simulatePolicyPackAgainstRun: vi.fn(),
}));

vi.mock("@/lib/policy/policy-pack-simulate-toast", () => ({
  presentPolicyPackSimulateToast: vi.fn(),
}));

const initialProps: UsePolicyRuleAuthoringSimulateParams = {
  policyContentJson: '{"rules":[]}',
  selectedPackId: "",
  canMutatePacks: true,
  loading: false,
  bundledPublishBlocked: false,
};
const passed = { failedChecks: [] };
const simulate = vi.mocked(simulatePolicyPackAgainstRun);

function renderSimulation() {
  const hook = renderHook(usePolicyRuleAuthoringSimulate, { initialProps });
  act(() => hook.result.current.setSimulateRunId("review-1"));

  return hook;
}

describe("usePolicyRuleAuthoringSimulate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    simulate.mockResolvedValue(passed);
  });

  it("requires a new test after the policy content changes", async () => {
    const { result, rerender } = renderSimulation();
    await act(() => result.current.runSimulation());
    expect(result.current.publishDisabled).toBe(false);

    rerender({ ...initialProps, policyContentJson: '{"rules":[{}]}' });

    expect(result.current.simulateResult).toBeNull();
    expect(result.current.publishDisabled).toBe(true);
    await act(() => result.current.runSimulation());
    expect(result.current.publishDisabled).toBe(false);
  });

  it("requires a new test after the review, critical-block setting, or pack changes", async () => {
    const { result, rerender } = renderSimulation();
    await act(() => result.current.runSimulation());

    act(() => result.current.setSimulateRunId("review-2"));
    expect(result.current.publishDisabled).toBe(true);
    await act(() => result.current.runSimulation());
    expect(result.current.publishDisabled).toBe(false);

    act(() => result.current.setBlockOnCritical(false));
    expect(result.current.publishDisabled).toBe(true);
    await act(() => result.current.runSimulation());
    expect(result.current.publishDisabled).toBe(false);

    rerender({ ...initialProps, selectedPackId: "48932f15-199c-4394-8d7a-b32ea68f9fa2" });
    expect(result.current.publishDisabled).toBe(true);
  });

  it("ignores a passing result that arrives after the author edits the policy", async () => {
    const { promise, resolve } = Promise.withResolvers<Awaited<ReturnType<typeof simulatePolicyPackAgainstRun>>>();
    simulate.mockReturnValueOnce(promise);
    const { result, rerender } = renderSimulation();
    let running: Promise<void> | undefined;

    act(() => {
      running = result.current.runSimulation();
    });
    rerender({ ...initialProps, policyContentJson: '{"rules":[{}]}' });
    await act(async () => {
      resolve(passed);
      await running;
    });

    expect(result.current.simulateResult).toBeNull();
    expect(result.current.publishDisabled).toBe(true);
    expect(presentPolicyPackSimulateToast).not.toHaveBeenCalled();
  });
});
