import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { REFRESH_MINIMUM_BUSY_MS, useMinimumBusyFeedback } from "./refresh-minimum-busy";

describe("useMinimumBusyFeedback", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps display busy for the minimum window after a fast refresh completes", () => {
    const { result, rerender } = renderHook(({ busy }) => useMinimumBusyFeedback(busy), {
      initialProps: { busy: false },
    });

    expect(result.current).toBe(false);

    rerender({ busy: true });
    expect(result.current).toBe(true);

    rerender({ busy: false });
    expect(result.current).toBe(true);

    act(() => {
      vi.advanceTimersByTime(REFRESH_MINIMUM_BUSY_MS - 1);
    });
    expect(result.current).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe(false);
  });

  it("releases immediately when the refresh already exceeded the minimum window", () => {
    const { result, rerender } = renderHook(({ busy }) => useMinimumBusyFeedback(busy), {
      initialProps: { busy: false },
    });

    rerender({ busy: true });

    act(() => {
      vi.advanceTimersByTime(REFRESH_MINIMUM_BUSY_MS + 50);
    });

    rerender({ busy: false });
    expect(result.current).toBe(false);
  });
});
