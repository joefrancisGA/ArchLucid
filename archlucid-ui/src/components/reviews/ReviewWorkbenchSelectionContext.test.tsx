import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ReviewWorkbenchSelectionProvider,
  useReviewWorkbenchSelection,
} from "@/components/reviews/ReviewWorkbenchSelectionContext";
import {
  REVIEW_DETAIL_URL_CHANGED_EVENT,
  writeReviewDetailTabToUrl,
} from "@/lib/review-detail-workspace-tabs";

function SelectionProbe(): React.JSX.Element {
  const selection = useReviewWorkbenchSelection();

  return (
    <div>
      <span data-testid="selected-finding-id">{selection?.selectedFindingId ?? "none"}</span>
      <button
        type="button"
        onClick={() => {
          selection?.setSelectedFindingId(null);
        }}
      >
        Clear finding
      </button>
    </div>
  );
}

describe("ReviewWorkbenchSelectionProvider", () => {
  afterEach(() => {
    window.history.replaceState({}, "", "/");
  });

  it("does not rewrite the URL when replaceState clears findingId and useSearchParams stays stale", () => {
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?reviewTab=overview&findingId=stale-missing");

    const onFindingIdChange = vi.fn();

    render(
      <ReviewWorkbenchSelectionProvider
        initialFindingId="stale-missing"
        onFindingIdChange={(findingId) => {
          onFindingIdChange(findingId);
          writeReviewDetailTabToUrl("overview", {
            findingId,
            workbenchFocus: null,
            presenter: null,
          });
        }}
      >
        <SelectionProbe />
      </ReviewWorkbenchSelectionProvider>,
    );

    expect(screen.getByTestId("selected-finding-id")).toHaveTextContent("stale-missing");

    act(() => {
      screen.getByRole("button", { name: "Clear finding" }).click();
    });

    expect(screen.getByTestId("selected-finding-id")).toHaveTextContent("none");
    expect(onFindingIdChange).toHaveBeenCalledTimes(1);
    expect(onFindingIdChange).toHaveBeenLastCalledWith(null);
    expect(window.location.search).not.toContain("findingId=");

    onFindingIdChange.mockClear();

    act(() => {
      window.dispatchEvent(new Event(REVIEW_DETAIL_URL_CHANGED_EVENT));
    });

    expect(onFindingIdChange).not.toHaveBeenCalled();
    expect(screen.getByTestId("selected-finding-id")).toHaveTextContent("none");
  });
});
