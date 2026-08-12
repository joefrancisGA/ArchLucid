import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  REVIEW_START_NAVIGATION_STALL_TIMEOUT_MS,
  REVIEW_START_OPENING_LABEL,
  REVIEW_START_STAGED_PANEL_DELAY_MS,
} from "@/lib/review-start-progress-copy";
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

const REVIEWS_NEW_HREF = "/architecture/reviews/new";

describe("useReviewIntakeNavigation", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    push.mockReset();
    prefetch.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps staged progress up past the generic soft-nav budget while the route is still loading", async () => {
    const { result } = renderHook(() => useReviewIntakeNavigation());

    act(() => {
      result.current.navigate({ href: REVIEWS_NEW_HREF });
    });

    expect(result.current.isNavigating).toBe(true);
    expect(push).toHaveBeenCalledWith(REVIEWS_NEW_HREF);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(REVIEW_START_STAGED_PANEL_DELAY_MS);
    });

    expect(result.current.showStagedPanel).toBe(true);
    expect(result.current.activeStageId).toBe("opening-review");
    expect(result.current.loadingLabel).toBe(REVIEW_START_OPENING_LABEL);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(SOFT_NAVIGATION_TIMEOUT_MS);
    });

    expect(result.current.isNavigating).toBe(true);
    expect(result.current.stalled).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("reports a stalled navigation as recoverable rather than failed", async () => {
    const { result } = renderHook(() => useReviewIntakeNavigation());

    act(() => {
      result.current.navigate({ href: REVIEWS_NEW_HREF });
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(REVIEW_START_NAVIGATION_STALL_TIMEOUT_MS);
    });

    expect(result.current.stalled).toBe(true);
    expect(result.current.stalledHref).toBe(REVIEWS_NEW_HREF);
    expect(result.current.isNavigating).toBe(false);
    // Never claim failure for a navigation the server may still be answering.
    expect(result.current.error).toBeNull();
  });

  it("walks template stages when a template is selected", async () => {
    const { result } = renderHook(() => useReviewIntakeNavigation());

    act(() => {
      result.current.navigate({ href: REVIEWS_NEW_HREF, hasTemplate: true });
    });

    expect(result.current.stages.map((stage) => stage.id)).toEqual([
      "creating-workspace",
      "applying-template",
      "preparing-questions",
      "opening-review",
    ]);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(result.current.activeStageId).toBe("applying-template");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });

    expect(result.current.activeStageId).toBe("opening-review");
  });

  it("clears stage and stall state on reset", async () => {
    const { result } = renderHook(() => useReviewIntakeNavigation());

    act(() => {
      result.current.navigate({ href: REVIEWS_NEW_HREF });
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(REVIEW_START_NAVIGATION_STALL_TIMEOUT_MS);
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.stalled).toBe(false);
    expect(result.current.stalledHref).toBeNull();
    expect(result.current.activeStageId).toBeNull();
    expect(result.current.showStagedPanel).toBe(false);
  });
});
