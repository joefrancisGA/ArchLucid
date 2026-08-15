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
  usePathname: () => "/",
}));

import {
  SOFT_NAVIGATION_TIMEOUT_MS,
  useSoftNavigationLoading,
} from "./use-soft-navigation-loading";

describe("useSoftNavigationLoading", () => {
  const assign = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    push.mockReset();
    prefetch.mockReset();
    refresh.mockReset();
    assign.mockReset();
    vi.stubGlobal("location", {
      ...window.location,
      pathname: "/",
      origin: "http://localhost",
      assign,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("hard-navigates when soft push never commits the URL", async () => {
    const { result } = renderHook(() =>
      useSoftNavigationLoading({ timeoutErrorMessage: "Navigation timed out." }),
    );

    act(() => {
      expect(result.current.navigate("/architecture/reviews/customer-intake-modernization")).toBe(true);
    });

    expect(result.current.isNavigating).toBe(true);
    expect(push).toHaveBeenCalledWith("/architecture/reviews/customer-intake-modernization");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(SOFT_NAVIGATION_TIMEOUT_MS);
    });

    expect(result.current.isNavigating).toBe(false);
    expect(assign).toHaveBeenCalledWith("/architecture/reviews/customer-intake-modernization");
    expect(result.current.error).toBeNull();
  });

  it("keeps the timeout armed when startTransition settles without a URL commit", async () => {
    const { result } = renderHook(() => useSoftNavigationLoading());

    act(() => {
      expect(result.current.navigate("/architecture/reviews/new")).toBe(true);
    });

    // Transition callback runs synchronously under the mock; URL still "/".
    expect(result.current.isNavigating).toBe(true);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(SOFT_NAVIGATION_TIMEOUT_MS - 1);
    });

    expect(assign).not.toHaveBeenCalled();
    expect(result.current.isNavigating).toBe(true);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });

    expect(assign).toHaveBeenCalledWith("/architecture/reviews/new");
  });

  it("sets timeout error when hard-nav fallback is disabled", async () => {
    const { result } = renderHook(() =>
      useSoftNavigationLoading({
        timeoutErrorMessage: "Navigation timed out.",
        hardNavigateOnTimeout: false,
      }),
    );

    act(() => {
      expect(result.current.navigate("/architecture/reviews/new")).toBe(true);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(SOFT_NAVIGATION_TIMEOUT_MS);
    });

    expect(assign).not.toHaveBeenCalled();
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
