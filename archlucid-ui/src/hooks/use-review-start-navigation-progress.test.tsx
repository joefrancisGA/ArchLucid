import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  REVIEW_START_NAVIGATION_STALL_TIMEOUT_MS,
  REVIEW_START_OPENING_LABEL,
  REVIEW_START_PREPARING_LABEL,
} from "@/lib/review-start-progress-copy";
import { LONG_OPERATION_ESCALATION_30S_MS } from "@/lib/operations/long-operation-wait-copy";

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
  usePathname: () => "/architecture/architectures/arch-001",
}));

import { useReviewStartNavigationProgress } from "./use-review-start-navigation-progress";

const START_REVIEW_HREF = "/architecture/reviews/new?path=guided-intake&sourceArchitectureId=arch-001";

beforeEach(() => {
  vi.useFakeTimers();
  push.mockReset();
  prefetch.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useReviewStartNavigationProgress", () => {
  it("shows the first stage as soon as preparation begins, before any navigation", () => {
    const { result } = renderHook(() => useReviewStartNavigationProgress());

    expect(result.current.isActive).toBe(false);
    expect(result.current.stageId).toBeNull();

    act(() => {
      result.current.begin();
    });

    expect(result.current.isActive).toBe(true);
    expect(result.current.isPending).toBe(true);
    expect(result.current.stageId).toBe("creating-workspace");
    expect(result.current.loadingLabel).toBe(REVIEW_START_PREPARING_LABEL);
    expect(push).not.toHaveBeenCalled();
  });

  it("keeps the progress chrome up while the navigation is still outstanding", async () => {
    const { result } = renderHook(() => useReviewStartNavigationProgress());

    act(() => {
      result.current.begin();
      result.current.markPreparingQuestions();
      result.current.openReview(START_REVIEW_HREF);
    });

    expect(push).toHaveBeenCalledWith(START_REVIEW_HREF);
    expect(result.current.stageId).toBe("opening-review");
    expect(result.current.loadingLabel).toBe(REVIEW_START_OPENING_LABEL);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(LONG_OPERATION_ESCALATION_30S_MS);
    });

    expect(result.current.isPending).toBe(true);
    expect(result.current.stalled).toBe(false);
    expect(result.current.waitCopy.level).toBe("after30s");
  });

  it("offers recovery instead of a silent idle CTA when the navigation never commits", async () => {
    const { result } = renderHook(() => useReviewStartNavigationProgress());

    act(() => {
      result.current.begin();
      result.current.openReview(START_REVIEW_HREF);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(REVIEW_START_NAVIGATION_STALL_TIMEOUT_MS);
    });

    expect(result.current.stalled).toBe(true);
    expect(result.current.isPending).toBe(false);
    // Chrome stays up: the pending navigation was not canceled by giving up on the wait.
    expect(result.current.isActive).toBe(true);
  });

  it("clears stage and stall state on reset", async () => {
    const { result } = renderHook(() => useReviewStartNavigationProgress());

    act(() => {
      result.current.begin();
      result.current.openReview(START_REVIEW_HREF);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(REVIEW_START_NAVIGATION_STALL_TIMEOUT_MS);
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.isActive).toBe(false);
    expect(result.current.stalled).toBe(false);
    expect(result.current.stageId).toBeNull();
  });
});
