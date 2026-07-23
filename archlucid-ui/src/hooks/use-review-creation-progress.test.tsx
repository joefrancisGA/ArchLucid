import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { REVIEW_START_CREATION_FAILED_MESSAGE } from "@/lib/review-start-progress-copy";

import {
  REVIEW_CREATION_PROGRESS_TIMEOUT_MS,
  useReviewCreationProgress,
} from "./use-review-creation-progress";

describe("useReviewCreationProgress", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("fails the CTA when create + navigate never settles", async () => {
    const { result } = renderHook(() => useReviewCreationProgress());

    act(() => {
      result.current.begin({ hasTemplate: false });
    });

    expect(result.current.isActive).toBe(true);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(REVIEW_CREATION_PROGRESS_TIMEOUT_MS);
    });

    expect(result.current.isActive).toBe(false);
    expect(result.current.error).toBe(REVIEW_START_CREATION_FAILED_MESSAGE);
  });
});
