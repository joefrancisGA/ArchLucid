import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { REVIEW_START_NAVIGATION_FAILED_MESSAGE } from "@/lib/review-start-progress-copy";
import { SOFT_NAVIGATION_TIMEOUT_MS } from "@/hooks/use-soft-navigation-loading";

const push = vi.fn();
const prefetch = vi.fn();

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
  }),
  usePathname: () => "/",
}));

import { useReviewIntakeNavigation } from "./use-review-intake-navigation";

describe("useReviewIntakeNavigation", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    push.mockReset();
    prefetch.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("recovers from a stalled soft navigation instead of staying depressed", async () => {
    const { result } = renderHook(() => useReviewIntakeNavigation());

    act(() => {
      result.current.navigate({ href: "/reviews/new" });
    });

    expect(result.current.isNavigating).toBe(true);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(SOFT_NAVIGATION_TIMEOUT_MS);
    });

    expect(result.current.isNavigating).toBe(false);
    expect(result.current.error).toBe(REVIEW_START_NAVIGATION_FAILED_MESSAGE);
  });
});
