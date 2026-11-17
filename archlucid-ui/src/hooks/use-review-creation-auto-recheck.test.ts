import { act, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import { useReviewCreationAutoRecheck } from "@/hooks/use-review-creation-auto-recheck";

afterEach(() => vi.useRealTimers());

it("does not spend an automatic retry when a pending timer is canceled", () => {
  vi.useFakeTimers();
  const onRecheck = vi.fn();
  const outcome = { kind: "unresolved" } as const;
  const { rerender, result } = renderHook(
    ({ isActive }) => useReviewCreationAutoRecheck({ outcome, isActive, onRecheck }),
    { initialProps: { isActive: false } },
  );

  for (let index = 0; index < 4; index += 1) {
    rerender({ isActive: true });
    rerender({ isActive: false });
  }

  expect(result.current.autoRecheckExhausted).toBe(false);
  act(() => vi.advanceTimersByTime(2_000));
  expect(onRecheck).toHaveBeenCalledOnce();
});
