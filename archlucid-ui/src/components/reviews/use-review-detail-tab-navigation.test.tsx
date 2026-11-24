import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useReviewDetailTabNavigation } from "@/components/reviews/ReviewDetailWorkspace";

describe("useReviewDetailTabNavigation", () => {
  it("clears findingId from the URL when tab context is absent and the destination is overview", () => {
    window.history.replaceState(
      {},
      "",
      "/architecture/reviews/run-abc?reviewTab=findings&findingId=finding-queue-1",
    );

    const { result } = renderHook(() => useReviewDetailTabNavigation());

    act(() => {
      result.current("overview");
    });

    expect(window.location.search).not.toContain("findingId=");
    expect(window.location.search).toContain("reviewTab=overview");
  });

  it("clears workbenchFocus from the URL when tab context is absent and the destination is overview", () => {
    window.history.replaceState(
      {},
      "",
      "/architecture/reviews/run-abc?reviewTab=findings&workbenchFocus=findings",
    );

    const { result } = renderHook(() => useReviewDetailTabNavigation());

    act(() => {
      result.current("overview");
    });

    expect(window.location.search).not.toContain("workbenchFocus=");
    expect(window.location.search).toContain("reviewTab=overview");
  });

  it("clears presenter from the URL when tab context is absent and the destination is overview", () => {
    window.history.replaceState(
      {},
      "",
      "/architecture/reviews/run-abc?reviewTab=findings&presenter=1",
    );

    const { result } = renderHook(() => useReviewDetailTabNavigation());

    act(() => {
      result.current("overview");
    });

    expect(window.location.search).not.toContain("presenter=");
    expect(window.location.search).toContain("reviewTab=overview");
  });
});