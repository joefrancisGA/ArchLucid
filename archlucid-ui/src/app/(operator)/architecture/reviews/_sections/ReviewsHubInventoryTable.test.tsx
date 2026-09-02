import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ReviewsHubInventoryTable } from "./ReviewsHubInventoryTable";

describe("ReviewsHubInventoryTable", () => {
  it("renders an outline clear affordance when the inventory is empty", () => {
    const onClearFilters = vi.fn();

    render(
      <ReviewsHubInventoryTable
        runs={[]}
        siblingRuns={[]}
        ownerContext={{}}
        ariaLabel="Reviews"
        tableTestId="reviews-hub-inventory-table"
        onClearFilters={onClearFilters}
      />,
    );

    expect(screen.getByTestId("reviews-hub-inventory-empty")).toBeInTheDocument();

    const clear = screen.getByTestId("reviews-hub-inventory-empty-clear");

    expect(clear).toHaveClass("border-neutral-300");
    fireEvent.click(clear);
    expect(onClearFilters).toHaveBeenCalledTimes(1);
  });
});
