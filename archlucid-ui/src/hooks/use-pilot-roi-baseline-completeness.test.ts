import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { usePilotRoiBaselineCompleteness } from "@/hooks/use-pilot-roi-baseline-completeness";

vi.mock("@/lib/auth-config", () => ({
  AUTH_MODE: "development-bypass",
}));

vi.mock("@/lib/demo-ui-env", () => ({
  isNextPublicDemoMode: () => false,
}));

describe("usePilotRoiBaselineCompleteness", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not fetch on mount when enabled is false", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");

    const { result } = renderHook(() => usePilotRoiBaselineCompleteness({ enabled: false }));

    expect(result.current.loading).toBe(false);
    expect(result.current.complete).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fetches when reload is called after enabled false", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      headers: new Headers(),
      text: async () =>
        JSON.stringify({
          baselineReviewCycleHours: 40,
          manualPrepHoursPerReview: 8,
        }),
    } as Response);

    const { result } = renderHook(() => usePilotRoiBaselineCompleteness({ enabled: false }));

    void result.current.reload();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.complete).toBe(true);
    });

    const baselineCall = fetchMock.mock.calls.find(([input]) => String(input).includes("/v1/tenant/baseline"));

    expect(baselineCall).toBeDefined();
  });
});
