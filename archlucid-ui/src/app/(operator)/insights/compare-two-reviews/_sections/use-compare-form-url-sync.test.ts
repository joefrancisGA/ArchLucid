import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useSearchParamsMock = vi.fn<() => URLSearchParams>();

vi.mock("next/navigation", async (importOriginal) => {
  const { extendNextNavigationVitestMock } = await import("@/testing/next-navigation-vitest-mock");

  return extendNextNavigationVitestMock(importOriginal as () => Promise<typeof import("next/navigation")>, {
    useSearchParams: () => useSearchParamsMock(),
  });
});

import { useCompareFormUrlSync } from "./use-compare-form-url-sync";

describe("useCompareFormUrlSync", () => {
  const setLeftRunId = vi.fn();
  const setRightRunId = vi.fn();
  const runCompareForPair = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    useSearchParamsMock.mockReturnValue(new URLSearchParams());
  });

  it("re-runs auto-compare when URL pair changes after a prior deep link", async () => {
    useSearchParamsMock.mockReturnValue(new URLSearchParams("priorRunId=run-a&laterRunId=run-b"));

    const { rerender } = renderHook(() =>
      useCompareFormUrlSync({ setLeftRunId, setRightRunId, runCompareForPair }),
    );

    await waitFor(() => {
      expect(runCompareForPair).toHaveBeenCalledWith("run-a", "run-b");
    });
    expect(runCompareForPair).toHaveBeenCalledTimes(1);

    useSearchParamsMock.mockReturnValue(new URLSearchParams("priorRunId=run-c&laterRunId=run-d"));
    rerender();

    await waitFor(() => {
      expect(runCompareForPair).toHaveBeenCalledWith("run-c", "run-d");
    });
    expect(runCompareForPair).toHaveBeenCalledTimes(2);
  });
});
