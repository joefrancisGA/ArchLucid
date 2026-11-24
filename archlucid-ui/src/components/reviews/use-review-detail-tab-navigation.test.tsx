import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { useReviewDetailTabNavigation } from "@/components/reviews/ReviewDetailWorkspace";

describe("useReviewDetailTabNavigation", () => {
  beforeEach(() => {
    window.history.replaceState(
      {},
      "",
      "/architecture/reviews/run-abc?reviewTab=findings&findingId=finding-queue-1",
    );
  });

  it("clears findingId from the URL when tab context is absent and the destination is overview", () => {
    const { result } = renderHook(() => useReviewDetailTabNavigation());

    act(() => {
      result.current("overview");
    });

    expect(window.location.search).not.toContain("findingId=");
    expect(window.location.search).toContain("reviewTab=overview");
  });
});
