import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.unmock("@/hooks/use-deferred-operator-shell-status-queries-enabled");

import {
  DEFERRED_SHELL_STATUS_QUERY_FALLBACK_MS,
  resetDeferredOperatorShellStatusQueriesForTests,
  useDeferredOperatorShellStatusQueriesEnabled,
} from "@/hooks/use-deferred-operator-shell-status-queries-enabled";

describe("useDeferredOperatorShellStatusQueriesEnabled", () => {
  beforeEach(() => {
    resetDeferredOperatorShellStatusQueriesForTests();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    resetDeferredOperatorShellStatusQueriesForTests();
    vi.useRealTimers();
  });

  it("starts disabled and enables after the idle fallback timeout", async () => {
    const first = renderHook(() => useDeferredOperatorShellStatusQueriesEnabled());

    expect(first.result.current).toBe(false);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(DEFERRED_SHELL_STATUS_QUERY_FALLBACK_MS);
    });

    await waitFor(() => {
      expect(first.result.current).toBe(true);
    });
  });

  it("reuses the shared scheduler for additional consumers", async () => {
    const first = renderHook(() => useDeferredOperatorShellStatusQueriesEnabled());
    const second = renderHook(() => useDeferredOperatorShellStatusQueriesEnabled());

    await act(async () => {
      await vi.advanceTimersByTimeAsync(DEFERRED_SHELL_STATUS_QUERY_FALLBACK_MS);
    });

    await waitFor(() => {
      expect(first.result.current).toBe(true);
      expect(second.result.current).toBe(true);
    });
  });
});
