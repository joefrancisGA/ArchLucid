import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const useSearchParams = vi.fn();

vi.mock("next/navigation", () => ({
  useSearchParams: () => useSearchParams(),
}));

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
});
