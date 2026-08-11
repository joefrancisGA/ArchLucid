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

  it("reports an unresolved outcome when create never settles", async () => {
    const { result } = renderHook(() => useReviewCreationProgress());

    act(() => {
      result.current.begin({ hasTemplate: false });
    });

    expect(result.current.isActive).toBe(true);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(REVIEW_CREATION_PROGRESS_TIMEOUT_MS);
    });

    expect(result.current.isActive).toBe(false);
    expect(result.current.outcome).toEqual({ kind: "unresolved" });
  });

  it("starts without stage hints rather than throwing mid-submit", () => {
    const { result } = renderHook(() => useReviewCreationProgress());

    act(() => {
      result.current.begin();
    });

    expect(result.current.isActive).toBe(true);
    expect(result.current.stages.some((stage) => stage.id === "applying-template")).toBe(false);
  });

  it("shows staged progress immediately when begin is called", () => {
    const { result } = renderHook(() => useReviewCreationProgress());

    act(() => {
      result.current.begin({ hasTemplate: false });
    });

    expect(result.current.showStagedPanel).toBe(true);
  });

  it("reports a failed outcome carrying the server message", () => {
    const { result } = renderHook(() => useReviewCreationProgress());

    act(() => {
      result.current.begin({ hasTemplate: false });
    });

    act(() => {
      result.current.fail();
    });

    expect(result.current.isActive).toBe(false);
    expect(result.current.outcome).toEqual({
      kind: "failed",
      message: REVIEW_START_CREATION_FAILED_MESSAGE,
    });
  });

  it("disarms the watchdog once the server accepts, so slow navigation stays silent", async () => {
    const { result } = renderHook(() => useReviewCreationProgress());

    act(() => {
      result.current.begin({ hasTemplate: false });
    });

    act(() => {
      result.current.succeed();
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(REVIEW_CREATION_PROGRESS_TIMEOUT_MS * 2);
    });

    expect(result.current.outcome).toBeNull();
    expect(result.current.isActive).toBe(true);
  });

  it("escalates wait copy as the operation runs long, without a percentage", async () => {
    const { result } = renderHook(() => useReviewCreationProgress());

    act(() => {
      result.current.begin({ hasTemplate: false });
    });

    expect(result.current.waitCopy?.level).toBe("quiet");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(31_000);
    });

    expect(result.current.waitCopy?.level).toBe("after30s");
    expect(result.current.waitCopy?.detail).not.toMatch(/%/);
  });
});
