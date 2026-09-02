import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ReviewsHubActiveFiltersStrip } from "./ReviewsHubActiveFiltersStrip";

describe("ReviewsHubActiveFiltersStrip", () => {
  it("renders clear affordance when filter and search are active", () => {
    const onClear = vi.fn();

    render(
      <ReviewsHubActiveFiltersStrip
        activeFilter="needs-attention"
        searchQuery="payments"
        onClear={onClear}
      />,
    );

    expect(screen.getByTestId("reviews-hub-active-filters-strip")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("reviews-hub-active-filters-clear"));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("renders nothing when no filters are active", () => {
    render(<ReviewsHubActiveFiltersStrip activeFilter="all" searchQuery="" onClear={vi.fn()} />);

    expect(screen.queryByTestId("reviews-hub-active-filters-strip")).toBeNull();
  });
});
