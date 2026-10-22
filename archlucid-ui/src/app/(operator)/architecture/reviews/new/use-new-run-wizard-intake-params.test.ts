import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const useSearchParams = vi.fn();

vi.mock("next/navigation", () => ({
  useSearchParams: () => useSearchParams(),
}));

import { POLICY_PACK_ID_QUERY_PARAM } from "@/lib/policy/policy-packs-deep-link";

import { useNewRunWizardIntakeParams } from "./use-new-run-wizard-intake-params";

describe("useNewRunWizardIntakeParams", () => {
  it("sets baselineFirst only for an exact baseline=1 query value", () => {
    useSearchParams.mockReturnValue(new URLSearchParams("baseline=1"));

    const { result } = renderHook(() => useNewRunWizardIntakeParams());

    expect(result.current.baselineFirst).toBe(true);
  });

  it("does not set baselineFirst when baseline query is padded whitespace", () => {
    useSearchParams.mockReturnValue(new URLSearchParams("baseline=%201"));

    const { result } = renderHook(() => useNewRunWizardIntakeParams());

    expect(result.current.baselineFirst).toBe(false);
  });

  it("exposes trimmed packId from governance deep links without catalog validation", () => {
    useSearchParams.mockReturnValue(
      new URLSearchParams(`${POLICY_PACK_ID_QUERY_PARAM}=retired-pack-typo`),
    );

    const { result } = renderHook(() => useNewRunWizardIntakeParams());

    expect(result.current.deeplinkPolicyPackId).toBe("retired-pack-typo");
  });
});
