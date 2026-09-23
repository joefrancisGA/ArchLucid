import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useReviewDetailWorkspaceSelection } from "@/components/reviews/use-review-detail-workspace-selection";
import * as reviewDetailWorkspaceTabs from "@/lib/review-detail-workspace-tabs";

describe("useReviewDetailWorkspaceSelection", () => {
  afterEach(() => {
    window.history.replaceState({}, "", "/");
    vi.restoreAllMocks();
  });

  it("onFindingIdChange only writes findingId (not stale workbenchFocus from searchParams)", () => {
    const writeFindingSpy = vi.spyOn(reviewDetailWorkspaceTabs, "writeReviewDetailFindingIdToUrl");
    const writeTabSpy = vi.spyOn(reviewDetailWorkspaceTabs, "writeReviewDetailTabToUrl");

    const { result } = renderHook(() =>
      useReviewDetailWorkspaceSelection({
        activeTab: "overview",
        initialFindingId: "stale-missing",
        workbenchFocusColumn: "findings",
      }),
    );

    result.current.onFindingIdChange(null);

    expect(writeFindingSpy).toHaveBeenCalledTimes(1);
    expect(writeFindingSpy).toHaveBeenCalledWith(null);
    expect(writeTabSpy).not.toHaveBeenCalled();
  });
});
