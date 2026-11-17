import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useAdvisoryScheduleReviewAvailability } from "@/hooks/use-advisory-schedule-review-availability";

const query = vi.hoisted(() => ({
  data: { items: [], loadError: true },
  isPending: false,
  isError: false,
  refetch: vi.fn(),
}));

vi.mock("@/hooks/use-ask-project-runs-query", () => ({
  useAskProjectRunsQuery: () => query,
}));

describe("useAdvisoryScheduleReviewAvailability", () => {
  it("distinguishes a failed lookup from a confirmed empty list", () => {
    const { result, rerender } = renderHook(() => useAdvisoryScheduleReviewAvailability("project"));

    expect(result.current.loadFailed).toBe(true);
    expect(result.current.hasFinalizedReviews).toBe(false);
    result.current.retry();
    expect(query.refetch).toHaveBeenCalledOnce();

    query.data = { items: [], loadError: false };
    rerender();

    expect(result.current.loadFailed).toBe(false);
    expect(result.current.hasFinalizedReviews).toBe(false);
  });
});
