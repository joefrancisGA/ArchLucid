import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { usePolicyPackVisualBuilder } from "./use-policy-pack-visual-builder";

const { simulate, showSimulationToast } = vi.hoisted(() => ({
  simulate: vi.fn(),
  showSimulationToast: vi.fn(),
}));
const search = new URLSearchParams();

vi.mock("next/navigation", () => ({
  usePathname: () => "/governance/policy-packs",
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => search,
}));
vi.mock("@/lib/api", () => ({ simulatePolicyPackAgainstRun: simulate }));
vi.mock("@/hooks/use-policy-pack-rule-templates-query", () => ({
  usePolicyPackRuleTemplatesQuery: () => ({ data: [] }),
}));
vi.mock("@/lib/policy/policy-pack-simulate-toast", () => ({
  presentPolicyPackSimulateToast: showSimulationToast,
}));

const props = {
  canMutatePacks: true,
  policyContentJson: '{"metadata":{"label":"first draft"}}',
  onPolicyContentJsonSync: vi.fn(),
  selectedPackId: "pack-1",
  scopedReviewId: "review-1",
};
const response = { runId: "review-1" };

beforeEach(() => {
  simulate.mockReset();
  showSimulationToast.mockClear();
});

describe("policy builder validation display", () => {
  it("clears a completed result when the editor contents change", async () => {
    simulate.mockResolvedValueOnce(response);
    const { result } = renderHook(() => usePolicyPackVisualBuilder(props));

    await act(() => result.current.runSimulate());
    expect(result.current.simulateResult).toEqual(response);

    act(() => result.current.onJsonPreviewEdit('{"metadata":{"label":"second draft"}}'));

    expect(result.current.simulateResult).toBeNull();
  });

  it("ignores a pending validation when the selected review changes", async () => {
    let resolveSimulation!: (value: typeof response) => void;
    simulate.mockReturnValueOnce(new Promise((resolve) => { resolveSimulation = resolve; }));
    const { result, rerender } = renderHook(usePolicyPackVisualBuilder, { initialProps: props });
    let request!: Promise<void>;

    act(() => { request = result.current.runSimulate(); });
    expect(simulate).toHaveBeenCalledOnce();
    rerender({ ...props, scopedReviewId: "review-2" });
    await act(async () => {
      resolveSimulation(response);
      await request;
    });

    expect(result.current.simulateResult).toBeNull();
    expect(result.current.simulateBusy).toBe(false);
    expect(showSimulationToast).not.toHaveBeenCalled();
  });
});
