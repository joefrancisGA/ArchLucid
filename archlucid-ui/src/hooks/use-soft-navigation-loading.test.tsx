import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
const prefetch = vi.fn();
const refresh = vi.fn();

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");

  return {
    ...actual,
    useTransition: () => [false, (callback: () => void) => callback()] as const,
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
    prefetch,
    refresh,
    replace: vi.fn(),
  }),
}));

import {
  SOFT_NAVIGATION_TIMEOUT_MS,
  useSoftNavigationLoading,
} from "./use-soft-navigation-loading";

describe("useSoftNavigationLoading", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    push.mockReset();
    prefetch.mockReset();
    refresh.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("releases a depressed CTA after the soft-nav timeout", async () => {
    const { result } = renderHook(() =>
      useSoftNavigationLoading({ timeoutErrorMessage: "Navigation timed out." }),
    );

    act(() => {
      expect(result.current.navigate("/reviews/new")).toBe(true);
    });

    expect(result.current.isNavigating).toBe(true);
    expect(push).toHaveBeenCalledWith("/reviews/new");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(SOFT_NAVIGATION_TIMEOUT_MS);
    });

    expect(result.current.isNavigating).toBe(false);
    expect(result.current.error).toBe("Navigation timed out.");
  });

  it("supports RSC refresh without a href prefetch", async () => {
    const { result } = renderHook(() => useSoftNavigationLoading());

    act(() => {
      expect(result.current.navigate("", "refresh")).toBe(true);
    });

    expect(refresh).toHaveBeenCalled();
    expect(prefetch).not.toHaveBeenCalled();
  });
});
