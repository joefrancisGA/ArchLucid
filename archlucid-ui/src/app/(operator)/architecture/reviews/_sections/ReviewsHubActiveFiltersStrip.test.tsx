import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ReviewsHubActiveFiltersStrip } from "./ReviewsHubActiveFiltersStrip";

describe("ReviewsHubActiveFiltersStrip", () => {
  it("dismisses search and filter chips independently", () => {
    const onClearSearch = vi.fn();
    const onClearFilter = vi.fn();

    render(
      <ReviewsHubActiveFiltersStrip
        activeFilter="needs-attention"
        searchQuery="payments"
        onClearSearch={onClearSearch}
        onClearFilter={onClearFilter}
      />,
    );

    expect(screen.getByTestId("reviews-hub-active-filters-strip")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("reviews-hub-active-search-chip-dismiss"));
    expect(onClearSearch).toHaveBeenCalledTimes(1);
    expect(onClearFilter).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId("reviews-hub-active-filter-chip-dismiss"));
    expect(onClearFilter).toHaveBeenCalledTimes(1);
  });

  it("renders nothing when no filters are active", () => {
    render(
      <ReviewsHubActiveFiltersStrip
        activeFilter="all"
        searchQuery=""
        onClearSearch={vi.fn()}
        onClearFilter={vi.fn()}
      />,
    );

    expect(screen.queryByTestId("reviews-hub-active-filters-strip")).toBeNull();
  });
});
